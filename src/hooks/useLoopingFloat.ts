import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export function useLoopingFloat(duration: number, offset = 0) {
  const value = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, value]);

  return value;
}
