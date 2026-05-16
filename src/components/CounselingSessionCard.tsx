import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { MobileCounselingSession } from "../services/backend";
import { format } from "date-fns";

interface Props {
  session: MobileCounselingSession;
  onPress: (session: MobileCounselingSession) => void;
}

export const CounselingSessionCard: React.FC<Props> = ({ session, onPress }) => {
  const { colors } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "#10b981"; // Emerald
      case "pending":
        return "#f59e0b"; // Amber
      case "cancelled":
        return "#ef4444"; // Red
      case "completed":
        return "#3b82f6"; // Blue
      case "in_progress":
        return "#8b5cf6"; // Violet
      default:
        return colors.textSecondary;
    }
  };

  const statusLower = session.status.toLowerCase();
  const statusColor = getStatusColor(statusLower);
  const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt) : null;
  const timeStr = scheduledDate ? format(scheduledDate, "MMM d, h:mm a") : "Time TBD";
  const isClickable = true; // All sessions are now clickable to view details

  return (
    <Pressable
      onPress={() => isClickable && onPress(session)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: isClickable && pressed ? statusColor : colors.border,
          opacity: isClickable && pressed ? 0.9 : 1,
          borderLeftColor: statusColor,
          borderLeftWidth: 4,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.avatar, { backgroundColor: statusColor + "15" }]}>
            <Text style={[styles.avatarText, { color: statusColor }]}>
              {session.office?.name?.[0]?.toUpperCase() || "C"}
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={[styles.officeName, { color: colors.textPrimary }]} numberOfLines={1}>
              {session.office?.name || "Office"}
            </Text>
            <Text style={[styles.concernText, { color: colors.textSecondary }]} numberOfLines={1}>
              {session.natureOfConcern || "General Counseling"}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {timeStr}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {session.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
        <View style={[styles.actionIndicator, { backgroundColor: statusColor }]}>
          <Text style={styles.actionText}>
            {statusLower === "confirmed" || statusLower === "in_progress" ? "JOIN" : "VIEW"}
          </Text>
        </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  content: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  details: {
    flex: 1,
  },
  officeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  concernText: {
    fontSize: 13,
  },
  rightSection: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  actionIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  actionText: {
    color: "white",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
