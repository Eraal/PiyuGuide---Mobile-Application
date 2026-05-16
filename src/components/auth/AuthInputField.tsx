import { forwardRef, useState, useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { colors } from "../../theme/colors";

type AuthInputFieldProps = Omit<TextInputProps, "value" | "onChangeText" | "style"> & {
  label: string;
  iconLabel?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  trailingActionLabel?: string;
  onTrailingActionPress?: () => void;
  trailingActionAccessibilityLabel?: string;
};

export const AuthInputField = forwardRef<TextInput, AuthInputFieldProps>(function AuthInputField(
  {
    label,
    iconLabel,
    value,
    onChangeText,
    error,
    helperText,
    trailingActionLabel,
    onTrailingActionPress,
    trailingActionAccessibilityLabel,
    onFocus,
    onBlur,
    secureTextEntry,
    placeholder,
    placeholderTextColor,
    ...textInputProps
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const hasError = Boolean(error);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Animating border/shadow
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [hasError ? "#dc2626" : "#d6e2ea", colors.navy],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
  });

  const iconBgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(2,60,105,0.06)", "rgba(2,60,105,0.12)"],
  });

  return (
    <View style={styles.block}>
      <Text style={[styles.label, hasError && styles.labelError, isFocused && !hasError && styles.labelFocused]}>
        {label}
      </Text>

      <Animated.View
        style={[
          styles.shell,
          {
            borderColor,
            shadowOpacity: hasError ? 0 : shadowOpacity,
            shadowColor: colors.navy,
            backgroundColor: isFocused && !hasError ? "#fcfdff" : colors.surface,
          },
        ]}
      >
        {iconLabel ? (
          <Animated.View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
            <Text style={[styles.iconLabel, isFocused && { color: colors.navy }]}>{iconLabel}</Text>
          </Animated.View>
        ) : (
          <View style={{ width: 4 }} />
        )}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? colors.textMuted}
          secureTextEntry={secureTextEntry}
          autoCorrect={false}
          selectionColor={colors.navy}
          style={styles.input}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...textInputProps}
        />

        {trailingActionLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={trailingActionAccessibilityLabel ?? trailingActionLabel}
            hitSlop={10}
            onPress={onTrailingActionPress}
            style={({ pressed }) => [styles.trailingAction, pressed && styles.trailingActionPressed]}
          >
            <Text style={styles.trailingActionText}>{trailingActionLabel}</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      {helperText && !error ? <Text style={styles.helperText}>{helperText}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  block: {
    width: "100%",
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  labelFocused: {
    color: colors.navy,
  },
  labelError: {
    color: "#b91c1c",
  },
  shell: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 0,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  trailingAction: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 4,
  },
  trailingActionPressed: {
    opacity: 0.6,
  },
  trailingActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 2,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#b91c1c",
    marginTop: 2,
    marginLeft: 4,
    fontWeight: "500",
  },
});