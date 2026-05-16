import { Animated, ScrollView, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";
import { usePressScale } from "../hooks/usePressScale";
import type { MobileUser } from "../services/backend";

type ProfileScreenProps = {
  user: MobileUser | null;
  onBack: () => void;
  onLogout: () => void;
};

/* ------------------------------------------------------------------ */
/*  Avatar Placeholder                                                */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/* ------------------------------------------------------------------ */
/*  Profile Card Component                                            */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={styles.infoLabelContainer}>
        {icon ? <Text style={[styles.infoIcon, { color: colors.textMuted }]}>{icon}</Text> : null}
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value || "Not set"}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                       */
/* ------------------------------------------------------------------ */

export default function ProfileScreen({ user, onBack, onLogout }: ProfileScreenProps) {
  const { colors } = useTheme();
  const screenEntrance = useEntranceAnimation();
  const logoutPress = usePressScale();

  if (!user) return null;

  const initials = getInitials(user.fullName);

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Text style={[styles.backIcon, { color: colors.accent }]}>←</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Profile Section */}
          <View style={styles.profileHero}>
            <View style={[styles.avatarContainer, { shadowColor: colors.accent }]}>
              {user.profilePicUrl ? (
                <Image source={{ uri: user.profilePicUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              {user.isActive && (
                <View style={[styles.statusBadge, { backgroundColor: colors.online, borderColor: colors.background }]} />
              )}
            </View>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.fullName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.roleText, { color: colors.accent }]}>{user.role.toUpperCase()}</Text>
            </View>
          </View>

          {/* Academic Information Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACADEMIC INFORMATION</Text>
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <InfoRow label="Student Number" value={user.student?.studentNumber} icon="ID" />
              <InfoRow label="Campus" value={user.campusName} icon="CP" />
              <InfoRow label="College / Department" value={user.student?.department} icon="DP" />
              <InfoRow 
                label="Year & Section" 
                value={`${user.student?.yearLevel || ""} - ${user.student?.section || ""}`.replace(/^ - $/, "")} 
                icon="GR" 
              />
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT INFORMATION</Text>
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <InfoRow label="Email Address" value={user.email} icon="@" />
              <InfoRow label="Contact Number" value={user.contactNumber} icon="#" />
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.actionsContainer}>
            <Pressable
              onPress={onLogout}
              onPressIn={logoutPress.handlePressIn}
              onPressOut={logoutPress.handlePressOut}
              style={{ marginTop: 24, marginBottom: 40 }}
            >
              <Animated.View
                style={[
                  styles.logoutButton,
                  { 
                    backgroundColor: colors.accentLight,
                    transform: [{ scale: logoutPress.scale }] 
                  },
                ]}
              >
                <Text style={[styles.logoutButtonText, { color: colors.accent }]}>Sign Out</Text>
              </Animated.View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  backIcon: { fontSize: 26, fontWeight: "600" },
  headerTitle: { fontSize: 19, fontWeight: "700", letterSpacing: 0.3 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  /* Profile Hero */
  profileHero: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    position: "relative",
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFF",
    fontSize: 40,
    fontWeight: "800",
  },
  statusBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* Sections & Cards */
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoIcon: {
    fontSize: 11,
    fontWeight: "800",
    width: 22,
    textAlign: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },

  /* Actions */
  actionsContainer: {
    marginTop: 10,
  },
  logoutButton: {
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
