import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { colors } from "../../theme/colors";

type AuthSelectFieldProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  error?: string;
  placeholder?: string;
};

export function AuthSelectField({
  label,
  value,
  options,
  onSelect,
  error,
  placeholder = "Select...",
}: AuthSelectFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const hasError = Boolean(error);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.block}>
      <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>

      <Pressable
        onPress={() => setModalVisible(true)}
        style={[
          styles.shell,
          {
            borderColor: hasError ? "#dc2626" : "#d6e2ea",
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.valueText,
            !value && { color: colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
            </View>
            <ScrollView style={styles.optionsList} bounces={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionItem,
                    value === option.value && styles.optionItemActive,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

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
  labelError: {
    color: "#b91c1c",
  },
  shell: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  valueText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },
  arrow: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#b91c1c",
    marginTop: 2,
    marginLeft: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionItemActive: {
    backgroundColor: "rgba(2,60,105,0.04)",
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  optionTextActive: {
    color: colors.navy,
    fontWeight: "700",
  },
  checkIcon: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
