import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, isYesterday, parseISO } from "date-fns";

import { type MobileInquirySummary, type MobileUser } from "../services/backend";
import { useTheme } from "../theme/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";
import { usePressScale } from "../hooks/usePressScale";
import { BottomTabBar } from "../components/BottomTabBar";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type InquiryListScreenProps = {
  currentUser: MobileUser | null;
  inquiries: MobileInquirySummary[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  onSelectInquiry: (inquiryId: number, officeName: string) => void;
  onNewInquiry: () => void;
  onCounseling: () => void;
  onProfile: () => void;
  onNotifications: () => void;
  onLogout: () => void;
  notificationCount?: number;
};

/* ------------------------------------------------------------------ */
/*  Time formatting                                                   */
/* ------------------------------------------------------------------ */

function formatInquiryTime(timestampStr: string | null): string {
  if (!timestampStr) return "";
  try {
    const date = parseISO(timestampStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return "";
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MM/dd/yy");
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/*  Office avatar color hash                                          */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  "#E53935", "#1E88E5", "#43A047", "#FB8C00",
  "#8E24AA", "#00ACC1", "#3949AB", "#D81B60",
  "#F4511E", "#00897B", "#546E7A", "#7CB342"
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Screen Component                                                  */
/* ------------------------------------------------------------------ */

export default function InquiryListScreen({
  currentUser,
  inquiries,
  isLoading,
  onRefresh,
  onSelectInquiry,
  onNewInquiry,
  onCounseling,
  onProfile,
  onNotifications,
  onLogout,
  notificationCount = 0
}: InquiryListScreenProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const screenEntrance = useEntranceAnimation();

  // LayoutAnimation when list reorders or items update
  useEffect(() => {
    if (inquiries.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [inquiries]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }, [onRefresh]);

  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) return inquiries;
    const q = searchQuery.toLowerCase();
    return inquiries.filter(
      (inq) =>
        (inq.officeName || "").toLowerCase().includes(q) ||
        (inq.subject || "").toLowerCase().includes(q) ||
        (inq.latestMessagePreview || "").toLowerCase().includes(q),
    );
  }, [inquiries, searchQuery]);

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
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Inquiries</Text>
            <Pressable onPress={onProfile} style={styles.headerProfile}>
              {currentUser?.profilePicUrl ? (
                <Image
                  source={{ uri: currentUser.profilePicUrl }}
                  style={[styles.profileAvatar, { borderColor: colors.border }]}
                />
              ) : (
                <View style={[styles.profileAvatarFallback, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.profileAvatarText, { color: "#FFF" }]}>
                    {currentUser?.fullName?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceHover }]}>
              <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search conversations..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>

        {/* Content */}
        {isLoading && inquiries.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredInquiries}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {searchQuery ? "No results found" : "No inquiries yet"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? "Try a different search term."
                    : "Tap the + button to start a new conversation with a campus office."}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <InquiryItem
                item={item}
                onPress={() => onSelectInquiry(item.id, item.officeName || "Office")}
              />
            )}
          />
        )}

        {/* FAB */}
        <Pressable
          style={[styles.fab, { backgroundColor: colors.fabBackground }]}
          onPress={onNewInquiry}
          accessibilityLabel="New Inquiry"
        >
          <Text style={[styles.fabIcon, { color: colors.fabIcon }]}>+</Text>
        </Pressable>
      </SafeAreaView>

      <BottomTabBar 
        activeTab="inquiries"
        notificationCount={notificationCount}
        onInquiriesPress={() => {}}
        onCounselingPress={onCounseling}
        onNotificationsPress={onNotifications}
        onProfilePress={onProfile} 
        onLogout={onLogout} 
      />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Inquiry item row                                                  */
/* ------------------------------------------------------------------ */

function InquiryItem({
  item,
  onPress,
}: {
  item: MobileInquirySummary & { isRecentlyUpdated?: boolean };
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.98 });
  
  // Highlight animation for real-time updates
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item.isRecentlyUpdated) {
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 0, duration: 2000, useNativeDriver: false })
      ]).start();
    }
  }, [item.isRecentlyUpdated, item.updatedAt]);

  const officeName = item.officeName || "Office";
  const initials = getInitials(officeName);
  const avatarColor = getAvatarColor(officeName);
  const timeStr = formatInquiryTime(item.latestMessageAt || item.updatedAt || item.createdAt);
  const isPending = (item.status || "").toLowerCase() === "pending";

  const backgroundColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.accentLight]
  });

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.itemContainer,
          {
            backgroundColor: backgroundColor,
            borderBottomColor: colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Office Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
          <View style={styles.itemTopRow}>
            <Text
              style={[styles.officeName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {officeName}
            </Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {timeStr}
            </Text>
          </View>

          <View style={styles.itemBottomRow}>
            <Text
              style={[styles.previewText, { 
                color: isPending ? colors.textPrimary : colors.textSecondary,
                fontWeight: isPending ? "700" : "400"
              }]}
              numberOfLines={1}
            >
              {item.latestMessagePreview || item.subject || "No messages yet."}
            </Text>

            {isPending ? (
              <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                <View style={styles.unreadDot} />
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerProfile: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  profileAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    padding: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  officeName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "400",
    flexShrink: 0,
  },
  itemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 110 : 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },
});
