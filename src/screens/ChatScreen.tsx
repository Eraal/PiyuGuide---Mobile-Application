import { useEffect, useRef, useState, useCallback } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Socket } from "socket.io-client";
import * as DocumentPicker from "expo-document-picker";

import { ChatComposer } from "../components/ChatComposer";
import { ChatHeader } from "../components/ChatHeader";
import { InquiryDetailsModal } from "../components/InquiryDetailsModal";
import { MessageBubble } from "../components/MessageBubble";
import { TypingIndicator } from "../components/TypingIndicator";
import { 
  loadInquiryMessages, 
  sendInquiryMessage, 
  loadInquiryDetails, 
  type MobileInquiryDetails 
} from "../services/backend";
import {
  attachChatSocketListeners,
  createChatSocket,
  emitTyping,
  emitStopTyping,
} from "../services/chatSocket";
import type { ChatConnectionState, ChatMessage } from "../types/chat";
import { useTheme } from "../theme/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";

const MESSAGE_REFRESH_INTERVAL_MS = 15000;
const MESSAGE_PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  Day separator helper                                              */
/* ------------------------------------------------------------------ */

function getDayLabel(timestamp: string | undefined): string {
  if (!timestamp) return "";
  try {
    const normalized = timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T");
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (isToday) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function upsertMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex >= 0) {
    const nextMessages = [...messages];
    nextMessages[existingIndex] = nextMessage;
    return nextMessages;
  }

  return [...messages, nextMessage];
}

function formatLoadError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to load the conversation right now.";
}

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

type ChatScreenProps = {
  inquiryId: number;
  officeName?: string;
  currentUserId?: number;
  onBack: () => void;
};

