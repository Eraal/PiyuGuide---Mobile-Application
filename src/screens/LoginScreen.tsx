import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthInputField } from "../components/auth/AuthInputField";
import { AuthPrimaryButton } from "../components/auth/AuthPrimaryButton";
import { AuthScreenFrame } from "../components/auth/AuthScreenFrame";
import { brand } from "../constants/brand"; // Refreshed import
import { loginToBackend } from "../services/backend";
import { colors } from "../theme/colors";

type LoginScreenProps = {
  initialEmail?: string;
  campusLabel?: string;
  notice?: string | null;
  onLogin: (credentials: { email: string; password: string }) => void;
  onCreateAccount: () => void;
  /** Called when user wants to go back and change their campus selection */
  onBackToCampus?: () => void;
};

type LoginErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({
  initialEmail = "",
  campusLabel,
  notice = null,
  onLogin,
  onCreateAccount,
  onBackToCampus,
}: LoginScreenProps) {
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const clearEmailError = () => {
    if (errors.email) {
      setErrors((current) => ({ ...current, email: undefined }));
    }
  };

  const clearPasswordError = () => {
    if (errors.password) {
      setErrors((current) => ({ ...current, password: undefined }));
    }
  };

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const nextErrors: LoginErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!trimmedPassword) {
      nextErrors.password = "Password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await loginToBackend({ email: trimmedEmail, password: trimmedPassword });
      setPassword("");
      setIsSubmitting(false);
      onLogin({ email: trimmedEmail, password: trimmedPassword });
    } catch (error) {
      setIsSubmitting(false);
      const message = error instanceof Error ? error.message : "Unable to log in right now.";
      Alert.alert("Login failed", message);
    }
  };

  const handleForgotPassword = async () => {
    const subject = encodeURIComponent("PiyuGuide Password Reset");
    const body = encodeURIComponent("Hello, I need help resetting my PiyuGuide password.");
    const mailto = `mailto:${brand.authSupportEmail}?subject=${subject}&body=${body}`;

    try {
      await Linking.openURL(mailto);
    } catch {
      Alert.alert(
        "Forgot password",
        `Please contact ${brand.authSupportEmail} for password help.`,
      );
    }
  };

  return (
    <AuthScreenFrame
      eyebrow={brand.authLoginEyebrow}
      title={brand.authLoginTitle}
      subtitle={brand.authLoginSubtitle}
      contextLabel={campusLabel}
      notice={notice ?? undefined}
      noticeTone={notice ? "success" : "info"}
      backLabel={onBackToCampus ? "Change Campus" : undefined}
      onBack={onBackToCampus}
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Pressable accessibilityRole="button" onPress={onCreateAccount} hitSlop={8}>
            <Text style={styles.footerLink}>Register</Text>
          </Pressable>
        </View>
      }
    >
      <AuthInputField
        ref={emailInput}
        label="Email address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearEmailError();
        }}
        placeholder="name@lspu.edu.ph"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
        error={errors.email}
      />

      <AuthInputField
        ref={passwordInput}
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearPasswordError();
        }}
        placeholder="Enter your password"
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        secureTextEntry={!showPassword}
        trailingActionLabel={showPassword ? "Hide" : "Show"}
        trailingActionAccessibilityLabel={showPassword ? "Hide password" : "Show password"}
        onTrailingActionPress={() => setShowPassword((current) => !current)}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        error={errors.password}
      />

      <Pressable accessibilityRole="button" onPress={handleForgotPassword} hitSlop={8} style={styles.forgotButton}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </Pressable>

      <AuthPrimaryButton label={isSubmitting ? "Signing In…" : "Log In"} onPress={handleLogin} disabled={isSubmitting} />
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.navy,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -2,
    marginBottom: 2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
    textAlign: "right",
  },
});