import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInUp,
} from "react-native-reanimated";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = "info" | "success" | "warning" | "error";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

const ICON_MAP: Record<ToastType, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

const COLOR_MAP: Record<ToastType, string> = {
  info: "rgba(59,130,246,0.85)",
  success: "rgba(34,197,94,0.85)",
  warning: "rgba(245,158,11,0.85)",
  error: "rgba(239,68,68,0.85)",
};

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;

// ─── Component ───────────────────────────────────────────────────────────────

export function useVideoToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast_${++counterRef.current}`;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, type }]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return { toasts, showToast };
}

// ─── Render Component ────────────────────────────────────────────────────────

interface VideoToastZoneProps {
  toasts: Toast[];
}

export const VideoToastZone: React.FC<VideoToastZoneProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.zone} pointerEvents="none">
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={SlideInUp.duration(250)}
          exiting={FadeOut.duration(250)}
          style={[
            styles.toast,
            { backgroundColor: COLOR_MAP[toast.type] },
          ]}
        >
          <Text style={styles.icon}>{ICON_MAP[toast.type]}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  message: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