export default function ChatScreen({
  inquiryId,
  officeName = "Office",
  currentUserId,
  onBack,
}: ChatScreenProps) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [connectionState, setConnectionState] = useState<ChatConnectionState>("connecting");
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | undefined>(undefined);
  const [details, setDetails] = useState<MobileInquiryDetails | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenEntrance = useEntranceAnimation();

  // Load messages
  useEffect(() => {
    let cancelled = false;

    const loadConversation = async () => {
      setIsLoadingConversation(true);
      setLoadError(null);

      try {
        const conversation = await loadInquiryMessages(inquiryId, MESSAGE_PAGE_SIZE);
        if (cancelled) return;
        setMessages(conversation.messages);
        setConnectionState("connected");
      } catch (error) {
        if (!cancelled) {
          setMessages([]);
          setLoadError(formatLoadError(error));
          setConnectionState("disconnected");
        }
      } finally {
        if (!cancelled) setIsLoadingConversation(false);
      }
    };

    void loadConversation();
    return () => { cancelled = true; };
  }, [inquiryId]);

  // Load inquiry details
  useEffect(() => {
    let cancelled = false;
    const fetchDetails = async () => {
      try {
        const data = await loadInquiryDetails(inquiryId);
        if (!cancelled) setDetails(data);
      } catch {
        // Silent error for details
      }
    };
    void fetchDetails();
    return () => { cancelled = true; };
  }, [inquiryId]);

  // WebSocket connection
  useEffect(() => {
    const socket = createChatSocket();
    socketRef.current = socket;

    const detach = attachChatSocketListeners(
      socket,
      {
        onConnect: () => {
          socket.emit("join_inquiry_room", { inquiry_id: inquiryId });
        },
        onDisconnect: () => {},
        onMessage: (message) => {
          setMessages((prev) => upsertMessage(prev, message));
          // Clear typing when a message arrives
          setIsTyping(false);
          setTypingUserName(undefined);
        },
        onError: () => {},
        onTyping: (data) => {
          setIsTyping(true);
          setTypingUserName(data.user_name);
          // Auto-clear after 3 seconds if no stop event
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUserName(undefined);
          }, 3000);
        },
        onStopTyping: () => {
          setIsTyping(false);
          setTypingUserName(undefined);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        },
      },
      currentUserId,
    );

    socket.connect();

    return () => {
      detach();
      socketRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inquiryId, currentUserId]);

  // Periodic refresh
  useEffect(() => {
    let cancelled = false;

    const refreshMessages = async () => {
      try {
        const conversation = await loadInquiryMessages(inquiryId, MESSAGE_PAGE_SIZE);
        if (!cancelled) {
          setMessages(conversation.messages);
          setConnectionState("connected");
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(formatLoadError(error));
          setConnectionState("disconnected");
        }
      }
    };

    const intervalId = setInterval(() => void refreshMessages(), MESSAGE_REFRESH_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [inquiryId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleTyping = useCallback(() => {
    emitTyping(socketRef.current, inquiryId);
  }, [inquiryId]);

  const handleSend = async (textToSend: string, file?: DocumentPicker.DocumentPickerAsset) => {
    const trimmedText = textToSend.trim();
    if ((!trimmedText && !file) || isSending) return;

    emitStopTyping(socketRef.current, inquiryId);
    setIsSending(true);

    try {
      const sentMessage = await sendInquiryMessage(inquiryId, trimmedText, file);
      setMessages((prev) => upsertMessage(prev, sentMessage));
      setText("");
      setConnectionState("connected");
      setLoadError(null);
    } catch (error) {
      const message = formatLoadError(error);
      setLoadError(message);
      setConnectionState("disconnected");
      Alert.alert("Message not sent", message);
    } finally {
      setIsSending(false);
    }
  };

  // Insert day separators into the flat list
  const listData = buildListData(messages);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          opacity: screenEntrance.opacity,
          transform: [{ translateY: screenEntrance.translateY }],
          backgroundColor: colors.background,
        },
      ]}
    >
      <SafeAreaView style={styles.root} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ChatHeader
            officeName={officeName}
            isTyping={isTyping}
            typingUserName={typingUserName}
            isConnected={connectionState === "connected"}
            onBack={onBack}
            onShowDetails={() => setDetailsVisible(true)}
          />

          <InquiryDetailsModal
            visible={detailsVisible}
            onClose={() => setDetailsVisible(false)}
            details={details}
          />

          <FlatList
            ref={flatListRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            data={listData}
            keyExtractor={(item) => item.key}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.type === "separator") {
                return (
                  <View style={styles.daySeparator}>
                    <View style={[styles.dayLine, { backgroundColor: colors.border }]} />
                    <View style={[styles.dayPill, { backgroundColor: colors.surfaceHover }]}>
                      <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                        {item.label}
                      </Text>
                    </View>
                    <View style={[styles.dayLine, { backgroundColor: colors.border }]} />
                  </View>
                );
              }
              return (
                <MessageBubble
                  text={item.message.text}
                  isMine={item.message.sender === "me"}
                  senderName={item.message.senderName}
                  timestamp={item.message.timestamp}
                  status={item.message.status}
                  attachments={item.message.attachments}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {isLoadingConversation ? (
                  <ActivityIndicator color={colors.accent} />
                ) : null}
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {loadError
                    ? `Unable to load the conversation. ${loadError}`
                    : isLoadingConversation
                      ? "Loading conversation…"
                      : "No messages yet. Start the conversation below."}
                </Text>
              </View>
            }
            ListFooterComponent={
              isTyping ? (
                <TypingIndicator typingUserName={typingUserName} />
              ) : null
            }
          />

          <ChatComposer
            value={text}
            onChangeText={setText}
            onSubmit={(val, file) => handleSend(val, file)}
            onTyping={handleTyping}
            disabled={isSending}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  List data builder (messages + day separators)                      */
/* ------------------------------------------------------------------ */

type ListItem =
  | { type: "message"; key: string; message: ChatMessage }
  | { type: "separator"; key: string; label: string };

function buildListData(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDay = "";

  for (const msg of messages) {
    const day = getDayLabel(msg.timestamp);
    if (day && day !== lastDay) {
      items.push({ type: "separator", key: `sep-${msg.id}`, label: day });
      lastDay = day;
    }
    items.push({ type: "message", key: msg.id, message: msg });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  daySeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 8,
    gap: 10,
  },
  dayLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
