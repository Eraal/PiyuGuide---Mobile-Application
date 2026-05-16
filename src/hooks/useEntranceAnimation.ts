import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export function useEntranceAnimation({
  startOpacity = 0,
  startTranslateY = 16,
  translateDuration = 520,
  opacityDuration = 420,
  delay = 0,
}: {
  startOpacity?: number;
  startTranslateY?: number;
  translateDuration?: number;
  opacityDuration?: number;
  delay?: number;
} = {}) {
  const opacity = useRef(new Animated.Value(startOpacity)).current;
  const translateY = useRef(new Animated.Value(startTranslateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: opacityDuration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: translateDuration,
        easing: Easing.out(Easing.cubic),
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, opacityDuration, translateDuration, translateY]);

  return {
    opacity,
    translateY,
  };
}
