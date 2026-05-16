import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { usePressScale } from "../../hooks/usePressScale";
import { colors } from "../../theme/colors";

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Optional trailing icon character (e.g. "→") */
  icon?: string;
};

export function AuthPrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  icon,
}: AuthPrimaryButtonProps) {
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.985 });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: "rgba(255,255,255,0.16)" }}
      style={({ pressed }) => [styles.touch, disabled && styles.touchDisabled, pressed && !disabled && styles.touchPressed]}
    >
      <Animated.View style={[styles.button, { transform: [{ scale }] }, disabled && styles.buttonDisabled]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    width: "100%",
  },
  touchDisabled: {
    opacity: 0.8,
  },
  touchPressed: {
    opacity: 0.98,
  },
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.navy,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  icon: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});