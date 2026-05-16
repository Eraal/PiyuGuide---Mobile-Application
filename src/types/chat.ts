export type ChatAttachment = {
  filename: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
};

export type ChatMessage = {
  id: string;
  text: string;
  sender: "me" | "them";
  senderName?: string;
  senderAvatarUrl?: string | null;
  timestamp?: string;
  status?: string;
  attachments?: ChatAttachment[];
};

export type ChatConnectionState = "connecting" | "connected" | "disconnected";
