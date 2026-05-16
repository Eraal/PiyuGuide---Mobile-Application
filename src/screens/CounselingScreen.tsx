import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { loadCounselingSessions, MobileCounselingSession } from "../services/backend";
import { CounselingSessionCard } from "../components/CounselingSessionCard";
import { BottomTabBar } from "../components/BottomTabBar";
import { IconCounseling } from "../components/Icons";

interface Props {
  onNewCounseling: () => void;
  onVideoCall: (id: number) => void;
  onProfile: () => void;
  onNotifications: () => void;
  onInquiries: () => void;
  notificationCount: number;
}

export const CounselingScreen: React.FC<Props> = ({
  onNewCounseling,
  onVideoCall,
  onProfile,
  onNotifications,
  onInquiries,
  notificationCount,
}) => {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<MobileCounselingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await loadCounselingSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load counseling sessions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const handleSessionPress = (session: MobileCounselingSession) => {
    // Allow clicking on any session to view status/details
    onVideoCall(session.id);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.cardBackground }]}>
        <IconCounseling size={48} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Counseling Sessions</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        You haven't requested any counseling sessions yet. Click the button below to start.
      </Text>
      <Pressable
        onPress={onNewCounseling}
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.emptyButtonText}>Request a Session</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Counseling</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <CounselingSessionCard session={item} onPress={handleSessionPress} />
            )}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[styles.listContent, sessions.length === 0 && { flex: 1 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
          />
        )}

        <Pressable
          onPress={onNewCounseling}
          style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </SafeAreaView>

      <BottomTabBar
        activeTab="counseling"
        notificationCount={notificationCount}
        onInquiriesPress={onInquiries}
        onCounselingPress={() => {}}
        onNotificationsPress={onNotifications}
        onProfilePress={onProfile}
        onLogout={() => {}} // Handle logout if needed, but App.tsx usually handles it
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 100, // Space for FAB
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
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
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    color: "white",
    fontSize: 28,
    fontWeight: "300",
  },
});
