import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";

type ChatHeaderProps = {
  officeName: string;
  isTyping?: boolean;
  typingUserName?: string;
  isConnected?: boolean;
  onBack: () => void;
  onShowDetails?: () => void;
};

export function ChatHeader({
  officeName,
  isTyping = false,
  typingUserName,
  isConnected = true,
  onBack,
  onShowDetails,
}: ChatHeaderProps) {
  const { colors } = useTheme();

  // Build initials from office name
  const initials = officeName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  let statusText = "Active now";
  let statusColor = colors.online;
  if (isTyping) {
    statusText = typingUserName ? `${typingUserName} is typing…` : "Typing…";
    statusColor = colors.online;
  } else if (!isConnected) {
    statusText = "Reconnecting…";
    statusColor = colors.textMuted;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.headerBackground,
          borderBottomColor: colors.border,
          shadowColor: "#000",
        },
      ]}
    >
      {/* Back button */}
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && { opacity: 0.6 },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={[styles.backArrow, { color: colors.accent }]}>←</Text>
      </Pressable>

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
        <Text style={styles.avatarText}>{initials}</Text>
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: isConnected ? colors.online : colors.textMuted,
              borderColor: colors.headerBackground,
            },
          ]}
        />
      </View>

      {/* Office info */}
      <View style={styles.info}>
        <Text
          style={[styles.officeName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {officeName}
        </Text>
        <Text
          style={[
            styles.status,
            { color: statusColor },
            isTyping && styles.statusTyping,
          ]}
          numberOfLines={1}
        >
          {statusText}
        </Text>
      </View>

      {/* Info button */}
      <Pressable
        onPress={onShowDetails}
        style={({ pressed }) => [
          styles.infoButton,
          pressed && { opacity: 0.6 },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Show inquiry details"
      >
        <IconInfo color={colors.accent} />
      </Pressable>
    </View>
  );
}

function IconInfo({ color }: { color: string }) {
  return (
    <View style={styles.iconInfoBase}>
      <View style={[styles.iconInfoCircle, { borderColor: color }]}>
        <View style={[styles.iconInfoDot, { backgroundColor: color }]} />
        <View style={[styles.iconInfoLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    // Soft bottom shadow
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: Platform.OS === "android" ? -2 : 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  officeName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  status: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  statusTyping: {
    fontStyle: "italic",
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  iconInfoBase: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInfoCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  iconInfoDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    marginBottom: 2,
  },
  iconInfoLine: {
    width: 2.5,
    height: 7,
    borderRadius: 1.25,
  },
});
