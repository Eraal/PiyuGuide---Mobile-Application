import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { 
  loadCounselingSession, 
  MobileCounselingSession, 
  submitCounselingFeedback 
} from "../services/backend";
import { format } from "date-fns";
import { BottomTabBar } from "../components/BottomTabBar";

interface Props {
  sessionId: number;
  onBack: () => void;
  onJoinCall: (id: number) => void;
  onProfile: () => void;
  onNotifications: () => void;
  onInquiries: () => void;
  notificationCount: number;
}

export const CounselingDetailsScreen: React.FC<Props> = ({
  sessionId,
  onBack,
  onJoinCall,
  onProfile,
  onNotifications,
  onInquiries,
  notificationCount,
}) => {
  const { colors } = useTheme();
  const [session, setSession] = useState<MobileCounselingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Feedback state
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await loadCounselingSession(sessionId);
      setSession(data);
      if (data.feedback) {
        setFeedbackMessage(data.feedback.message);
      }
    } catch (error) {
      console.error("Failed to load session details:", error);
      Alert.alert("Error", "Failed to load session details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSession();
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return;
    setSubmittingFeedback(true);
    try {
      await submitCounselingFeedback(sessionId, feedbackMessage);
      Alert.alert("Success", "Thank you for your feedback!");
      fetchSession();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCopyLink = () => {
    if (session?.meetingUrl) {
      Clipboard.setString(session.meetingUrl);
      Alert.alert("Success", "Meeting link copied to clipboard!");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "#10b981";
      case "pending": return "#f59e0b";
      case "cancelled": return "#ef4444";
      case "completed": return "#3b82f6";
      case "in_progress": return "#8b5cf6";
      default: return colors.textSecondary;
    }
  };

  const getStatusStep = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return 1;
      case "confirmed": return 2;
      case "in_progress": return 3;
      case "completed": return 4;
      default: return 1;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!session) return null;

  const statusColor = getStatusColor(session.status);
  const currentStep = getStatusStep(session.status);
  const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt) : null;
  const isJoinable = session.status === "confirmed" || session.status === "in_progress";
  const isCompleted = session.status === "completed";

  const renderTimelineStep = (step: number, label: string, isActive: boolean, isLast = false) => {
    const isPast = currentStep > step;
    return (
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={styles.timelinePointContainer}>
          {!isLast && (
            <View style={[
              styles.timelineLine, 
              { backgroundColor: isPast ? statusColor : colors.border }
            ]} />
          )}
          <View style={[
            styles.timelineDotWrapper,
            { backgroundColor: isActive ? statusColor + "20" : "transparent" }
          ]}>
            <View style={[
              styles.timelineDot, 
              { backgroundColor: isActive ? statusColor : colors.border },
              isPast && { backgroundColor: statusColor }
            ]}>
              {isPast && <Text style={styles.timelineCheck}>✓</Text>}
            </View>
          </View>
          <Text style={[
            styles.timelineLabel, 
            { color: isActive ? colors.textPrimary : colors.textSecondary },
            isActive && { fontWeight: "700" }
          ]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={[styles.backIconContainer, { backgroundColor: colors.surface }]}> 
              <Text style={[styles.backIcon, { color: colors.textPrimary }]}>‹</Text>
            </View>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Session Details</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {/* Status Badge */}
          <View style={[styles.statusBadgeWrapper, { backgroundColor: statusColor + "15", borderColor: statusColor + "30" }]}> 
            <View style={[styles.statusDotHeader, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{session.status.toUpperCase()}</Text>
          </View>

          {/* Timeline Card */}
          <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.timelineContainer}>
              {renderTimelineStep(1, "Pending", currentStep >= 1)}
              {renderTimelineStep(2, "Confirmed", currentStep >= 2)}
              {renderTimelineStep(3, "Active", currentStep >= 3)}
              {renderTimelineStep(4, "Done", currentStep >= 4, true)}
            </View>
          </View>

          {/* Office Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.accent + "15" }]}> 
                <Text style={styles.sectionIcon}>🏢</Text>
              </View>
              <View style={styles.cardHeaderCol}>
                <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>OFFICE</Text>
                <Text style={[styles.officeName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {session.office?.name || "Counseling Office"}
                </Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.infoBox}>
                <View style={[styles.smallIconWrapper, { backgroundColor: colors.accent + "15" }]}> 
                  <Text style={styles.smallIcon}>📅</Text>
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                    {scheduledDate ? format(scheduledDate, "MMM d, yyyy") : "Pending"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.infoBox}>
                <View style={[styles.smallIconWrapper, { backgroundColor: colors.accent + "15" }]}> 
                  <Text style={styles.smallIcon}>🕒</Text>
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Time</Text>
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                    {scheduledDate ? format(scheduledDate, "h:mm a") : "Pending"}
                  </Text>
                </View>
              </View>
            </View>

            {session.meetingUrl && (
              <Pressable 
                onPress={handleCopyLink}
                style={({ pressed }) => [
                  styles.copyButton, 
                  { backgroundColor: colors.accent + "10", borderColor: colors.accent + "20" },
                  pressed ? { opacity: 0.7 } : null
                ]}
              >
                <Text style={[styles.copyButtonText, { color: colors.accent }]}>🔗 Copy Meeting Link</Text>
              </Pressable>
            )}
          </View>

          {/* Concern Details */}
          <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
               <View style={[styles.iconWrapper, { backgroundColor: colors.accent + "15" }]}>
                 <Text style={styles.sectionIcon}>📝</Text>
               </View>
               <View style={styles.cardHeaderCol}>
                 <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>NATURE OF CONCERN</Text>
                 <Text style={[styles.concernValue, { color: colors.textPrimary }]}>{session.natureOfConcern || "General Counseling"}</Text>
               </View>
            </View>
            
            {session.notes && (
              <View style={styles.notesContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.cardSectionLabel, { color: colors.textSecondary, marginBottom: 8 }]}>ADDITIONAL NOTES</Text>
                <Text style={[styles.notesValue, { color: colors.textSecondary }]}>{session.notes}</Text>
              </View>
            )}
          </View>

          {/* Action Area */}
          {isJoinable && (
            <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={styles.actionHeader}>
                <View style={[styles.actionIconWrapper, { backgroundColor: colors.accent + "15" }]}> 
                  <Text style={styles.sectionIcon}>🎥</Text>
                </View>
                <View style={styles.actionHeaderText}>
                  <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>VIDEO CALL</Text>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Join your session</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Connect with your counselor when the room is ready.</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => onJoinCall(session.id)}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  { backgroundColor: colors.navy },
                  pressed ? { transform: [{ scale: 0.985 }], opacity: 0.92 } : null
                ]}
              >
                <Text style={styles.joinIcon}>🎥</Text>
                <Text style={[styles.primaryActionText, { color: colors.accentText }]}>JOIN VIDEO CALL</Text>
              </Pressable>
            </View>
          )}

          {isCompleted && (
            <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={styles.feedbackHeader}>
                <View style={[styles.actionIconWrapper, { backgroundColor: statusColor + "15" }]}> 
                  <Text style={styles.sectionIcon}>⭐</Text>
                </View>
                <View style={styles.actionHeaderText}>
                  <Text style={[styles.cardSectionLabel, { color: colors.textSecondary }]}>SESSION FEEDBACK</Text>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Tell us how it went</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Your feedback helps us improve future counseling sessions.</Text>
                </View>
              </View>

              {session.feedback ? (
                <View style={[styles.submittedFeedback, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                  <Text style={[styles.submittedText, { color: colors.textPrimary }]}>{"\""}{session.feedback.message}{"\""}</Text>
                  <Text style={[styles.submittedDate, { color: colors.textSecondary }]}> 
                    Submitted on {format(new Date(session.feedback.createdAt), "MMM d, yyyy")}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={[styles.feedbackPrompt, { color: colors.textSecondary }]}> 
                    How was your experience? Your feedback helps us improve our services.
                  </Text>
                  <TextInput
                    style={[styles.feedbackInput, { 
                      backgroundColor: colors.background, 
                      color: colors.textPrimary,
                      borderColor: colors.borderStrong
                    }]}
                    placeholder="Write your feedback here..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={feedbackMessage}
                    onChangeText={setFeedbackMessage}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleFeedbackSubmit}
                    disabled={!feedbackMessage.trim() || submittingFeedback}
                    style={({ pressed }) => [
                      styles.primaryActionButton,
                      { backgroundColor: colors.navy },
                      (!feedbackMessage.trim() || submittingFeedback) ? { opacity: 0.64 } : null,
                      pressed ? { transform: [{ scale: 0.985 }] } : null
                    ]}
                  >
                    {submittingFeedback ? (
                      <ActivityIndicator color={colors.accentText} size="small" />
                    ) : (
                      <Text style={[styles.primaryActionText, { color: colors.accentText }]}>SUBMIT FEEDBACK</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {session.status === "pending" && (
            <View style={[styles.statusNotice, { backgroundColor: statusColor + "15", borderColor: statusColor + "30" }]}>
              <Text style={[styles.noticeIcon, { color: statusColor }]}>⏳</Text>
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                This request is pending approval. We'll notify you once confirmed.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomTabBar
        activeTab="counseling"
        notificationCount={notificationCount}
        onInquiriesPress={onInquiries}
        onCounselingPress={onBack}
        onNotificationsPress={onNotifications}
        onProfilePress={onProfile}
        onLogout={() => {}}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  backButton: { minWidth: 44, height: 44, justifyContent: "center" },
  backIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)"
  },
  backIcon: { fontSize: 28, lineHeight: 32, marginLeft: -2, marginTop: -2 },
  backButtonPlaceholder: { width: 44 },
  scrollContent: { padding: 16, paddingBottom: 160 },
  statusBadgeWrapper: {
    flexDirection: "row", alignItems: "center", alignSelf: "center",
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginBottom: 20,
  },
  statusDotHeader: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  timelineCard: {
    padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1,
  },
  timelineContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%" },
  timelineStep: { flex: 1, alignItems: "center" },
  timelinePointContainer: {
    flexDirection: "row", alignItems: "center", marginBottom: 20,
    width: "100%", justifyContent: "center", position: "relative",
  },
  timelineDotWrapper: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center", zIndex: 2,
  },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    justifyContent: "center", alignItems: "center",
  },
  timelineCheck: { color: "white", fontSize: 8, fontWeight: "900" },
  timelineLine: {
    position: "absolute", left: "50%", right: "-50%",
    height: 3, top: 10.5, zIndex: 1, borderRadius: 2,
  },
  timelineLabel: { 
    position: "absolute", top: 28, width: 80, textAlign: "center",
    fontSize: 9, letterSpacing: 0, textTransform: "uppercase", fontWeight: "600" 
  },
  infoCard: {
    padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center" },
  iconWrapper: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center", marginRight: 16,
  },
  sectionIcon: { fontSize: 22 },
  cardHeaderCol: { flex: 1, justifyContent: "center" },
  cardSectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  officeName: { fontSize: 20, fontWeight: "800" },
  divider: { height: 1, opacity: 0.5, marginVertical: 20 },
  dateTimeContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  infoBox: { flexDirection: "row", alignItems: "center", flex: 1 },
  smallIconWrapper: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  smallIcon: { fontSize: 18 },
  infoLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  infoText: { fontSize: 15, fontWeight: "700" },
  copyButton: {
    marginTop: 24, height: 50, borderRadius: 16, borderWidth: 1,
    justifyContent: "center", alignItems: "center", flexDirection: "row",
  },
  copyButtonText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  detailsSection: {
    padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1,
  },
  concernValue: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  notesContainer: { marginTop: 4 },
  notesValue: { fontSize: 15, lineHeight: 24, fontStyle: "italic", opacity: 0.9 },
  joinButton: {
    height: 56, borderRadius: 16, flexDirection: "row",
    justifyContent: "center", alignItems: "center", marginTop: 12,
  },
  joinIcon: { fontSize: 20, marginRight: 10 },
  joinButtonText: { color: "white", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  actionCard: {
    padding: 20,
    borderRadius: 24,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionHeaderText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  feedbackHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  feedbackTitle: { fontSize: 20, fontWeight: "800" },
  feedbackPrompt: { fontSize: 15, marginBottom: 16, lineHeight: 22 },
  feedbackInput: {
    minHeight: 120, borderRadius: 20, borderWidth: 1, padding: 20,
    textAlignVertical: "top", fontSize: 15, marginBottom: 16,
  },
  primaryActionButton: {
    minHeight: 56,
    width: "100%",
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryActionText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.7 },
  submittedFeedback: { padding: 20, borderRadius: 20, borderWidth: 1 },
  submittedText: { fontSize: 16, lineHeight: 24, fontStyle: "italic", marginBottom: 12 },
  submittedDate: { fontSize: 13, fontWeight: "600" },
  statusNotice: {
    padding: 20, borderRadius: 24, marginTop: 16, borderWidth: 1,
    flexDirection: "row", alignItems: "center",
  },
  noticeIcon: { fontSize: 24, marginRight: 16 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: "500" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
