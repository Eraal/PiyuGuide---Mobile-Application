import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "../constants/backend";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Participant = {
  user_id: number;
  role: string;
  name: string;
  ready: boolean;
  in_call?: boolean;
  connected?: boolean;
  audio_enabled?: boolean;
  video_enabled?: boolean;
};

export type SessionJoinedData = {
  session_id: number;
  room: string;
  participants: Participant[];
  your_role: string;
  started_at: string | null;
  ended_at: string | null;
};

export type UserJoinedData = {
  user_id: number;
  role: string;
  name: string;
  timestamp: string;
};

export type SessionReadyData = {
  session_id: number;
  status: string;
  all_ready: boolean;
  participants: Participant[];
  timestamp: string;
};

export type SessionWaitingData = {
  session_id: number;
  has_student: boolean;
  has_counselor: boolean;
  participant_count: number;
  participants: Participant[];
  timestamp: string;
};

export type CallJoinedData = {
  session_id: number;
  participants: Participant[];
  your_role: string;
  started_at: string | null;
};

export type CallStartingData = {
  session_id: number;
  started_by: string;
  participants: Participant[];
  started_at: string | null;
  timestamp: string;
};

export type OfferData = {
  session_id: number;
  offer: RTCSessionDescriptionInit;
  offer_id: string;
  from_user_id: number;
  from_role: string;
  from_name: string;
  target_user_id?: number;
  timestamp: string;
};

export type AnswerData = {
  session_id: number;
  answer: RTCSessionDescriptionInit;
  offer_id: string;
  from_user_id: number;
  from_role: string;
  from_name: string;
  target_user_id?: number;
  timestamp: string;
};

export type IceCandidateData = {
  session_id: number;
  candidate: RTCIceCandidateInit;
  from_user_id: number;
  from_role: string;
  timestamp: string;
};

export type MediaToggleData = {
  user_id: number;
  audio_enabled?: boolean;
  video_enabled?: boolean;
  name: string;
};

export type InitialMediaStateData = {
  session_id: number;
  participants: Array<{
    user_id: number;
    name: string;
    audio_enabled: boolean;
    video_enabled: boolean;
  }>;
};

export type SessionEndedData = {
  session_id: number;
  ended_by: string;
  ended_by_role: string;
  started_at: string | null;
  ended_at: string | null;
  timestamp: string;
};

export type UserLeftData = {
  user_id: number;
  name: string;
  role: string;
  timestamp: string;
};

export type ChatMessageData = {
  user_id: number;
  name: string;
  role: string;
  message: string;
  timestamp: string;
};

export type ChatTypingData = {
  user_id: number;
  name: string;
  is_typing: boolean;
};

export type ReconnectRequestData = {
  user_id: number;
  name: string;
  role: string;
  session_id: number;
  timestamp: string;
};

export type CallStartedData = {
  session_id: number;
  started_at: string;
};

export type QualityUpdateData = {
  user_id: number;
  quality: string;
  timestamp: string;
};

export type VideoSocketHandlers = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSessionJoined?: (data: SessionJoinedData) => void;
  onUserJoined?: (data: UserJoinedData) => void;
  onSessionReady?: (data: SessionReadyData) => void;
  onSessionWaiting?: (data: SessionWaitingData) => void;
  onCallStarting?: (data: CallStartingData) => void;
  onCallJoined?: (data: CallJoinedData) => void;
  onCallStarted?: (data: CallStartedData) => void;
  onOfferReceived?: (data: OfferData) => void;
  onAnswerReceived?: (data: AnswerData) => void;
  onIceCandidateReceived?: (data: IceCandidateData) => void;
  onUserAudioToggle?: (data: MediaToggleData) => void;
  onUserVideoToggle?: (data: MediaToggleData) => void;
  onInitialMediaState?: (data: InitialMediaStateData) => void;
  onSessionEnded?: (data: SessionEndedData) => void;
  onUserLeft?: (data: UserLeftData) => void;
  onChatMessage?: (data: ChatMessageData) => void;
  onChatTyping?: (data: ChatTypingData) => void;
  onReconnectRequest?: (data: ReconnectRequestData) => void;
  onQualityUpdate?: (data: QualityUpdateData) => void;
  onError?: (data: { message: string }) => void;
  onHeartbeatAck?: () => void;
};

// ─── Service ─────────────────────────────────────────────────────────────────

const MAX_RECONNECT_ATTEMPTS = 8;
const HEARTBEAT_INTERVAL = 30_000;

export function createVideoSocket(): Socket {
  return io(`${BACKEND_URL}/video-counseling`, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    timeout: 20_000,
    forceNew: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 16_000,
  });
}

