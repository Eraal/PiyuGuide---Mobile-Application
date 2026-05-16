import { Text, View, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

export function LogoMark({
  size = 56,
  variant = "glass",
}: {
  size?: number;
  variant?: "glass" | "light";
}) {
  const isLight = variant === "light";
  const badgeSize = size;
  const coreSize = Math.max(34, Math.round(size * 0.62));
  const fontSize = Math.max(14, Math.round(size * 0.28));

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: isLight ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.1)",
        },
      ]}
    >
      <View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: Math.round(coreSize * 0.34),
            backgroundColor: isLight ? colors.navy : "rgba(16,185,129,0.16)",
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          {
            fontSize,
            color: isLight ? colors.navy : "#ffffff",
          },
        ]}
      >
        PG
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  core: {
    position: "absolute",
  },
  text: {
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
