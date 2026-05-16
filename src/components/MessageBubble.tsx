import { useEffect, useRef } from "react";
import {
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { BACKEND_URL } from "../constants/backend";
import type { ChatAttachment } from "../types/chat";

type MessageBubbleProps = {
  text: string;
  isMine: boolean;
  senderName?: string;
  timestamp?: string;
  status?: string;
  attachments?: ChatAttachment[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatTimeOnly(timestamp: string | undefined): string {
  if (!timestamp) return "";
  try {
    const normalized = timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T");
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
  } catch {
    return "";
  }
}

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "#E53935", "#1E88E5", "#43A047", "#FB8C00",
  "#8E24AA", "#00897B", "#3949AB", "#D81B60",
];

function getAvatarColor(name: string | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return "📄";
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.startsWith("video/")) return "🎬";
  if (fileType.startsWith("audio/")) return "🎵";
  if (fileType.includes("pdf")) return "📕";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📑";
  return "📄";
}

function StatusIcon({ status }: { status?: string }) {
  if (!status) return null;
  const isRead = status === "read";
  return (
    <Text style={styles.checkmark}>
      {isRead ? "✓✓" : "✓"}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function MessageBubble({
  text,
  isMine,
  senderName,
  timestamp,
  status,
  attachments,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const timeStr = formatTimeOnly(timestamp);
  const hasAttachments = attachments && attachments.length > 0;

  // Entrance animation
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [6, 0],
        }),
      },
    ],
  };

  const handleOpenAttachment = (attachment: ChatAttachment) => {
    const url = attachment.filePath.startsWith("http")
      ? attachment.filePath
      : `${BACKEND_URL}${attachment.filePath.startsWith("/") ? "" : "/"}${attachment.filePath}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isMine ? styles.wrapperMine : styles.wrapperThem,
        animatedStyle,
      ]}
    >
      {/* Incoming avatar */}
      {!isMine && (
        <View
          style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(senderName) },
          ]}
        >
          <Text style={styles.avatarText}>{getInitials(senderName)}</Text>
        </View>
      )}

      <View style={styles.bubbleColumn}>
        {/* Message bubble */}
        <View
          style={[
            styles.bubble,
            isMine
              ? {
                  backgroundColor: colors.bubbleOutgoing,
                  borderBottomRightRadius: 4,
                }
              : {
                  backgroundColor: colors.bubbleIncoming,
                  borderBottomLeftRadius: 4,
                },
          ]}
        >
          {/* Text content */}
          {text ? (
            <Text
              style={[
                styles.text,
                {
                  color: isMine
                    ? colors.bubbleOutgoingText
                    : colors.bubbleIncomingText,
                },
              ]}
            >
              {text}
            </Text>
          ) : null}

          {/* File attachments */}
          {hasAttachments
            ? attachments.map((att, idx) => (
                <Pressable
                  key={`${att.filename}-${idx}`}
                  onPress={() => handleOpenAttachment(att)}
                  style={({ pressed }) => [
                    styles.attachmentCard,
                    {
                      backgroundColor: isMine
                        ? "rgba(255,255,255,0.12)"
                        : colors.fileBubbleBackground,
                      borderColor: isMine
                        ? "rgba(255,255,255,0.18)"
                        : colors.fileBubbleBorder,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.attachmentIcon}>
                    {getFileIcon(att.fileType)}
                  </Text>
                  <View style={styles.attachmentInfo}>
                    <Text
                      style={[
                        styles.attachmentName,
                        {
                          color: isMine
                            ? colors.bubbleOutgoingText
                            : colors.fileBubbleText,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {att.filename}
                    </Text>
                    {att.fileSize ? (
                      <Text
                        style={[
                          styles.attachmentSize,
                          {
                            color: isMine
                              ? "rgba(255,255,255,0.60)"
                              : colors.fileBubbleIcon,
                          },
                        ]}
                      >
                        {formatFileSize(att.fileSize)}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.attachmentDownload,
                      {
                        color: isMine
                          ? "rgba(255,255,255,0.60)"
                          : colors.fileBubbleIcon,
                      },
                    ]}
                  >
                    ↗
                  </Text>
                </Pressable>
              ))
            : null}

          {/* Timestamp + status row */}
          {(timeStr || (isMine && status)) ? (
            <View style={styles.metaRow}>
              {timeStr ? (
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: isMine
                        ? colors.timestampText
                        : colors.timestampTextIncoming,
                    },
                  ]}
                >
                  {timeStr}
                </Text>
              ) : null}
              {isMine ? <StatusIcon status={status} /> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  wrapperMine: {
    justifyContent: "flex-end",
  },
  wrapperThem: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 2,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  bubbleColumn: {
    maxWidth: "78%",
    flexShrink: 1,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
    // Subtle elevation for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 10.5,
    fontWeight: "400",
  },
  checkmark: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  /* Attachment card */
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    gap: 8,
  },
  attachmentIcon: {
    fontSize: 22,
    flexShrink: 0,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: "600",
  },
  attachmentSize: {
    fontSize: 11,
    marginTop: 1,
  },
  attachmentDownload: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 0,
  },
});
