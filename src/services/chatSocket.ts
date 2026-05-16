import { io, type Socket } from "socket.io-client";

import { CHAT_BACKEND_URL } from "../constants/chat";
import type { ChatMessage } from "../types/chat";

export type TypingEventData = {
  inquiry_id: number;
  user_id: number;
  user_name: string;
  role: string;
};

export type StopTypingEventData = {
  inquiry_id: number;
  user_id: number;
};

export type ChatSocketHandlers = {
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (message: ChatMessage) => void;
  onError?: (message: string) => void;
  onTyping?: (data: TypingEventData) => void;
  onStopTyping?: (data: StopTypingEventData) => void;
};

export function createChatSocket(): Socket {
  return io(CHAT_BACKEND_URL + "/chat", {
    transports: ["polling", "websocket"],
    autoConnect: false,
    withCredentials: true,
  });
}

/**
 * Attach all chat socket listeners.
 *
 * @param currentUserId - The ID of the currently logged-in user.
 *   Used to reliably determine whether an incoming socket message was
 *   sent by "me" or "them", since the server does not always set
 *   `is_current_user` on socket events.
 */
export function attachChatSocketListeners(
  socket: Socket,
  handlers: ChatSocketHandlers,
  currentUserId?: number,
) {
  const handleConnect = () => handlers.onConnect();
  const handleDisconnect = () => handlers.onDisconnect();
  const handleIncomingMessage = (
    incoming: Omit<Partial<ChatMessage>, 'attachments'> & {
      content?: string;
      message?: string;
      text?: string;
      sender?: string;
      sender_id?: number;
      user_id?: number;
      sender_name?: string;
      sender_avatar_url?: string | null;
      is_current_user?: boolean;
      timestamp?: string;
      status?: string;
      attachments?: Array<{
        filename: string;
        file_path: string;
        file_type: string | null;
        file_size: number | null;
      }>;
    },
  ) => {
    const messageText = incoming.content ?? incoming.message ?? incoming.text;

    if (!messageText) {
      return;
    }

    // Determine sender reliably:
    // 1. Compare sender_id / user_id against currentUserId (most reliable)
    // 2. Fall back to is_current_user flag
    // 3. Fall back to sender string
    let isMine = false;
    const incomingSenderId = incoming.sender_id ?? incoming.user_id;
    if (currentUserId != null && incomingSenderId != null) {
      isMine = incomingSenderId === currentUserId;
    } else if (incoming.is_current_user != null) {
      isMine = incoming.is_current_user;
    } else {
      isMine = incoming.sender === "me";
    }

    handlers.onMessage({
      id: String(incoming.id ?? Date.now().toString()),
      text: messageText,
      sender: isMine ? "me" : "them",
      senderName: incoming.sender_name,
      senderAvatarUrl: incoming.sender_avatar_url ?? null,
      timestamp: incoming.timestamp,
      status: incoming.status,
      attachments: incoming.attachments?.map((a) => ({
        filename: a.filename,
        filePath: a.file_path,
        fileType: a.file_type,
        fileSize: a.file_size,
      })),
    });
  };
  const handleError = (error: Error | { message?: string } | string) => {
    if (!handlers.onError) {
      return;
    }

    if (typeof error === "string") {
      handlers.onError(error);
      return;
    }

    handlers.onError(error.message ?? "Socket connection failed.");
  };

  const handleTyping = (data: TypingEventData) => {
    handlers.onTyping?.(data);
  };

  const handleStopTyping = (data: StopTypingEventData) => {
    handlers.onStopTyping?.(data);
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("receive_message", handleIncomingMessage);
  socket.on("connect_error", handleError);
  socket.on("error", handleError);
  socket.on("typing", handleTyping);
  socket.on("stop_typing", handleStopTyping);

  return () => {
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("receive_message", handleIncomingMessage);
    socket.off("connect_error", handleError);
    socket.off("error", handleError);
    socket.off("typing", handleTyping);
    socket.off("stop_typing", handleStopTyping);
    socket.disconnect();
  };
}

/* ------------------------------------------------------------------ */
/*  Typing emission helpers                                           */
/* ------------------------------------------------------------------ */

let _typingDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Emit a typing event with auto-stop after 2 seconds of inactivity.
 * Call this on every keystroke in the composer.
 */
export function emitTyping(socket: Socket | null, inquiryId: number) {
  if (!socket?.connected) return;

  socket.emit("typing", { inquiry_id: inquiryId });

  if (_typingDebounceTimer) clearTimeout(_typingDebounceTimer);
  _typingDebounceTimer = setTimeout(() => {
    emitStopTyping(socket, inquiryId);
  }, 2000);
}

export function emitStopTyping(socket: Socket | null, inquiryId: number) {
  if (!socket?.connected) return;

  socket.emit("stop_typing", { inquiry_id: inquiryId });

  if (_typingDebounceTimer) {
    clearTimeout(_typingDebounceTimer);
    _typingDebounceTimer = null;
  }
}
