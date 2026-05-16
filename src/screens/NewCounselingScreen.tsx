import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import {
  loadCounselingOffices,
  loadOfficeAvailability,
  submitCounselingRequest,
} from "../services/backend";
import { format, addDays } from "date-fns";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const CONCERN_OPTIONS = [
  "Academic Stress",
  "Personal/Family Issues",
  "Career Guidance",
  "Mental Health Support",
  "Relationship Issues",
  "Financial Difficulties",
  "Career Counseling",
  "Others",
];

export const NewCounselingScreen: React.FC<Props> = ({ onBack, onSuccess }) => {
  const { colors } = useTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [natureOfConcern, setNatureOfConcern] = useState("");
  const [customConcern, setCustomConcern] = useState("");

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const data = await loadCounselingOffices();
        setOffices(data);
      } catch (error) {
        console.error("Failed to load offices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffices();
  }, []);

  useEffect(() => {
    if (selectedOfficeId && selectedDate) {
      const fetchAvailability = async () => {
        try {
          const slots = await loadOfficeAvailability(selectedOfficeId, selectedDate);
          setAvailability(slots);
        } catch (error) {
          console.error("Failed to load availability:", error);
        }
      };
      fetchAvailability();
    }
  }, [selectedOfficeId, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedOfficeId || !selectedDate || !selectedTime) return;
    
    const finalConcern = natureOfConcern === "Others" ? customConcern : natureOfConcern;
    if (!finalConcern) {
      Alert.alert("Required", "Please specify the nature of your concern.");
      return;
    }

    setSubmitting(true);
    try {
      await submitCounselingRequest({
        officeId: selectedOfficeId,
        date: selectedDate,
        time: selectedTime,
        notes: finalConcern + (notes ? "\n\nDetails: " + notes : ""),
        isVideo: true,
      });
      Alert.alert("Success", "Your counseling request has been submitted.", [
        { text: "OK", onPress: onSuccess },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "600" }}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Request Session</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressIndicator, { backgroundColor: colors.accent, width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose an Office</Text>
            {offices.map((office) => (
              <Pressable
                key={office.id}
                onPress={() => {
                  setSelectedOfficeId(office.id);
                  nextStep();
                }}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: selectedOfficeId === office.id ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.optionName, { color: colors.textPrimary }]}>{office.name}</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{office.description}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pick a Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const d = addDays(new Date(), offset);
                const dStr = format(d, "yyyy-MM-dd");
                const isSelected = selectedDate === dStr;

                return (
                  <Pressable
                    key={dStr}
                    onPress={() => setSelectedDate(dStr)}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.dateDay, { color: isSelected ? "white" : colors.textSecondary }]}>
                      {format(d, "EEE")}
                    </Text>
                    <Text style={[styles.dateNum, { color: isSelected ? "white" : colors.textPrimary }]}>
                      {format(d, "d")}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Available Slots</Text>
            <View style={styles.slotsGrid}>
              {availability.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isBooked = slot.status !== "available";

                return (
                  <Pressable
                    key={slot.time}
                    disabled={isBooked}
                    onPress={() => setSelectedTime(slot.time)}
                    style={[
                      styles.slotChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                        borderColor: colors.border,
                        opacity: isBooked ? 0.3 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.slotText, { color: isSelected ? "white" : colors.textPrimary }]}>
                      {slot.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <Pressable onPress={prevStep} style={styles.secondaryButton}>
                <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Back</Text>
              </Pressable>
              <Pressable
                disabled={!selectedTime}
                onPress={nextStep}
                style={[styles.primaryButton, { backgroundColor: colors.accent, opacity: selectedTime ? 1 : 0.5 }]}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nature of Concern</Text>
            <View style={styles.concernGrid}>
              {CONCERN_OPTIONS.map((option) => {
                const isSelected = natureOfConcern === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setNatureOfConcern(option)}
                    style={[
                      styles.concernChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.concernText, { color: isSelected ? "white" : colors.textPrimary }]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {natureOfConcern === "Others" && (
              <TextInput
                value={customConcern}
                onChangeText={setCustomConcern}
                placeholder="Please specify your concern..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border, marginTop: 12 }]}
              />
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Additional Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Tell us more about your situation..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }]}
            />

            <View style={styles.buttonRow}>
              <Pressable onPress={prevStep} style={styles.secondaryButton}>
                <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Back</Text>
              </Pressable>
              <Pressable
                disabled={!natureOfConcern || (natureOfConcern === "Others" && !customConcern) || submitting}
                onPress={handleSubmit}
                style={[styles.primaryButton, { backgroundColor: colors.accent, opacity: natureOfConcern ? 1 : 0.5 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Request</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  backButton: { width: 60 },
  progressBar: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressIndicator: { height: "100%" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  optionDesc: { fontSize: 14, lineHeight: 20 },
  dateScroll: { flexDirection: "row", marginBottom: 8 },
  dateChip: {
    width: 60,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateDay: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  dateNum: { fontSize: 18, fontWeight: "700" },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  slotChip: {
    width: "30%",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  slotText: { fontSize: 14, fontWeight: "600" },
  concernGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  concernChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  concernText: { fontSize: 13, fontWeight: "600" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
  textArea: { height: 120, textAlignVertical: "top" },
  buttonRow: { flexDirection: "row", marginTop: 32, gap: 12 },
  primaryButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: { fontSize: 16, fontWeight: "600" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
