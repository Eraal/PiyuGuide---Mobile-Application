import { useRef } from "react";
import { Animated } from "react-native";

export function usePressScale({
  pressedScale = 0.97,
  normalScale = 1,
}: {
  pressedScale?: number;
  normalScale?: number;
} = {}) {
  const scale = useRef(new Animated.Value(normalScale)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: pressedScale,
      friction: 5,
      tension: 130,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: normalScale,
      friction: 5,
      tension: 130,
      useNativeDriver: true,
    }).start();
  };

  return {
    scale,
    handlePressIn,
    handlePressOut,
  };
}
