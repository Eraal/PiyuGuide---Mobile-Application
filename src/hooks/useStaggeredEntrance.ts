import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Returns animated `opacity` and `translateY` values for a staggered
 * list-item entrance. Each item fades in and slides upward with a
 * per-index delay so the list reveals in a cascading fashion.
 */
export function useStaggeredEntrance(
  index: number,
  {
    delayPerItem = 50,
    baseDelay = 80,
    translateFrom = 18,
    duration = 420,
  }: {
    /** Milliseconds between each item's start (default 50). */
    delayPerItem?: number;
    /** Base delay before the first item begins (default 80). */
    baseDelay?: number;
    /** Starting translateY in px (default 18). */
    translateFrom?: number;
    /** Animation duration per item (default 420). */
    duration?: number;
  } = {},
) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateFrom)).current;

  useEffect(() => {
    const delay = baseDelay + index * delayPerItem;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [baseDelay, delayPerItem, duration, index, opacity, translateY]);

  return { opacity, translateY };
}
