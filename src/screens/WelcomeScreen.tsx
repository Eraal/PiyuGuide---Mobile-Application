import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brand } from "../constants/brand";
import { colors } from "../theme/colors";
import { usePressScale } from "../hooks/usePressScale";

export default function WelcomeScreen({
  exiting,
  onExitComplete,
  onGetStarted,
}: {
  exiting: boolean;
  onExitComplete: () => void;
  onGetStarted: () => void;
}) {
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const exitHandled = useRef(false);

  // Staggered entrance values
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslateY = useRef(new Animated.Value(16)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(14)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(12)).current;

  const { scale: btnScale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.98 });

  // Entrance animation sequence
  useEffect(() => {
    // Fade in screen first
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const stagger = Animated.stagger(120, [
      // Headline
      Animated.parallel([
        Animated.timing(headlineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headlineTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Features
      Animated.parallel([
        Animated.timing(featuresOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(featuresTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // Body
      Animated.timing(bodyOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Button
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]);

    const delay = setTimeout(() => stagger.start(), 100);
    return () => clearTimeout(delay);
  }, [
    buttonOpacity, buttonTranslateY,
    headlineOpacity, headlineTranslateY, subtitleOpacity,
    featuresOpacity, featuresTranslateY, bodyOpacity, screenOpacity
  ]);

  // Exit animation
  useEffect(() => {
    if (!exiting || exitHandled.current) return;
    exitHandled.current = true;
    Animated.parallel([
      Animated.timing(screenOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(screenTranslateY, { toValue: -14, duration: 250, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onExitComplete();
    });
  }, [exiting, onExitComplete, screenOpacity, screenTranslateY]);

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
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomLeft} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* Top — step label */}
          <Text style={styles.stepLabel}>Step 1 of 3</Text>

          {/* Center section */}
          <View style={styles.centerBlock}>
            {/* Headline */}
            <Animated.Text
              style={[
                styles.headline,
                {
                  opacity: headlineOpacity,
                  transform: [{ translateY: headlineTranslateY }],
                },
              ]}
            >
              {brand.welcomeTitle}
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
              {brand.welcomeSubtitle}
            </Animated.Text>

            {/* Feature highlights */}
            <Animated.View
              style={[
                styles.featuresRow,
                {
                  opacity: featuresOpacity,
                  transform: [{ translateY: featuresTranslateY }],
                },
              ]}
            >
              <FeatureChip emoji="📩" label="Inquiries" />
              <FeatureChip emoji="🧠" label="Counseling" />
              <FeatureChip emoji="📢" label="Updates" />
            </Animated.View>

            {/* Body copy */}
            <Animated.Text style={[styles.bodyCopy, { opacity: bodyOpacity }]}>
              {brand.welcomeCopy}
            </Animated.Text>
          </View>

          {/* Bottom — CTA button */}
          <Animated.View
            style={[
              styles.buttonWrap,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              },
            ]}
          >
            <Text style={styles.helperText}>Next, choose your campus before signing in.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onGetStarted}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              android_ripple={{ color: "rgba(255,255,255,0.16)" }}
            >
              <Animated.View style={[styles.ctaButton, { transform: [{ scale: btnScale }] }]}>
                <Text style={styles.ctaText}>Get Started</Text>
                <Text style={styles.ctaIcon}>→</Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature chip                                                      */
/* ------------------------------------------------------------------ */

function FeatureChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.featureChip}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
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
  orbTopRight: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(29,78,216,0.07)",
  },
  orbBottomLeft: {
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
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  stepLabel: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  centerBlock: {
    alignItems: "center",
    gap: 16,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.navy,
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(2,60,105,0.05)",
    borderWidth: 1,
    borderColor: "rgba(2,60,105,0.08)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  featureEmoji: {
    fontSize: 15,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
  },
  bodyCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  buttonWrap: {
    gap: 14,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: "center",
  },
  ctaButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.navy,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  ctaIcon: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});