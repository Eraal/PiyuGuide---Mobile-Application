import { useEffect } from "react";
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";
import { markNotificationRead, type MobileNotification } from "../services/backend";
import { colors as legacyColors } from "../theme/colors";
import { BottomTabBar } from "../components/BottomTabBar";

type NotificationScreenProps = {
  notifications: MobileNotification[];
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onInquiries: () => void;
  onCounseling: () => void;
  onSelectInquiry: (id: number) => void;
  onProfile: () => void;
  onLogout: () => void;
  notificationCount?: number;
};

export default function NotificationScreen({ 
  notifications, 
  onRefresh,
  onBack, 
  onInquiries, 
  onCounseling,
  onSelectInquiry, 
  onProfile, 
  onLogout,
  notificationCount = 0
}: NotificationScreenProps) {
  const { colors } = useTheme();
  const screenEntrance = useEntranceAnimation();

  // Automatically mark all as read when entering the screen (after a short delay for smooth feel)
  useEffect(() => {
    const markAllRead = async () => {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length > 0) {
        try {
          await markNotificationRead();
          // We don't strictly need to update local state here because App.tsx 
          // should ideally be the source of truth, but we can call onRefresh
          // to sync the UI immediately.
          void onRefresh();
        } catch (error) {
          console.error("Failed to mark all read:", error);
        }
      }
    };
    
    const timer = setTimeout(markAllRead, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNotificationPress = async (notif: MobileNotification) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.id);
        void onRefresh();
      } catch (error) {
        console.error("Failed to mark read:", error);
      }
    }

    if (notif.inquiryId) {
      onSelectInquiry(notif.inquiryId);
    }
  };

  const renderItem = ({ item }: { item: MobileNotification }) => {
    const date = new Date(item.createdAt);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const msg = item.message.toLowerCase();
    let statusText = "Update";
    let statusColor = colors.accent;
    
    if (msg.includes("resolved")) {
      statusText = "Resolved";
      statusColor = legacyColors.green;
    } else if (msg.includes("closed")) {
      statusText = "Closed";
      statusColor = colors.textMuted;
    } else if (msg.includes("in progress")) {
      statusText = "In Progress";
      statusColor = "#1E88E5";
    }

    return (
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={() => handleNotificationPress(item)}
          style={({ pressed }) => [
            styles.notifCard,
            { 
              backgroundColor: colors.surface,
              borderColor: item.isRead ? colors.border : colors.accent + "40",
              borderLeftColor: statusColor
            },
            pressed && { opacity: 0.85 }
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
            </View>
            <Text style={[styles.notifTime, { color: colors.textMuted }]}>
              {timeStr}
            </Text>
          </View>

          <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
            {item.message}
          </Text>

          <View style={styles.cardFooter}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "15" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusText}</Text>
            </View>
            <Text style={[styles.notifDate, { color: colors.textMuted }]}>
              {dateStr}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <Text style={[styles.backIcon, { color: colors.accent }]}>←</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Activity</Text>
            <Pressable onPress={onRefresh} hitSlop={8} style={styles.markReadBtn}>
              <Text style={[styles.markReadText, { color: colors.accent }]}>Refresh</Text>
            </Pressable>
          </View>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Stay updated with your inquiry status
          </Text>
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.surfaceHover }]}>
                <Text style={styles.emptyIcon}>🔔</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All caught up!</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You don't have any new status updates right now.
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      <BottomTabBar
        activeTab="notifications"
        notificationCount={notificationCount}
        onInquiriesPress={onInquiries}
        onCounselingPress={onCounseling}
        onNotificationsPress={() => {}}
        onProfilePress={onProfile}
        onLogout={onLogout}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  backIcon: { fontSize: 24, fontWeight: "600" },
  headerTitle: { fontSize: 28, fontWeight: "800", flex: 1, marginLeft: 8 },
  markReadBtn: {
    backgroundColor: "rgba(229,57,53,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markReadText: { fontSize: 13, fontWeight: "700" },
  headerSub: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 32,
    opacity: 0.8,
  },
  listContent: { 
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 12,
  },
  cardWrapper: {
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  notifCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  notifDate: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
  },
});
