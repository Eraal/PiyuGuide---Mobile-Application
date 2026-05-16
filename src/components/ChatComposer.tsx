import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as DocumentPicker from "expo-document-picker";

import { useTheme } from "../theme/ThemeContext";
import { usePressScale } from "../hooks/usePressScale";

type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string, file?: DocumentPicker.DocumentPickerAsset) => void;
  onTyping?: () => void;
  disabled?: boolean;
};

function isImageMime(mimeType: string | undefined | null): boolean {
  return !!mimeType && mimeType.startsWith("image/");
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatComposer({
  value,
  onChangeText,
  onSubmit,
  onTyping,
  disabled = false,
}: ChatComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { scale, handlePressIn, handlePressOut } = usePressScale();
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    onTyping?.();
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error("Failed to pick document:", err);
    }
  };

  const handleSubmit = () => {
    if (!canSend) return;
    onSubmit(value, selectedFile ?? undefined);
    setSelectedFile(null);
  };

  const canSend =
    (value.trim().length > 0 || selectedFile !== null) && !disabled;

  // Bottom padding: account for iOS home-indicator safe area
  const bottomPadding = Math.max(insets.bottom, 8);

  const isImage = isImageMime(selectedFile?.mimeType);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.composerBackground,
          paddingBottom: bottomPadding,
          shadowColor: "#000",
        },
      ]}
    >
      {/* File attachment preview */}
      {selectedFile && (
        <View
          style={[
            styles.filePreview,
            { backgroundColor: colors.surfaceHover, borderColor: colors.border },
          ]}
        >
          {/* Image thumbnail or file icon */}
          {isImage ? (
            <Image
              source={{ uri: selectedFile.uri }}
              style={styles.fileThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.fileIconBox,
                { backgroundColor: colors.accentLight },
              ]}
            >
              <Text style={styles.fileEmoji}>📄</Text>
            </View>
          )}
          <View style={styles.fileInfo}>
            <Text
              style={[styles.fileName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {selectedFile.name}
            </Text>
            {selectedFile.size ? (
              <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                {formatFileSize(selectedFile.size)}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSelectedFile(null)}
            style={({ pressed }) => [
              styles.fileRemoveButton,
              { backgroundColor: colors.surfaceHover },
              pressed && { opacity: 0.5 },
            ]}
            hitSlop={8}
          >
            <Text style={[styles.fileRemoveIcon, { color: colors.textMuted }]}>
              ✕
            </Text>
          </Pressable>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Text input pill with attachment icon inside */}
        <View
          style={[
            styles.inputPill,
            { backgroundColor: colors.composerInputBackground },
          ]}
        >
          {/* Attachment button */}
          <Pressable
            onPress={handlePickDocument}
            style={({ pressed }) => [
              styles.attachButton,
              pressed && { opacity: 0.5 },
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Attach file"
          >
            <View style={styles.attachIconContainer}>
              <View
                style={[
                  styles.attachCircle,
                  { borderColor: colors.composerIcon },
                ]}
              >
                <Text style={[styles.attachPlus, { color: colors.composerIcon }]}>
                  +
                </Text>
              </View>
            </View>
          </Pressable>

          <TextInput
            editable={!disabled}
            style={[
              styles.input,
              { color: colors.composerInputText },
              disabled && styles.inputDisabled,
            ]}
            placeholder="Type a message…"
            placeholderTextColor={colors.composerPlaceholder}
            value={value}
            onChangeText={handleChangeText}
            onSubmitEditing={canSend ? handleSubmit : undefined}
            returnKeyType="send"
            multiline
            maxLength={2000}
          />
        </View>

        {/* Send button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={handleSubmit}
          onPressIn={canSend ? handlePressIn : undefined}
          onPressOut={canSend ? handlePressOut : undefined}
          disabled={!canSend}
          style={styles.sendButtonContainer}
        >
          <Animated.View
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.accent,
                transform: [{ scale: canSend ? scale : 1 }],
                opacity: canSend ? 1 : 0.3,
              },
            ]}
          >
            {disabled ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    // Soft top shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  fileThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    flexShrink: 0,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileEmoji: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  fileSize: {
    fontSize: 12,
  },
  fileRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileRemoveIcon: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === "ios" ? 5 : 3,
    minHeight: 44,
    maxHeight: 120,
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  attachIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  attachCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
  },
  attachPlus: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: -1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 100,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    paddingRight: 10,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 1 : 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
});
