import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadInquiryNatures,
  loadOffices,
  submitNewInquiry,
  type MobileInquiryNature,
  type MobileOffice,
} from "../services/backend";
import { useTheme } from "../theme/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";
import { useStaggeredEntrance } from "../hooks/useStaggeredEntrance";
import { usePressScale } from "../hooks/usePressScale";
import { useFocusAnimation } from "../hooks/useFocusAnimation";

type NewInquiryScreenProps = {
  onBack: () => void;
  onCreated: (inquiryId: number) => void;
};

/* ------------------------------------------------------------------ */
/*  Avatar helpers                                                    */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  "#E53935", "#1E88E5", "#43A047", "#FB8C00",
  "#8E24AA", "#00897B", "#3949AB", "#D81B60",
  "#6D4C41", "#546E7A",
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
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

export default function NewInquiryScreen({ onBack, onCreated }: NewInquiryScreenProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<"office" | "details">("office");
  const [offices, setOffices] = useState<MobileOffice[]>([]);
  const [natures, setNatures] = useState<MobileInquiryNature[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<MobileOffice | null>(null);
  const [selectedNatureId, setSelectedNatureId] = useState<number | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [otherConcern, setOtherConcern] = useState("");

  const [isLoadingOffices, setIsLoadingOffices] = useState(true);
  const [isLoadingNatures, setIsLoadingNatures] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenEntrance = useEntranceAnimation();
  const submitPress = usePressScale({ pressedScale: 0.975 });

  useEffect(() => {
    let cancelled = false;
    const fetchOffices = async () => {
      setIsLoadingOffices(true);
      setError(null);
      try {
        const data = await loadOffices();
        if (!cancelled) setOffices(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load offices.");
      } finally {
        if (!cancelled) setIsLoadingOffices(false);
      }
    };
    void fetchOffices();
    return () => { cancelled = true; };
  }, []);

  const handleSelectOffice = async (office: MobileOffice) => {
    setSelectedOffice(office);
    setStep("details");
    setIsLoadingNatures(true);
    setError(null);
    try {
      const data = await loadInquiryNatures(office.id);
      setNatures(data);
      setSelectedNatureId(data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load inquiry natures.");
    } finally {
      setIsLoadingNatures(false);
    }
  };

  const handleBackToOffices = () => {
    setStep("office");
    setSelectedOffice(null);
    setNatures([]);
    setSelectedNatureId(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedOffice) return;
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      setError("Please provide both a subject and a message.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const inquiryId = await submitNewInquiry({
        officeId: selectedOffice.id,
        subject: trimmedSubject,
        message: trimmedMessage,
        concernTypeId: selectedNatureId ?? undefined,
        otherConcern: otherConcern.trim() || undefined,
      });
      onCreated(inquiryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit inquiry.");
      setIsSubmitting(false);
    }
  };

  const selectedNature = natures.find((n) => n.id === selectedNatureId);
  const isSubmitDisabled = isSubmitting || !subject.trim() || !message.trim();

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
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.headerBackground, shadowColor: "#000" }]}>
            <Pressable
              onPress={step === "office" ? onBack : handleBackToOffices}
              style={({ pressed }) => [styles.headerBackBtn, pressed && { opacity: 0.5 }]}
              hitSlop={12}
            >
              <Text style={[styles.headerBackIcon, { color: colors.accent }]}>←</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {step === "office" ? "Select Office" : "New Inquiry"}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Error banner */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.errorText, { color: colors.accent }]}>{error}</Text>
            </View>
          )}

          {step === "office" ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {isLoadingOffices ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.accent} size="large" />
                </View>
              ) : offices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No offices available.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {offices.map((office, index) => (
                    <OfficeCard
                      key={office.id}
                      office={office}
                      index={index}
                      onPress={() => handleSelectOffice(office)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Step indicator */}
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: colors.accent }]}>
                  <Text style={styles.stepCheck}>✓</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: colors.accent }]} />
                <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.accent }]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Fill Details</Text>
              </View>

              {/* Selected office banner */}
              <View style={[styles.officeBanner, { backgroundColor: colors.accentLight, borderLeftColor: colors.accent }]}>
                <View style={styles.officeBannerRow}>
                  <View style={[styles.miniAvatar, { backgroundColor: getAvatarColor(selectedOffice?.name || "") }]}>
                    <Text style={styles.miniAvatarText}>{getInitials(selectedOffice?.name || "")}</Text>
                  </View>
                  <View style={styles.officeBannerInfo}>
                    <Text style={[styles.officeBannerLabel, { color: colors.textSecondary }]}>SENDING TO</Text>
                    <Text style={[styles.officeBannerName, { color: colors.textPrimary }]}>{selectedOffice?.name}</Text>
                  </View>
                </View>
              </View>

              {/* Concern type chips */}
              {isLoadingNatures ? (
                <ActivityIndicator color={colors.accent} style={styles.loader} />
              ) : natures.length > 0 ? (
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <View style={[styles.labelDash, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.label, { color: colors.textPrimary }]}>CONCERN TYPE</Text>
                  </View>
                  <View style={styles.chipsWrap}>
                    {natures.map((nature) => {
                      const isActive = selectedNatureId === nature.id;
                      return (
                        <Pressable
                          key={nature.id}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                            isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
                          ]}
                          onPress={() => setSelectedNatureId(nature.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: colors.textSecondary },
                              isActive && { color: colors.accentText, fontWeight: "700" },
                            ]}
                          >
                            {nature.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Other concern input */}
              {selectedNature?.allowsOther ? (
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <View style={[styles.labelDash, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.label, { color: colors.textPrimary }]}>PLEASE SPECIFY</Text>
                  </View>
                  <AnimatedInput
                    value={otherConcern}
                    onChangeText={setOtherConcern}
                    placeholder="Describe your concern type…"
                    placeholderTextColor={colors.textMuted}
                    accentColor={colors.accent}
                    bgColor={colors.surfaceElevated}
                    borderColor={colors.border}
                    textColor={colors.textPrimary}
                  />
                </View>
              ) : null}

              {/* Subject */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <View style={[styles.labelDash, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.label, { color: colors.textPrimary }]}>SUBJECT</Text>
                </View>
                <AnimatedInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Brief summary of your inquiry"
                  placeholderTextColor={colors.textMuted}
                  accentColor={colors.accent}
                  bgColor={colors.surfaceElevated}
                  borderColor={colors.border}
                  textColor={colors.textPrimary}
                  maxLength={100}
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {subject.length}/100
                </Text>
              </View>

              {/* Message */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <View style={[styles.labelDash, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.label, { color: colors.textPrimary }]}>MESSAGE</Text>
                </View>
                <AnimatedInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type your message here…"
                  placeholderTextColor={colors.textMuted}
                  accentColor={colors.accent}
                  bgColor={colors.surfaceElevated}
                  borderColor={colors.border}
                  textColor={colors.textPrimary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  style={{ minHeight: 140, paddingTop: 16 }}
                />
              </View>

              {/* Submit button */}
              <View style={styles.buttonContainer}>
                <Pressable
                  onPress={handleSubmit}
                  onPressIn={!isSubmitDisabled ? submitPress.handlePressIn : undefined}
                  onPressOut={!isSubmitDisabled ? submitPress.handlePressOut : undefined}
                  disabled={isSubmitDisabled}
                  style={styles.submitTouchable}
                >
                  <Animated.View
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: colors.accent,
                        transform: [{ scale: isSubmitDisabled ? 1 : submitPress.scale }],
                        shadowColor: colors.accent,
                      },
                      isSubmitDisabled && styles.submitButtonDisabled,
                    ]}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? "Sending…" : "Send Inquiry"}
                    </Text>
                    {!isSubmitting && <Text style={styles.submitIcon}>➤</Text>}
                  </Animated.View>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Input                                                    */
/* ------------------------------------------------------------------ */

function AnimatedInput({
  accentColor,
  bgColor,
  borderColor,
  textColor,
  style,
  ...rest
}: {
  accentColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  style?: any;
} & React.ComponentProps<typeof TextInput>) {
  const { focusAnim, onFocus, onBlur } = useFocusAnimation();

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [borderColor, accentColor],
  });

  const animatedShadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <Animated.View
      style={[
        styles.inputOuter,
        {
          backgroundColor: bgColor,
          borderColor: animatedBorderColor,
          shadowColor: accentColor,
          shadowOpacity: animatedShadowOpacity,
        },
      ]}
    >
      <TextInput
        style={[styles.input, { color: textColor }, style]}
        onFocus={onFocus}
        onBlur={onBlur}
        {...rest}
      />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Office card                                                       */
/* ------------------------------------------------------------------ */

function OfficeCard({ office, index, onPress }: { office: MobileOffice; index: number; onPress: () => void }) {
  const { colors } = useTheme();
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.975 });
  const stagger = useStaggeredEntrance(index);
  const initials = getInitials(office.name);
  const avatarColor = getAvatarColor(office.name);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.officeCard,
          {
            backgroundColor: colors.surfaceElevated,
            shadowColor: "#000",
            transform: [{ scale }, { translateY: stagger.translateY }],
            opacity: stagger.opacity,
          },
        ]}
      >
        {/* Avatar with ring */}
        <View style={[styles.avatarRing, { borderColor: avatarColor + "33" }]}>
          <View style={[styles.officeAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.officeAvatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.officeInfo}>
          <Text style={[styles.officeName, { color: colors.textPrimary }]}>{office.name}</Text>
          {office.description ? (
            <Text style={[styles.officeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {office.description}
            </Text>
          ) : null}
        </View>
        <View style={[styles.chevronCircle, { backgroundColor: colors.surfaceHover }]}>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
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

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  headerBackIcon: { fontSize: 26, fontWeight: "600" },
  headerTitle: { fontSize: 19, fontWeight: "700", letterSpacing: 0.3 },

  /* Error */
  errorContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  errorText: { fontSize: 14, textAlign: "center", fontWeight: "500" },

  /* Scroll */
  scrollContent: { flexGrow: 1, padding: 18 },
  loadingContainer: { padding: 32, alignItems: "center" },
  emptyContainer: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 16 },

  /* Step indicator */
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 0,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {},
  stepCheck: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  stepNum: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  stepLine: { width: 24, height: 2, borderRadius: 1 },
  stepLabel: { fontSize: 13, fontWeight: "600", marginLeft: 8 },

  /* Office banner */
  officeBanner: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 22,
    borderLeftWidth: 3,
  },
  officeBannerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  officeBannerInfo: { flex: 1 },
  officeBannerLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 2 },
  officeBannerName: { fontSize: 15, fontWeight: "700" },

  /* Form */
  formGroup: { marginBottom: 22 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8, marginLeft: 2 },
  labelDash: { width: 3, height: 14, borderRadius: 2 },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.8 },
  loader: { marginVertical: 16 },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4, marginRight: 4 },

  /* Chips */
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: "500" },

  /* Input */
  inputOuter: {
    borderWidth: 1.5,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 0,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
  },

  /* Submit */
  buttonContainer: { marginTop: 8, marginBottom: 32 },
  submitTouchable: {},
  submitButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  submitIcon: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  /* Office cards */
  list: { gap: 14 },
  officeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  officeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  officeAvatarText: { color: "#FFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  officeInfo: { flex: 1 },
  officeName: { fontSize: 16, fontWeight: "700", letterSpacing: 0.15, marginBottom: 3 },
  officeDescription: { fontSize: 13.5, lineHeight: 19 },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chevron: { fontSize: 20, fontWeight: "500" },
});
