import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { colors } from "../theme/colors";
import { usePressScale } from "../hooks/usePressScale";
import { 
  getCurrentUser, 
  loadCampusDepartments, 
  registerStudent, 
  type MobileCampus, 
  type MobileDepartment 
} from "../services/backend";
import { AuthScreenFrame } from "../components/auth/AuthScreenFrame";
import { AuthInputField } from "../components/auth/AuthInputField";
import { AuthSelectField } from "../components/auth/AuthSelectField";
import { AuthPrimaryButton } from "../components/auth/AuthPrimaryButton";
import { brand } from "../constants/brand"; // Refreshed import

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const YEAR_LEVEL_OPTIONS = [
  { label: "1st Year", value: "1st Year" },
  { label: "2nd Year", value: "2nd Year" },
  { label: "3rd Year", value: "3rd Year" },
  { label: "4th Year", value: "4th Year" },
];

const SECTION_OPTIONS = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "C", value: "C" },
  { label: "D", value: "D" },
  { label: "E", value: "E" },
];

interface Props {
  initialEmail?: string;
  campus: MobileCampus | null;
  onRegisterComplete: (data: { 
    fullName: string; 
    email: string; 
    message: string; 
    needsVerification?: boolean 
  }) => void;
  onBackToLogin: () => void;
  onBackToCampus?: () => void;
}

export default function RegisterScreen({ 
  initialEmail = "", 
  campus, 
  onRegisterComplete, 
  onBackToLogin,
  onBackToCampus 
}: Props) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 Fields
  const [studentNumber, setStudentNumber] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<MobileDepartment[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  // Refs for navigation
  const firstNameInput = useRef<any>(null);
  const lastNameInput = useRef<any>(null);
  const emailInput = useRef<any>(null);
  const passwordInput = useRef<any>(null);
  const confirmPasswordInput = useRef<any>(null);
  const studentNumberInput = useRef<any>(null);

  useEffect(() => {
    if (campus) {
      fetchDepartments();
    }
  }, [campus]);

  const fetchDepartments = async () => {
    if (!campus) return;
    setIsLoadingDepartments(true);
    setDepartmentsError(null);
    try {
      const data = await loadCampusDepartments(campus.id);
      setDepartments(data);
    } catch (err) {
      setDepartmentsError("Failed to load departments.");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const formatStudentNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
    }
    return cleaned;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!email.includes("@lspu.edu.ph")) newErrors.email = "Use your @lspu.edu.ph email";
    
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Min. 8 characters";
    
    if (confirmPassword !== password) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!studentNumber.trim()) newErrors.studentNumber = "Student number is required";
    else if (studentNumber.length < 9) newErrors.studentNumber = "Format: 0000-0000";
    
    if (!yearLevel) newErrors.yearLevel = "Select year level";
    if (!section) newErrors.section = "Select section";
    if (!selectedDepartmentId) newErrors.departmentId = "Select your department";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  const formatLoadError = (error: any) => {
    if (error.response?.data?.message) return error.response.data.message;
    return "An unexpected error occurred. Please try again.";
  };

  const handleRegister = async () => {
    if (!validateStep2() || !campus) return;

    setIsSubmitting(true);
    try {
      const resp = await registerStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        studentNumber: studentNumber.trim(),
        yearLevel,
        section,
        departmentId: selectedDepartmentId,
        campusId: campus.id
      });

      onRegisterComplete({ 
        fullName: `${firstName.trim()} ${lastName.trim()}`, 
        email: email.trim().toLowerCase(), 
        message: resp.message, 
        needsVerification: resp.needsVerification 
      });
    } catch (error) {
      Alert.alert("Registration failed", formatLoadError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      eyebrow={brand.authRegisterEyebrow}
      title={step === 1 ? "Personal Details" : "Academic Info"}
      subtitle={step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
      contextLabel={campus?.shortName}
      notice={!campus ? "Select a campus to start." : departmentsError || undefined}
      backLabel={step === 2 ? "Previous Step" : (onBackToCampus ? "Change Campus" : undefined)}
      onBack={step === 2 ? handleBack : onBackToCampus}
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={onBackToLogin} hitSlop={8}>
            <Text style={styles.footerLink}>Log In</Text>
          </Pressable>
        </View>
      }
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
          <Text style={[styles.progressText, step >= 1 && styles.progressTextActive]}>1</Text>
        </View>
        <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
          <Text style={[styles.progressText, step >= 2 && styles.progressTextActive]}>2</Text>
        </View>
      </View>

      {step === 1 ? (
        <View>
          <View style={styles.formSection}>
            <View style={styles.splitRow}>
              <View style={{ flex: 1 }}>
                <AuthInputField
                  ref={firstNameInput} label="First name" value={firstName}
                  onChangeText={(t) => { setFirstName(t); clearError("firstName"); }}
                  placeholder="Juan" autoCapitalize="words" returnKeyType="next"
                  onSubmitEditing={() => lastNameInput.current?.focus()} error={errors.firstName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AuthInputField
                  ref={lastNameInput} label="Last name" value={lastName}
                  onChangeText={(t) => { setLastName(t); clearError("lastName"); }}
                  placeholder="Dela Cruz" autoCapitalize="words" returnKeyType="next"
                  onSubmitEditing={() => emailInput.current?.focus()} error={errors.lastName}
                />
              </View>
            </View>
            
            <AuthInputField
              ref={emailInput} label="Email address" value={email}
              onChangeText={(t) => { setEmail(t); clearError("email"); }}
              placeholder="name@lspu.edu.ph" keyboardType="email-address" autoCapitalize="none"
              returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} error={errors.email}
            />
          </View>

          <View style={styles.formSection}>
            <AuthInputField
              ref={passwordInput} label="Password" value={password}
              onChangeText={(t) => { setPassword(t); clearError("password"); }}
              placeholder="Create password" secureTextEntry={!showPassword}
              trailingActionLabel={showPassword ? "Hide" : "Show"}
              onTrailingActionPress={() => setShowPassword(!showPassword)}
              returnKeyType="next" onSubmitEditing={() => confirmPasswordInput.current?.focus()} error={errors.password}
            />
            <AuthInputField
              ref={confirmPasswordInput} label="Confirm password" value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); clearError("confirmPassword"); }}
              placeholder="Re-enter password" secureTextEntry={!showConfirmPassword}
              trailingActionLabel={showConfirmPassword ? "Hide" : "Show"}
              onTrailingActionPress={() => setShowConfirmPassword(!showConfirmPassword)}
              returnKeyType="done" onSubmitEditing={handleNext} error={errors.confirmPassword}
            />
          </View>

          <View style={{ marginTop: 20 }}>
            <AuthPrimaryButton
              label="Continue to Step 2"
              icon="→" onPress={handleNext}
            />
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.formSection}>
            <AuthInputField
              ref={studentNumberInput} label="Student number" value={studentNumber}
              onChangeText={(t) => { 
                const formatted = formatStudentNumber(t);
                setStudentNumber(formatted); 
                clearError("studentNumber"); 
              }}
              placeholder="0000-0000" keyboardType="numeric" returnKeyType="next"
              error={errors.studentNumber} maxLength={9}
            />
            <View style={styles.splitRow}>
              <View style={{ flex: 1.2 }}>
                <AuthSelectField
                  label="Year level"
                  value={yearLevel}
                  options={YEAR_LEVEL_OPTIONS}
                  onSelect={(v) => {
                    setYearLevel(v);
                    clearError("yearLevel");
                  }}
                  placeholder="Select Year"
                  error={errors.yearLevel}
                />
              </View>
              <View style={{ flex: 0.8 }}>
                <AuthSelectField
                  label="Section"
                  value={section}
                  options={SECTION_OPTIONS}
                  onSelect={(v) => {
                    setSection(v);
                    clearError("section");
                  }}
                  placeholder="Select"
                  error={errors.section}
                />
              </View>
            </View>
          </View>

          <View style={styles.departmentBlock}>
            <View style={styles.labelRow}>
              <View style={[styles.labelDash, { backgroundColor: colors.navy }]} />
              <Text style={styles.label}>DEPARTMENT</Text>
            </View>

            {isLoadingDepartments ? (
              <ActivityIndicator color={colors.navy} style={{ marginVertical: 12 }} />
            ) : departments.length > 0 ? (
              <View style={styles.deptList}>
                {departments.map((dept) => (
                  <DeptChip
                    key={dept.id}
                    label={dept.name}
                    isSelected={dept.id === selectedDepartmentId}
                    onPress={() => { setSelectedDepartmentId(dept.id); clearError("departmentId"); }}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.deptEmpty}>No departments available.</Text>
            )}
            {errors.departmentId ? <Text style={styles.deptError}>{errors.departmentId}</Text> : null}
          </View>

          <View style={{ marginTop: 20 }}>
            <AuthPrimaryButton
              label={isSubmitting ? "Creating Account…" : "Create Account"}
              icon="✓" onPress={handleRegister} disabled={isSubmitting}
            />
          </View>
        </View>
      )}
    </AuthScreenFrame>
  );
}

function DeptChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.96 });
  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ flexBasis: "48%" }}>
      <Animated.View style={[styles.deptChip, isSelected && styles.deptChipActive, { transform: [{ scale }] }]}>
        <Text style={[styles.deptChipText, isSelected && styles.deptChipTextActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: "800", color: colors.navy },
  formSection: { gap: 10, marginBottom: 12 },
  splitRow: { flexDirection: "row", gap: 12 },
  departmentBlock: { marginVertical: 12 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8, marginLeft: 2 },
  labelDash: { width: 3, height: 14, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: "800", color: colors.navy, letterSpacing: 1 },
  deptList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  deptChip: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  deptChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  deptChipTextActive: {
    color: "white",
  },
  deptEmpty: { fontSize: 14, color: colors.textSecondary, textAlign: "center", fontStyle: "italic", marginVertical: 10 },
  deptError: { color: colors.error, fontSize: 12, marginTop: 4, fontWeight: "600" },
  progressContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 30, gap: 8 },
  progressStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  progressStepActive: { backgroundColor: colors.navy },
  progressText: { fontSize: 12, fontWeight: "800", color: colors.textSecondary },
  progressTextActive: { color: "white" },
  progressLine: { width: 40, height: 2, backgroundColor: colors.border },
  progressLineActive: { backgroundColor: colors.navy },
});