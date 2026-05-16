import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import type { ConnectionQuality } from "../hooks/useWebRTC";

const QUALITY_CONFIG = {
  excellent: { color: "#22c55e", label: "Excellent" },
  good: { color: "#22c55e", label: "Connected" },
  poor: { color: "#ef4444", label: "Poor" },
  unknown: { color: "#94a3b8", label: "Connecting" },
} as const;

interface Props {
  quality: ConnectionQuality;
}

export const ConnectionQualityBadge: React.FC<Props> = ({ quality }) => {
  const config = QUALITY_CONFIG[quality];

  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.dotContainer}>
        <Animated.View
          style={[
            styles.dotPulse,
            { backgroundColor: config.color },
            pulseStyle,
          ]}
        />
        <View style={[styles.dot, { backgroundColor: config.color }]} />
      </View>
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  dotContainer: {
    width: 10,
    height: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
  },
  label: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});
