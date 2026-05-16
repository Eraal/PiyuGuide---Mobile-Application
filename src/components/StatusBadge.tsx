import { Text, View, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning";
}) {
  const isSuccess = tone === "success";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isSuccess ? colors.successSurface : colors.warningSurface,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: isSuccess ? colors.successText : colors.warningText,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
