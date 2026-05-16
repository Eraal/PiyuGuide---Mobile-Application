import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

// ─── Types ───────────────────────────────────────────────────────────────────

export type InCallChatMessage = {
  id: string;
  userId: number;
  name: string;
  role: string;
  message: string;
  timestamp: string;
  isSelf: boolean;
};

interface Props {
  visible: boolean;
  messages: InCallChatMessage[];
  typingName: string | null;
  onSend: (text: string) => void;
  onTyping: () => void;
  onClose: () => void;
  unreadCount: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const InCallChat: React.FC<Props> = ({
  visible,
  messages,
  typingName,
  onSend,
  onTyping,
  onClose,
  unreadCount,
}) => {
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const translateY = useSharedValue(600);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 600, {
      damping: 22,
      stiffness: 180,
    });
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [visible, translateY]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }, [text, onSend]);

  const handleChangeText = useCallback(
    (t: string) => {
      setText(t);
      onTyping();
    },
    [onTyping],
  );

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const renderMessage = ({ item }: { item: InCallChatMessage }) => (
    <View
      style={[
        styles.msgRow,
        item.isSelf ? styles.msgRowSelf : styles.msgRowOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          item.isSelf ? styles.bubbleSelf : styles.bubbleOther,
        ]}
      >
        {!item.isSelf && <Text style={styles.senderName}>{item.name}</Text>}
        <Text
          style={[styles.msgText, item.isSelf ? styles.msgTextSelf : null]}
        >
          {item.message}
        </Text>
        <Text style={styles.msgTime}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>In-call messages</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.systemMsg}>
              <Text style={styles.systemMsgText}>
                Messages are not saved after the session ends.
              </Text>
            </View>
          }
        />

        {/* Typing indicator */}
        {typingName && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{typingName} is typing…</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Send a message…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={text}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            maxLength={1000}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            style={[
              styles.sendBtn,
              text.trim() ? styles.sendBtnActive : null,
            ]}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

// ─── Chat Badge ──────────────────────────────────────────────────────────────

interface ChatBadgeProps {
  count: number;
}

export const ChatBadge: React.FC<ChatBadgeProps> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <View style={badgeStyles.badge}>
      <Text style={badgeStyles.text}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  text: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    backgroundColor: "rgba(15,15,20,0.92)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 150,
    overflow: "hidden",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  systemMsg: {
    alignItems: "center",
    paddingVertical: 12,
  },
  systemMsgText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  msgRow: {
    marginVertical: 3,
  },
  msgRowSelf: {
    alignItems: "flex-end",
  },
  msgRowOther: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleSelf: {
    backgroundColor: "rgba(99,102,241,0.85)",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: "rgba(165,180,252,0.9)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 3,
  },
  msgText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextSelf: {
    color: "white",
  },
  msgTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  typingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "white",
    fontSize: 14,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: {
    backgroundColor: "rgba(99,102,241,0.85)",
  },
  sendIcon: {
    color: "white",
    fontSize: 18,
  },
});
