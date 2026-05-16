import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";
import type { Socket } from "socket.io-client";
import { useTheme } from "../theme/ThemeContext";
import { useMediaPermissions } from "../hooks/useMediaPermissions";
import { useWebRTC } from "../hooks/useWebRTC";
import { useAppLifecycle } from "../hooks/useAppLifecycle";
import { createVideoSocket, attachVideoSocketListeners, emitJoinSession, emitReady, emitJoinCall, emitChatMessage, emitLeaveSession, startHeartbeat, stopHeartbeat, emitTypingWithDebounce } from "../services/videoSocket";
import type { MobileUser } from "../services/backend";
import { ConnectionQualityBadge } from "../components/ConnectionQualityBadge";
import { VideoToastZone, useVideoToast } from "../components/VideoToast";
import { ReconnectionOverlay } from "../components/ReconnectionOverlay";
import { InCallChat, ChatBadge, type InCallChatMessage } from "../components/InCallChat";

interface Props { sessionId: number; onBack: () => void; user?: MobileUser | null; }

export const VideoCallScreen: React.FC<Props> = ({ sessionId, onBack, user }) => {
  const { colors } = useTheme();
  const perms = useMediaPermissions();
  const rtc = useWebRTC(sessionId);
  const { toasts, showToast } = useVideoToast();

  const [phase, setPhase] = useState<"lobby" | "call">("lobby");
  const [status, setStatus] = useState("Initializing…");
  const [canJoin, setCanJoin] = useState(false);
  const [timer, setTimer] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<InCallChatMessage[]>([]);
  const [chatUnread, setChatUnread] = useState(0);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [endModalVisible, setEndModalVisible] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatIdRef = useRef(0);
  const userId = user?.id ?? 0;
  const initials = user ? (user.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()) : "ME";

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    console.log(`[VideoCall] Initializing for session ${sessionId}, user: ${user?.fullName} (${user?.role})`);

    // 1) Connect socket FIRST — lobby signaling must work regardless of media
    setStatus("Connecting…");
    const socket = createVideoSocket();
    socketRef.current = socket;
    rtc.setSocket(socket);

    attachVideoSocketListeners(socket, {
      onConnect: () => { 
        if (!mounted) return; 
        console.log("[VideoCall] Socket connected");
        setReconnecting(false); 
        emitJoinSession(socket, sessionId); 
        startHeartbeat(socket, sessionId); 
      },
      onDisconnect: () => { 
        if (!mounted) return; 
        console.log("[VideoCall] Socket disconnected");
        setReconnecting(true); 
        stopHeartbeat(); 
      },
      onSessionJoined: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Joined session:", d);
        const hasCounselor = d.participants.some(p => p.role === "office_admin" || p.role === "super_admin"); 
        setStatus(hasCounselor ? "Counselor present. Ready to join." : "Waiting for counselor…"); 
        if (hasCounselor) {
          console.log("[VideoCall] Counselor already present, emitting ready");
          emitReady(socket, sessionId); 
        }
      },
      onUserJoined: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] User joined lobby:", d.name, d.role);
        if (d.role === "office_admin" || d.role === "super_admin") { 
          setStatus("Counselor joined!"); 
          emitReady(socket, sessionId); 
          showToast(`${d.name} joined`, "success"); 
        } 
      },
      onSessionReady: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Session ready state:", d.all_ready);
        if (d.all_ready) { 
          setCanJoin(true); 
          setStatus("Ready! Tap Join Call."); 
        } 
      },
      onSessionWaiting: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Session waiting state:", d);
        setStatus(!d.has_counselor ? "Waiting for counselor…" : "Getting ready…"); 
      },
      onCallStarting: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Call starting event received");
        setCanJoin(true); 
        setStatus("Call starting! Join now."); 
      },
      onCallJoined: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Successfully joined call");
        setPhase("call"); 
        if (d.started_at) startTimer(d.started_at); 
      },
      onCallStarted: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Call started from backend at:", d.started_at);
        if (d.started_at) startTimer(d.started_at); 
      },
      onOfferReceived: (d) => { 
        console.log("[VideoCall] WebRTC Offer received");
        rtc.handleOffer(d.offer, d.offer_id, d.from_user_id); 
      },
      onAnswerReceived: (d) => { 
        console.log("[VideoCall] WebRTC Answer received");
        rtc.handleAnswer(d.answer); 
      },
      onIceCandidateReceived: (d) => { 
        rtc.addIceCandidate(d.candidate); 
      },
      onUserAudioToggle: (d) => { 
        rtc.handleRemoteAudioToggle(!!d.audio_enabled); 
        showToast(`${d.name} ${d.audio_enabled ? "unmuted" : "muted"}`, "info"); 
      },
      onUserVideoToggle: (d) => { 
        rtc.handleRemoteVideoToggle(!!d.video_enabled); 
        showToast(`${d.name} camera ${d.video_enabled ? "on" : "off"}`, "info"); 
      },
      onInitialMediaState: (d) => { 
        console.log("[VideoCall] Received initial media states for participants");
        d.participants.forEach(p => { if (p.user_id !== userId) { rtc.handleRemoteVideoToggle(p.video_enabled); rtc.handleRemoteAudioToggle(p.audio_enabled); } }); 
      },
      onSessionEnded: (d) => { 
        if (!mounted) return; 
        console.log("[VideoCall] Session ended by:", d.ended_by);
        showToast(`Session ended by ${d.ended_by}`, "info"); 
        setTimeout(() => cleanupAndExit(), 2000); 
      },
      onUserLeft: (d) => { 
        if (!mounted) return;
        console.log("[VideoCall] User left:", d.name);
        if (d.role === "office_admin" || d.role === "super_admin") { 
          showToast("Counselor disconnected", "warning"); 
        } 
      },
      onReconnectRequest: async (d) => { 
        console.log("[VideoCall] Reconnect request from:", d.name);
        try { await rtc.restartIce(); } catch {} 
      },
      onChatMessage: (d) => { 
        if (!mounted) return; 
        const isSelf = d.user_id === userId; 
        const msg: InCallChatMessage = { id: `cm_${++chatIdRef.current}`, userId: d.user_id, name: d.name, role: d.role, message: d.message, timestamp: d.timestamp, isSelf }; 
        setChatMessages(prev => [...prev, msg]); 
        if (!isSelf && !chatOpen) setChatUnread(prev => prev + 1); 
      },
      onChatTyping: (d) => { if (!mounted) return; setTypingName(d.is_typing ? d.name : null); },
      onError: (d) => { 
        console.error("[VideoCall] Socket Error:", d.message);
        showToast(d.message, "error"); 
      },
    });
    socket.connect();

    // 2) Request permissions + media in background (non-blocking for lobby)
    (async () => {
      console.log("[VideoCall] Requesting media permissions...");
      const p = await perms.requestPermissions();
      if (!mounted) return;
      if (p.camera || p.mic) {
        console.log("[VideoCall] Permissions granted, initializing media...");
        await rtc.initializeMedia();
      } else {
        console.warn("[VideoCall] Permissions denied, camera/mic won't be available");
      }
    })();

    return () => { 
      console.log("[VideoCall] Component unmounting, cleaning up...");
      mounted = false; 
      cleanupAll(); 
    };
  }, [sessionId]);

  // ── App lifecycle ───────────────────────────────────────────────────────
  useAppLifecycle({ onBackground: () => { /* keep audio, pause video handled by OS */ }, onForeground: () => { if (socketRef.current && !socketRef.current.connected) socketRef.current.connect(); } }, phase === "call");

  // ── Timer ───────────────────────────────────────────────────────────────
  const startTimer = useCallback((startedAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const start = new Date(startedAt).getTime();
    timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - start) / 1000)), 1000);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    const mm = String(m).padStart(2, "0"); const ss = String(sec).padStart(2, "0");
    return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const joinCall = () => { emitJoinCall(socketRef.current, sessionId); rtc.createPeerConnection(); };
  const handleSendChat = (text: string) => { emitChatMessage(socketRef.current, sessionId, text); };
  const handleTyping = () => { emitTypingWithDebounce(socketRef.current, sessionId); };
  const openChat = () => { setChatOpen(true); setChatUnread(0); };

  const cleanupAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopHeartbeat();
    rtc.cleanup();
    if (socketRef.current) { emitLeaveSession(socketRef.current, sessionId); socketRef.current.disconnect(); socketRef.current = null; }
  };
  const cleanupAndExit = () => { cleanupAll(); onBack(); };

  const confirmLeave = () => {
    setEndModalVisible(false);
    cleanupAndExit();
  };

  // ── SVG Icons as Text (no dependency) ───────────────────────────────────
  const MicIcon = ({ on }: { on: boolean }) => <Text style={{ fontSize: 22 }}>{on ? "🎙️" : "🔇"}</Text>;
  const CamIcon = ({ on }: { on: boolean }) => <Text style={{ fontSize: 22 }}>{on ? "📹" : "📷"}</Text>;
  const SpeakerIcon = ({ on }: { on: boolean }) => <Text style={{ fontSize: 22 }}>{on ? "🔊" : "🔈"}</Text>;

  // ════════════════════════════════════════════════════════════════════════
  //  LOBBY
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "lobby") {
    const permDenied = perms.permissionState === "denied" || perms.permissionState === "blocked";
    return (
      <SafeAreaView style={[s.container, { backgroundColor: "#0f0f14" }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f14" />
        {/* Back */}
        <Pressable onPress={onBack} style={s.lobbyBack}><Text style={s.lobbyBackText}>‹ Back</Text></Pressable>

        <View style={s.lobbyContent}>
          {/* Preview */}
          <View style={s.previewWrap}>
            {rtc.localStream && rtc.isCamOn ? (
              <RTCView streamURL={rtc.localStream.toURL()} style={s.previewVideo} objectFit="cover" />
            ) : (
              <View style={s.previewOff}><View style={s.avatarCircle}><Text style={s.avatarText}>{initials}</Text></View><Text style={s.previewOffLabel}>Camera is off</Text></View>
            )}
          </View>

          {/* Status */}
          <Text style={s.statusText}>{status}</Text>

          {/* Permission denied */}
          {permDenied && (
            <Pressable onPress={perms.retryPermissions} style={s.retryBtn}><Text style={s.retryBtnText}>{perms.permissionState === "blocked" ? "Open Settings" : "Grant Permissions"}</Text></Pressable>
          )}

          {/* Controls */}
          <View style={s.lobbyControls}>
            <Pressable onPress={rtc.toggleMic} style={[s.lobbyBtn, !rtc.isMicOn && s.lobbyBtnOff]}><MicIcon on={rtc.isMicOn} /></Pressable>
            <Pressable onPress={rtc.toggleCam} style={[s.lobbyBtn, !rtc.isCamOn && s.lobbyBtnOff]}><CamIcon on={rtc.isCamOn} /></Pressable>
            <Pressable onPress={rtc.toggleSpeaker} style={[s.lobbyBtn, !rtc.isSpeakerOn && s.lobbyBtnOff]}><SpeakerIcon on={rtc.isSpeakerOn} /></Pressable>
          </View>

          {/* Join */}
          <Pressable onPress={joinCall} disabled={!canJoin} style={({ pressed }) => [s.joinBtn, !canJoin && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={s.joinBtnText}>{canJoin ? "Join Call" : "Waiting…"}</Text>
          </Pressable>

          {/* Security badge */}
          <View style={s.securityBadge}><Text style={s.securityIcon}>🔒</Text><Text style={s.securityText}>Secure & Confidential</Text></View>
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  IN-CALL
  // ════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.callContainer}>
      <StatusBar hidden />

      {/* Remote Video */}
      <View style={s.remoteWrap}>
        {rtc.remoteStream && rtc.remoteVideoEnabled ? (
          <RTCView streamURL={rtc.remoteStream.toURL()} style={s.fullVideo} objectFit="cover" />
        ) : (
          <View style={s.remotePlaceholder}><View style={s.avatarCircleLg}><Text style={s.avatarTextLg}>C</Text></View><Text style={s.remoteWaitText}>{rtc.remoteStream ? "Camera off" : "Connecting video…"}</Text></View>
        )}
      </View>

      {/* PiP */}
      <View style={s.pip}>
        {rtc.localStream && rtc.isCamOn ? (
          <RTCView streamURL={rtc.localStream.toURL()} style={s.fullVideo} objectFit="cover" />
        ) : (
          <View style={s.pipOff}><Text style={s.pipInitials}>{initials}</Text></View>
        )}
      </View>

      {/* Timer + Quality */}
      <View style={s.topLeft}>
        <View style={s.timerBadge}><View style={s.recDot} /><Text style={s.timerText}>{formatTime(timer)}</Text></View>
        <View style={{ marginTop: 6 }}><ConnectionQualityBadge quality={rtc.connectionQuality} /></View>
      </View>

      {/* Toasts */}
      <VideoToastZone toasts={toasts} />

      {/* Controls */}
      <View style={s.controlsWrap}>
        <View style={s.controlsBar}>
          <Pressable onPress={rtc.toggleMic} style={[s.ctrlBtn, !rtc.isMicOn && s.ctrlBtnOff]}><MicIcon on={rtc.isMicOn} /></Pressable>
          <Pressable onPress={rtc.toggleCam} style={[s.ctrlBtn, !rtc.isCamOn && s.ctrlBtnOff]}><CamIcon on={rtc.isCamOn} /></Pressable>
          <Pressable onPress={rtc.toggleSpeaker} style={[s.ctrlBtn, !rtc.isSpeakerOn && s.ctrlBtnOff]}><SpeakerIcon on={rtc.isSpeakerOn} /></Pressable>
          <Pressable onPress={openChat} style={s.ctrlBtn}><Text style={{ fontSize: 22 }}>💬</Text><ChatBadge count={chatUnread} /></Pressable>
          <Pressable onPress={() => setEndModalVisible(true)} style={[s.ctrlBtn, s.endBtn]}><Text style={{ fontSize: 22 }}>📞</Text></Pressable>
        </View>
      </View>

      {/* Chat */}
      <InCallChat visible={chatOpen} messages={chatMessages} typingName={typingName} onSend={handleSendChat} onTyping={handleTyping} onClose={() => setChatOpen(false)} unreadCount={chatUnread} />

      {/* Reconnection */}
      <ReconnectionOverlay visible={reconnecting} attempt={reconnectAttempt} />

      {/* End Modal */}
      {endModalVisible && (
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Leave this call?</Text>
            <Text style={s.modalSub}>You can rejoin if the session is still active.</Text>
            <View style={s.modalActions}>
              <Pressable onPress={() => setEndModalVisible(false)} style={s.modalCancel}><Text style={s.modalCancelText}>Cancel</Text></Pressable>
              <Pressable onPress={confirmLeave} style={s.modalDanger}><Text style={s.modalDangerText}>Leave call</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1 },
  lobbyBack: { position: "absolute", top: 52, left: 16, zIndex: 10, padding: 8 },
  lobbyBackText: { color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: "600" },
  lobbyContent: { flex: 1, padding: 30, alignItems: "center", justifyContent: "center" },
  previewWrap: { width: "100%", aspectRatio: 3 / 4, borderRadius: 24, overflow: "hidden", backgroundColor: "#1a1a24", marginBottom: 20, maxHeight: 360 },
  previewVideo: { flex: 1 },
  previewOff: { flex: 1, justifyContent: "center", alignItems: "center" },
  previewOffLabel: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 12 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(99,102,241,0.3)", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "white", fontSize: 26, fontWeight: "700" },
  avatarCircleLg: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(99,102,241,0.3)", justifyContent: "center", alignItems: "center" },
  avatarTextLg: { color: "white", fontSize: 36, fontWeight: "700" },
  statusText: { color: "rgba(255,255,255,0.7)", fontSize: 15, marginBottom: 24, textAlign: "center" },
  retryBtn: { backgroundColor: "rgba(99,102,241,0.2)", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  retryBtnText: { color: "#818cf8", fontWeight: "700", fontSize: 14 },
  lobbyControls: { flexDirection: "row", marginBottom: 32 },
  lobbyBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center", marginHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  lobbyBtnOff: { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)" },
  joinBtn: { width: "100%", height: 54, borderRadius: 16, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center" },
  joinBtnText: { color: "white", fontSize: 17, fontWeight: "700" },
  securityBadge: { flexDirection: "row", alignItems: "center", marginTop: 20, opacity: 0.4 },
  securityIcon: { fontSize: 14, marginRight: 6 },
  securityText: { color: "white", fontSize: 12, fontWeight: "500" },
  // Call
  callContainer: { flex: 1, backgroundColor: "#000" },
  remoteWrap: { flex: 1 },
  fullVideo: { flex: 1 },
  remotePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
  remoteWaitText: { color: "rgba(255,255,255,0.5)", marginTop: 16, fontSize: 14 },
  pip: { position: "absolute", top: 50, right: 16, width: 110, height: 150, borderRadius: 14, overflow: "hidden", backgroundColor: "#1a1a24", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)" },
  pipOff: { flex: 1, justifyContent: "center", alignItems: "center" },
  pipInitials: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "700" },
  topLeft: { position: "absolute", top: 50, left: 16 },
  timerBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginRight: 8 },
  timerText: { color: "white", fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  controlsWrap: { position: "absolute", bottom: 36, left: 0, right: 0, alignItems: "center" },
  controlsBar: { flexDirection: "row", backgroundColor: "rgba(15,15,20,0.75)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 28, alignItems: "center" },
  ctrlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center", marginHorizontal: 6 },
  ctrlBtnOff: { backgroundColor: "rgba(239,68,68,0.25)" },
  endBtn: { backgroundColor: "#ef4444" },
  // Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 300 },
  modal: { backgroundColor: "#1e1e2e", borderRadius: 20, padding: 28, width: "85%", maxWidth: 340 },
  modalTitle: { color: "white", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  modalSub: { color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginRight: 10 },
  modalCancelText: { color: "rgba(255,255,255,0.6)", fontWeight: "600", fontSize: 15 },
  modalDanger: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: "#ef4444" },
  modalDangerText: { color: "white", fontWeight: "700", fontSize: 15 },
});
