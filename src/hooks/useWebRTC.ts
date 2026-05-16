import { useState, useRef, useCallback } from "react";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from "react-native-webrtc";
import { Audio } from "expo-av";
import type { Socket } from "socket.io-client";
import {
  emitIceCandidate,
  emitOffer,
  emitAnswer,
  emitToggleAudio,
  emitToggleVideo,
  emitCallConnected,
  emitReconnectRequest,
} from "../services/videoSocket";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConnectionQuality = "unknown" | "excellent" | "good" | "poor";
export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

// ─── ICE Config ──────────────────────────────────────────────────────────────

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWebRTC(sessionId: number) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<PeerConnectionState>("new");
  const [connectionQuality, setConnectionQuality] =
    useState<ConnectionQuality>("unknown");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const qualityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectInProgressRef = useRef(false);
  const callConnectedEmittedRef = useRef(false);

  // Keep refs in sync
  const setSocket = useCallback((s: Socket | null) => {
    socketRef.current = s;
  }, []);

  // ─── Audio Mode ──────────────────────────────────────────────────────────

  const configureAudioMode = useCallback(async (speaker: boolean) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: !speaker,
      });
    } catch (e) {
      console.warn("Failed to set audio mode:", e);
    }
  }, []);

  // ─── Initialize Media ────────────────────────────────────────────────────

  const initializeMedia = useCallback(async (): Promise<MediaStream | null> => {
    await configureAudioMode(true); // default speakerphone for video calls

    // Progressive fallback: audio+video → video-only → audio-only
    let stream: MediaStream | null = null;
    let micEnabled = true;
    let camEnabled = true;

    try {
      stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
    } catch {
      try {
        stream = await mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
        micEnabled = false;
      } catch {
        try {
          stream = await mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          camEnabled = false;
        } catch (e) {
          console.error("All media access attempts failed:", e);
          return null;
        }
      }
    }

    setIsMicOn(micEnabled);
    setIsCamOn(camEnabled);
    setLocalStream(stream);
    localStreamRef.current = stream;
    return stream;
  }, [configureAudioMode]);

  // ─── Create Peer Connection ──────────────────────────────────────────────

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    callConnectedEmittedRef.current = false;

    // Add local tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    (pc as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        emitIceCandidate(socketRef.current, sessionId, event.candidate);
      }
    };

    // Remote track
    (pc as any).ontrack = (event: any) => {
      console.log("Remote track received:", event.track?.kind);
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Connection state monitoring (react-native-webrtc types don't expose these directly)
    (pc as any).onconnectionstatechange = () => {
      const state = (pc as any).connectionState as PeerConnectionState;
      console.log("PC connectionState:", state);
      setConnectionState(state);

      if (state === "connected") {
        if (!callConnectedEmittedRef.current) {
          emitCallConnected(socketRef.current, sessionId);
          callConnectedEmittedRef.current = true;
        }
        setConnectionQuality("good");
        if (recoveryTimerRef.current) {
          clearTimeout(recoveryTimerRef.current);
          recoveryTimerRef.current = null;
        }
        startQualityMonitoring();
      } else if (state === "disconnected") {
        setConnectionQuality("poor");
        scheduleConnectionRecovery(false);
      } else if (state === "failed") {
        setConnectionQuality("poor");
        scheduleConnectionRecovery(true);
      }
    };

    // ICE connection state
    (pc as any).oniceconnectionstatechange = () => {
      const iceState = (pc as any).iceConnectionState;
      console.log("ICE connectionState:", iceState);
      if (
        (iceState === "failed" || iceState === "disconnected") &&
        !reconnectInProgressRef.current
      ) {
        restartIce();
      }
    };

    return pc;
  }, [sessionId]);

  // ─── Signaling handlers ──────────────────────────────────────────────────

  const handleOffer = useCallback(
    async (
      offer: RTCSessionDescriptionInit,
      offerId?: string,
      fromUserId?: number,
    ) => {
      let pc = pcRef.current;
      if (!pc) {
        pc = createPeerConnection();
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer as any));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        emitAnswer(
          socketRef.current,
          sessionId,
          answer,
          offerId,
          fromUserId,
        );

        drainPendingCandidates();
      } catch (e) {
        console.error("Error handling offer:", e);
      }
    },
    [createPeerConnection, sessionId],
  );

  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const pc = pcRef.current;
      if (!pc) return;

      const state = (pc as any).signalingState;
      if (state !== "have-local-offer") {
        console.warn("Ignoring answer in state:", state);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer as any));
        drainPendingCandidates();
      } catch (e) {
        console.error("Error handling answer:", e);
      }
    },
    [],
  );

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (!pc || !(pc as any).remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("Failed to add ICE candidate:", e);
      }
    },
    [],
  );

  const drainPendingCandidates = useCallback(() => {
    const pc = pcRef.current;
    if (!pc || !(pc as any).remoteDescription) return;
    const queue = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    queue.forEach(async (cand) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn("Error adding queued ICE candidate:", e);
      }
    });
  }, []);

  // ─── ICE restart ─────────────────────────────────────────────────────────

  const restartIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      reconnectInProgressRef.current = true;
      const offer = await pc.createOffer({ iceRestart: true } as any);
      await pc.setLocalDescription(offer);
      emitOffer(socketRef.current, sessionId, offer);
    } catch (e) {
      console.warn("ICE restart failed:", e);
    } finally {
      setTimeout(() => {
        reconnectInProgressRef.current = false;
      }, 1500);
    }
  }, [sessionId]);

  // ─── Connection Recovery ─────────────────────────────────────────────────

  const scheduleConnectionRecovery = useCallback(
    (isFailed: boolean) => {
      if (recoveryTimerRef.current) return;
      const delay = isFailed ? 2000 : 4000;
      recoveryTimerRef.current = setTimeout(async () => {
        recoveryTimerRef.current = null;
        try {
          const pc = pcRef.current;
          if (!pc) return;
          const state = (pc as any).connectionState;
          if (state !== "connected") {
            await rebuildPeerConnection();
            emitReconnectRequest(socketRef.current, sessionId);
          }
        } catch (e) {
          console.warn("Recovery attempt failed:", e);
        }
      }, delay);
    },
    [sessionId],
  );

  const rebuildPeerConnection = useCallback(async () => {
    reconnectInProgressRef.current = true;
    const oldPc = pcRef.current;
    if (oldPc) {
      try {
        (oldPc as any).ontrack = null;
        (oldPc as any).onicecandidate = null;
        (oldPc as any).onconnectionstatechange = null;
        (oldPc as any).oniceconnectionstatechange = null;
        oldPc.close();
      } catch {}
    }
    pcRef.current = null;
    pendingCandidatesRef.current = [];

    createPeerConnection();
    emitReconnectRequest(socketRef.current, sessionId);

    setTimeout(() => {
      reconnectInProgressRef.current = false;
    }, 1500);
  }, [createPeerConnection, sessionId]);

  // ─── Quality Monitoring ──────────────────────────────────────────────────

  const startQualityMonitoring = useCallback(() => {
    stopQualityMonitoring();
    qualityIntervalRef.current = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        let inboundRtp: any = null;
        stats.forEach((report: any) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            inboundRtp = report;
          }
        });
        if (inboundRtp) {
          const lost = inboundRtp.packetsLost || 0;
          const received = inboundRtp.packetsReceived || 1;
          const lossRate = lost / (received + lost);
          const jitter = inboundRtp.jitter || 0;

          let quality: ConnectionQuality = "excellent";
          if (lossRate > 0.05 || jitter > 0.08) {
            quality = "poor";
          } else if (lossRate > 0.02 || jitter > 0.03) {
            quality = "good";
          }
          setConnectionQuality(quality);
          applyAdaptiveBitrate(quality);
        }
      } catch {}
    }, 5000);
  }, []);

  const stopQualityMonitoring = useCallback(() => {
    if (qualityIntervalRef.current) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
    }
  }, []);

  // ─── Adaptive Bitrate ────────────────────────────────────────────────────

  const applyAdaptiveBitrate = useCallback(
    async (quality: ConnectionQuality) => {
      const pc = pcRef.current;
      if (!pc) return;
      const senders = pc.getSenders();
      const videoSender = senders.find(
        (s: any) => s.track && s.track.kind === "video",
      );
      if (!videoSender) return;

      try {
        const params = videoSender.getParameters();
        let maxBitrate: number;
        switch (quality) {
          case "poor":
            maxBitrate = 350_000;
            break;
          case "good":
            maxBitrate = 1_200_000;
            break;
          default:
            maxBitrate = 2_500_000;
        }
        if (params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = maxBitrate;
        }
        await videoSender.setParameters(params);
      } catch {}
    },
    [],
  );

  // ─── Media Toggles ───────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMicOn;
    });
    const newState = !isMicOn;
    setIsMicOn(newState);
    emitToggleAudio(socketRef.current, sessionId, newState);
  }, [isMicOn, sessionId]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !isCamOn;
    });
    const newState = !isCamOn;
    setIsCamOn(newState);
    emitToggleVideo(socketRef.current, sessionId, newState);
  }, [isCamOn, sessionId]);

  const toggleSpeaker = useCallback(async () => {
    const newState = !isSpeakerOn;
    setIsSpeakerOn(newState);
    await configureAudioMode(newState);
  }, [isSpeakerOn, configureAudioMode]);

  // ─── Remote media state ──────────────────────────────────────────────────

  const handleRemoteAudioToggle = useCallback((enabled: boolean) => {
    setRemoteAudioEnabled(enabled);
  }, []);

  const handleRemoteVideoToggle = useCallback((enabled: boolean) => {
    setRemoteVideoEnabled(enabled);
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    stopQualityMonitoring();
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");
    setConnectionQuality("unknown");
    pendingCandidatesRef.current = [];
    callConnectedEmittedRef.current = false;
  }, [stopQualityMonitoring]);

  return {
    // State
    localStream,
    remoteStream,
    connectionState,
    connectionQuality,
    isMicOn,
    isCamOn,
    isSpeakerOn,
    remoteVideoEnabled,
    remoteAudioEnabled,
    // Actions
    setSocket,
    initializeMedia,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleMic,
    toggleCam,
    toggleSpeaker,
    handleRemoteAudioToggle,
    handleRemoteVideoToggle,
    restartIce,
    rebuildPeerConnection,
    cleanup,
  };
}
