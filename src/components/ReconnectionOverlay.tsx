import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface Props {
  visible: boolean;
  attempt?: number;
  maxAttempts?: number;
}

export const ReconnectionOverlay: React.FC<Props> = ({
  visible,
  attempt = 0,
  maxAttempts = 8,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        <Text style={styles.title}>Reconnecting…</Text>
        <Text style={styles.subtitle}>
          Please wait while we restore your connection
        </Text>
        {attempt > 0 && (
          <Text style={styles.attempt}>
            Attempt {attempt}/{maxAttempts}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  spinner: {
    marginBottom: 24,
    transform: [{ scale: 1.3 }],
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  attempt: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
  },
});
