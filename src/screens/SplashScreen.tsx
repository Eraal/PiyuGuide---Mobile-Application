import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { brand } from "../constants/brand";
import { colors } from "../theme/colors";

type SplashScreenProps = {
  onComplete: () => void;
};

const SPLASH_DURATION_MS = 2000;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  /* ---- Animated values ---- */
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.95)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Title fades in and scales slightly
    const titleAnim = Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]);

    // Start animation
    titleAnim.start();

    // Schedule exit
    const exitTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onComplete();
      });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(exitTimer);
  }, [titleOpacity, titleScale, screenOpacity, onComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background */}
      <View style={styles.bg} />

      {/* Content */}
      <View style={styles.center}>
        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          {brand.name.toUpperCase()}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navy,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#FFFFFF",
  },
});