export function attachVideoSocketListeners(
  socket: Socket,
  handlers: VideoSocketHandlers,
): () => void {
  const on = <T>(event: string, handler?: (data: T) => void) => {
    if (handler) socket.on(event, handler as any);
  };

  on("connect", handlers.onConnect);
  on("disconnect", handlers.onDisconnect);
  on("session_joined", handlers.onSessionJoined);
  on("user_joined", handlers.onUserJoined);
  on("session_ready", handlers.onSessionReady);
  on("session_waiting", handlers.onSessionWaiting);
  on("call_starting", handlers.onCallStarting);
  on("call_joined", handlers.onCallJoined);
  on("call_started", handlers.onCallStarted);
  on("offer_received", handlers.onOfferReceived);
  on("answer_received", handlers.onAnswerReceived);
  on("ice_candidate_received", handlers.onIceCandidateReceived);
  on("user_audio_toggle", handlers.onUserAudioToggle);
  on("user_video_toggle", handlers.onUserVideoToggle);
  on("initial_media_state", handlers.onInitialMediaState);
  on("session_ended", handlers.onSessionEnded);
  on("user_left", handlers.onUserLeft);
  on("session_chat_message", handlers.onChatMessage);
  on("session_chat_typing", handlers.onChatTyping);
  on("reconnect_request", handlers.onReconnectRequest);
  on("quality_update", handlers.onQualityUpdate);
  on("error", handlers.onError);
  on("heartbeat_ack", handlers.onHeartbeatAck);

  return () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("session_joined");
    socket.off("user_joined");
    socket.off("session_ready");
    socket.off("session_waiting");
    socket.off("call_starting");
    socket.off("call_joined");
    socket.off("call_started");
    socket.off("offer_received");
    socket.off("answer_received");
    socket.off("ice_candidate_received");
    socket.off("user_audio_toggle");
    socket.off("user_video_toggle");
    socket.off("initial_media_state");
    socket.off("session_ended");
    socket.off("user_left");
    socket.off("session_chat_message");
    socket.off("session_chat_typing");
    socket.off("reconnect_request");
    socket.off("quality_update");
    socket.off("error");
    socket.off("heartbeat_ack");
  };
}

// ─── Emit helpers ────────────────────────────────────────────────────────────

export function emitJoinSession(socket: Socket | null, sessionId: number) {
  socket?.emit("join_session", { session_id: sessionId });
}

export function emitReady(socket: Socket | null, sessionId: number) {
  socket?.emit("ready", { session_id: sessionId });
}

export function emitJoinCall(socket: Socket | null, sessionId: number) {
  socket?.emit("join_call", { session_id: sessionId });
}

export function emitOffer(
  socket: Socket | null,
  sessionId: number,
  offer: RTCSessionDescriptionInit,
  targetUserId?: number,
) {
  socket?.emit("offer", {
    session_id: sessionId,
    offer,
    target_user_id: targetUserId ?? null,
  });
}

export function emitAnswer(
  socket: Socket | null,
  sessionId: number,
  answer: RTCSessionDescriptionInit,
  offerId?: string,
  targetUserId?: number,
) {
  socket?.emit("answer", {
    session_id: sessionId,
    answer,
    offer_id: offerId,
    target_user_id: targetUserId ?? null,
  });
}

export function emitIceCandidate(
  socket: Socket | null,
  sessionId: number,
  candidate: RTCIceCandidateInit,
) {
  socket?.emit("ice_candidate", { session_id: sessionId, candidate });
}

export function emitToggleAudio(
  socket: Socket | null,
  sessionId: number,
  enabled: boolean,
) {
  socket?.emit("toggle_audio", {
    session_id: sessionId,
    audio_enabled: enabled,
  });
}

export function emitToggleVideo(
  socket: Socket | null,
  sessionId: number,
  enabled: boolean,
) {
  socket?.emit("toggle_video", {
    session_id: sessionId,
    video_enabled: enabled,
  });
}

export function emitChatMessage(
  socket: Socket | null,
  sessionId: number,
  message: string,
) {
  if (!message.trim()) return;
  socket?.emit("session_chat_message", {
    session_id: sessionId,
    message: message.trim(),
  });
}

export function emitChatTyping(
  socket: Socket | null,
  sessionId: number,
  isTyping: boolean,
) {
  socket?.emit("session_chat_typing", {
    session_id: sessionId,
    is_typing: isTyping,
  });
}

export function emitHeartbeat(socket: Socket | null, sessionId: number) {
  socket?.emit("session_heartbeat", { session_id: sessionId });
}

export function emitLeaveSession(socket: Socket | null, sessionId: number) {
  socket?.emit("leave_session", { session_id: sessionId });
}

export function emitCallConnected(socket: Socket | null, sessionId: number) {
  socket?.emit("call_connected", { session_id: sessionId });
}

export function emitReconnectRequest(
  socket: Socket | null,
  sessionId: number,
) {
  socket?.emit("reconnect_request", { session_id: sessionId });
}

// ─── Heartbeat manager ──────────────────────────────────────────────────────

let _heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(socket: Socket | null, sessionId: number) {
  stopHeartbeat();
  _heartbeatInterval = setInterval(() => {
    if (socket?.connected) {
      emitHeartbeat(socket, sessionId);
    }
  }, HEARTBEAT_INTERVAL);
}

export function stopHeartbeat() {
  if (_heartbeatInterval) {
    clearInterval(_heartbeatInterval);
    _heartbeatInterval = null;
  }
}

// ─── Typing debounce ─────────────────────────────────────────────────────────

let _typingTimer: ReturnType<typeof setTimeout> | null = null;

export function emitTypingWithDebounce(
  socket: Socket | null,
  sessionId: number,
) {
  if (!socket?.connected) return;
  emitChatTyping(socket, sessionId, true);
  if (_typingTimer) clearTimeout(_typingTimer);
  _typingTimer = setTimeout(() => {
    emitChatTyping(socket, sessionId, false);
    _typingTimer = null;
  }, 2_000);
}
