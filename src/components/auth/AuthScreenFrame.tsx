import { ReactNode } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEntranceAnimation } from "../../hooks/useEntranceAnimation";
import { brand } from "../../constants/brand";
import { colors } from "../../theme/colors";
import { LogoMark } from "../LogoMark";

type AuthScreenFrameProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  topRightLabel?: string;
  contextLabel?: string;
  notice?: string;
  noticeTone?: "info" | "success";
  children: ReactNode;
  footer?: ReactNode;
  /** Optional back button label (e.g. "← Change Campus") */
  backLabel?: string;
  /** Called when back button is pressed */
  onBack?: () => void;
};

export function AuthScreenFrame({
  eyebrow,
  title,
  subtitle,
  topRightLabel,
  contextLabel,
  notice,
  noticeTone = "info",
  children,
  footer,
  backLabel,
  onBack,
}: AuthScreenFrameProps) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 700;
  const entrance = useEntranceAnimation({ startTranslateY: 14, opacityDuration: 420, translateDuration: 450 });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.container,
        {
          opacity: entrance.opacity,
          transform: [{ translateY: entrance.translateY }],
        },
      ]}
    >
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              bounces={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={[styles.shell, isCompact && styles.shellCompact]}>
                
                {/* STANDALONE PROMINENT BACK BUTTON */}
                {onBack && backLabel ? (
                  <View style={styles.backButtonRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onBack}
                      hitSlop={12}
                      style={({ pressed }) => [styles.backBtnAction, pressed && { opacity: 0.6 }]}
                    >
                      <View style={styles.backBtnInner}>
                        <Text style={styles.backIcon}>←</Text>
                        <Text style={styles.backLabelText}>{backLabel}</Text>
                      </View>
                    </Pressable>
                  </View>
                ) : null}

                {/* Header Section */}
                <View style={styles.header}>
                  <View style={styles.brandRow}>
                    <View style={styles.brandCopy}>
                      <Text style={styles.brandName}>{brand.name}</Text>
                      <Text style={styles.brandTagline}>{brand.tagline}</Text>
                    </View>
                  </View>

                  <View style={styles.brandPill}>
                    <Text style={styles.brandPillText}>{topRightLabel ?? brand.authPortalLabel}</Text>
                  </View>
                </View>

                {contextLabel ? (
                  <View style={styles.contextPill}>
                    <View style={styles.contextDot} />
                    <Text style={styles.contextPillText}>Campus: {contextLabel}</Text>
                  </View>
                ) : null}

                {/* The Card */}
                <View style={[styles.card, isCompact && styles.cardCompact]}>
                  <View style={styles.cardAccent} />

                  <View style={styles.copyBlock}>
                    <View style={styles.eyebrowPill}>
                      <Text style={styles.eyebrowText}>{eyebrow}</Text>
                    </View>
                    <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>
                    <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>{subtitle}</Text>
                  </View>

                  {notice ? (
                    <View
                      style={[
                        styles.notice,
                        noticeTone === "success" ? styles.noticeSuccess : styles.noticeInfo,
                      ]}
                    >
                      <Text
                        style={[
                          styles.noticeText,
                          noticeTone === "success" ? styles.noticeTextSuccess : styles.noticeTextInfo,
                        ]}
                      >
                        {notice}
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.form, isCompact && styles.formCompact]}>{children}</View>
                </View>

                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.panelBackground },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.panelBackground },
  orbTop: {
    position: "absolute", top: -100, right: -80, width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(29,78,216,0.06)",
  },
  orbBottom: {
    position: "absolute", left: -120, bottom: 60, width: 320, height: 320, borderRadius: 160,
    backgroundColor: "rgba(16,185,129,0.05)",
  },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 16,
  },
  shell: { width: "100%", maxWidth: 480, alignSelf: "center" },
  shellCompact: { maxWidth: 460 },

  /* PROMINENT BACK BUTTON */
  backButtonRow: {
    marginBottom: 16,
    marginLeft: 4,
  },
  backBtnAction: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(2,60,105,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2,60,105,0.1)",
  },
  backBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backIcon: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  backLabelText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: 0.1,
  },

  /* Header */
  header: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16, paddingHorizontal: 4,
  },
  brandRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  brandCopy: { flex: 1 },
  brandName: { fontSize: 19, fontWeight: "800", letterSpacing: -0.3, color: colors.navy },
  brandTagline: { marginTop: 1, fontSize: 11, lineHeight: 14, color: colors.textSecondary, fontWeight: "500" },
  brandPill: {
    borderRadius: 9999, borderWidth: 1, borderColor: "rgba(2,60,105,0.08)", backgroundColor: "rgba(2,60,105,0.05)",
    paddingHorizontal: 11, paddingVertical: 6,
  },
  brandPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", color: colors.navy },

  /* Context */
  contextPill: {
    alignSelf: "flex-start", marginBottom: 14, borderRadius: 20, borderWidth: 1, borderColor: "rgba(2,60,105,0.08)",
    backgroundColor: "rgba(2,60,105,0.04)", paddingHorizontal: 12, paddingVertical: 7,
    flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4,
  },
  contextDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  contextPillText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },

  /* Card */
  card: {
    overflow: "hidden", borderRadius: 30, borderWidth: 1, borderColor: "#dce6ee", backgroundColor: colors.surface,
    shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 3,
  },
  cardCompact: { borderRadius: 26 },
  cardAccent: { height: 5, backgroundColor: colors.navy },
  copyBlock: { paddingHorizontal: 22, paddingTop: 24, gap: 12 },
  eyebrowPill: {
    alignSelf: "flex-start", borderRadius: 9999, backgroundColor: "rgba(2,60,105,0.06)", paddingHorizontal: 11, paddingVertical: 6,
  },
  eyebrowText: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.navy },
  title: {
    fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -0.5, color: colors.navy,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  titleCompact: { fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  subtitleCompact: { fontSize: 14, lineHeight: 21 },
  notice: { marginHorizontal: 22, marginTop: 18, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14 },
  noticeInfo: { borderColor: "rgba(29,78,216,0.12)", backgroundColor: "rgba(29,78,216,0.06)" },
  noticeSuccess: { borderColor: "rgba(16,185,129,0.12)", backgroundColor: colors.successSurface },
  noticeText: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  noticeTextInfo: { color: colors.navy },
  noticeTextSuccess: { color: colors.successText },
  form: { gap: 14, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 26 },
  formCompact: { gap: 12, paddingTop: 18, paddingBottom: 22 },
  footer: { marginTop: 18, alignItems: "center" },
});