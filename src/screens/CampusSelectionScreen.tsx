import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";

import { AuthPrimaryButton } from "../components/auth/AuthPrimaryButton";
import { loadCampuses, selectCampusOnBackend, type MobileCampus } from "../services/backend";
import { colors } from "../theme/colors";
import { usePressScale } from "../hooks/usePressScale";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";
import { useStaggeredEntrance } from "../hooks/useStaggeredEntrance";

type CampusSelectionScreenProps = {
  exiting: boolean;
  onExitComplete: () => void;
  onContinue: (campus: MobileCampus) => void;
  onBack?: () => void;
};

function formatLoadError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to load campuses right now.";
}

export default function CampusSelectionScreen({
  exiting,
  onExitComplete,
  onContinue,
  onBack,
}: CampusSelectionScreenProps) {
  const [campuses, setCampuses] = useState<MobileCampus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const exitHandled = useRef(false);
  const entrance = useEntranceAnimation({ startTranslateY: 14, opacityDuration: 400, translateDuration: 450 });

  useEffect(() => {
    let cancelled = false;
    const loadCampusData = async () => {
      setIsLoadingCampuses(true);
      setLoadError(null);
      try {
        const nextCampuses = await loadCampuses();
        if (cancelled) return;
        setCampuses(nextCampuses);
        setSelectedCampusId((current) => {
          if (current && nextCampuses.some((c) => c.id === current)) return current;
          return nextCampuses[0]?.id ?? null;
        });
      } catch (error) {
        if (!cancelled) {
          setCampuses([]);
          setSelectedCampusId(null);
          setLoadError(formatLoadError(error));
        }
      } finally {
        if (!cancelled) setIsLoadingCampuses(false);
      }
    };
    void loadCampusData();
    return () => { cancelled = true; };
  }, [reloadToken]);

  useEffect(() => {
    if (!exiting || exitHandled.current) return;
    exitHandled.current = true;
    Animated.parallel([
      Animated.timing(screenOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(screenTranslateY, { toValue: -10, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onExitComplete();
    });
  }, [exiting, onExitComplete, screenOpacity, screenTranslateY]);

  const selectedCampus = campuses.find((c) => c.id === selectedCampusId) ?? null;

  const handleRetry = () => setReloadToken((c) => c + 1);

  const handleContinue = async () => {
    if (!selectedCampus || exiting || isContinuing) return;
    setIsContinuing(true);
    try {
      await selectCampusOnBackend(selectedCampus.id);
      onContinue(selectedCampus);
    } catch (error) {
      Alert.alert("Campus selection failed", formatLoadError(error));
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <Animated.View
      pointerEvents={exiting ? "none" : "auto"}
      style={[
        StyleSheet.absoluteFillObject,
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslateY }],
        },
      ]}
    >
      {/* Decorative background */}
      <View pointerEvents="none" style={styles.bgOrbs}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View
          style={[
            styles.content,
            { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                hitSlop={12}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
              >
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            ) : <View />}
            <Text style={styles.stepLabel}>Step 2 of 3</Text>
          </View>

          {/* Title section */}
          <View style={styles.titleSection}>
            <Text style={styles.eyebrow}>CHOOSE CAMPUS</Text>
            <Text style={styles.title}>Select your campus</Text>
            <Text style={styles.subtitle}>
              Choose the campus that matches your enrollment to continue.
            </Text>
          </View>

          {/* Card list */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {isLoadingCampuses ? (
              <View style={styles.statusPanel}>
                <ActivityIndicator color={colors.navy} />
                <Text style={styles.statusText}>Loading campuses…</Text>
              </View>
            ) : loadError ? (
              <View style={styles.statusPanel}>
                <Text style={styles.statusText}>{loadError}</Text>
                <Pressable accessibilityRole="button" onPress={handleRetry} hitSlop={8}>
                  <Text style={styles.statusAction}>Retry</Text>
                </Pressable>
              </View>
            ) : campuses.length === 0 ? (
              <View style={styles.statusPanel}>
                <Text style={styles.statusText}>No active campuses available.</Text>
                <Pressable accessibilityRole="button" onPress={handleRetry} hitSlop={8}>
                  <Text style={styles.statusAction}>Reload</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cardList}>
                {campuses.map((campus, index) => (
                  <CampusCard
                    key={campus.id}
                    campus={campus}
                    index={index}
                    isSelected={campus.id === selectedCampusId}
                    onPress={() => {
                      if (!exiting) setSelectedCampusId(campus.id);
                    }}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bottom */}
          <View style={styles.bottomSection}>
            <Text style={styles.helperText}>Your campus carries into the sign-in step.</Text>
            <AuthPrimaryButton
              label={isContinuing ? "Saving…" : "Continue to Sign In"}
              icon="→"
              onPress={handleContinue}
              disabled={!selectedCampus || exiting || isLoadingCampuses || isContinuing}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Campus Card                                                       */
/* ------------------------------------------------------------------ */

function CampusCard({
  campus,
  index,
  isSelected,
  onPress,
}: {
  campus: MobileCampus;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.985 });
  const stagger = useStaggeredEntrance(index, { delayPerItem: 70, baseDelay: 100 });
  const monogram = campus.code.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${campus.shortName}, ${campus.address}`}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          isSelected ? styles.cardSelected : styles.cardIdle,
          {
            transform: [{ scale }, { translateY: stagger.translateY }],
            opacity: stagger.opacity,
          },
        ]}
      >
        <View style={styles.cardRow}>
          {/* Radio indicator */}
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && <View style={styles.radioFill} />}
          </View>

          {/* Monogram */}
          <View style={[styles.monogram, isSelected && styles.monogramSelected]}>
            <Text style={styles.monogramText}>{monogram}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.campusName, isSelected && styles.campusNameSelected]} numberOfLines={1}>
              {campus.shortName}
            </Text>
            <Text style={styles.campusFullName} numberOfLines={1}>
              {campus.name}
            </Text>
            {campus.address ? (
              <Text style={styles.campusAddress} numberOfLines={1}>
                {campus.address}
              </Text>
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
  container: {
    backgroundColor: colors.panelBackground,
  },
  bgOrbs: {
    ...StyleSheet.absoluteFillObject,
  },
  orbTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(29,78,216,0.07)",
  },
  orbBottom: {
    position: "absolute",
    left: -90,
    bottom: 60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(16,185,129,0.05)",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  titleSection: {
    gap: 8,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.navy,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.navy,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  statusPanel: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(2,60,105,0.10)",
    backgroundColor: "rgba(2,60,105,0.03)",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statusAction: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.navy,
  },
  cardList: {
    gap: 12,
  },

  /* Card */
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  cardIdle: {
    borderColor: "#d9e5ee",
  },
  cardSelected: {
    borderColor: colors.navy,
    backgroundColor: "rgba(2,60,105,0.04)",
    borderLeftWidth: 4,
    borderLeftColor: colors.navy,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  /* Radio */
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#bcc8d3",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: colors.navy,
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.navy,
  },

  /* Monogram */
  monogram: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,60,105,0.08)",
    flexShrink: 0,
  },
  monogramSelected: {
    backgroundColor: "rgba(2,60,105,0.14)",
  },
  monogramText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.navy,
  },

  /* Card info */
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  campusName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  campusNameSelected: {
    color: colors.navy,
  },
  campusFullName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  campusAddress: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },

  /* Bottom */
  bottomSection: {
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: "center",
  },
});