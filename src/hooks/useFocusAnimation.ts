import { useCallback, useRef } from "react";
import { Animated } from "react-native";

/**
 * Returns an animated `focusAnim` value (0 → 1) that transitions
 * smoothly on focus/blur, along with `onFocus` / `onBlur` handlers
 * to attach to a TextInput.
 *
 * Use `focusAnim.interpolate(…)` for border color, shadow opacity, etc.
 */
export function useFocusAnimation(duration = 220) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const onFocus = useCallback(() => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false, // border/shadow colours can't use native driver
    }).start();
  }, [duration, focusAnim]);

  const onBlur = useCallback(() => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, [duration, focusAnim]);

  return { focusAnim, onFocus, onBlur };
}
