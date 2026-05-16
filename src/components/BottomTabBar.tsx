import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconCounseling } from "./Icons";

import { useTheme } from "../theme/ThemeContext";
import { usePressScale } from "../hooks/usePressScale";

type BottomTabBarProps = {
  activeTab?: "inquiries" | "counseling" | "notifications" | "settings";
  notificationCount?: number;
  onInquiriesPress?: () => void;
  onCounselingPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress: () => void;
  onLogout: () => void;
};

export function BottomTabBar({ 
  activeTab = "inquiries", 
  notificationCount = 0,
  onInquiriesPress,
  onCounselingPress,
  onNotificationsPress, 
  onProfilePress, 
  onLogout 
}: BottomTabBarProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Animated values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  const showSettings = () => {
    setIsRendered(true);
    setSettingsVisible(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSettings = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 450,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setSettingsVisible(false);
        setIsRendered(false);
      }
    });
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.tabBarBorder,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TabIcon
          icon={<IconChat color={activeTab === "inquiries" ? colors.tabActive : colors.tabInactive} />}
          label="Inquiries"
          active={activeTab === "inquiries"}
          color={colors.tabActive}
          inactiveColor={colors.tabInactive}
          onPress={onInquiriesPress}
        />
        <TabIcon
          icon={<IconCounseling color={activeTab === "counseling" ? colors.tabActive : colors.tabInactive} />}
          label="Counseling"
          active={activeTab === "counseling"}
          color={colors.tabActive}
          inactiveColor={colors.tabInactive}
          onPress={onCounselingPress}
        />
        <TabIcon
          icon={<IconBell color={activeTab === "notifications" ? colors.tabActive : colors.tabInactive} />}
          label="Notifications"
          active={activeTab === "notifications"}
          color={colors.tabActive}
          inactiveColor={colors.tabInactive}
          onPress={onNotificationsPress}
          badgeCount={notificationCount}
        />
        <TabIcon
          icon={<IconGear color={activeTab === "settings" ? colors.tabActive : colors.tabInactive} />}
          label="Settings"
          active={activeTab === "settings"}
          color={colors.tabActive}
          inactiveColor={colors.tabInactive}
          onPress={showSettings}
        />
      </View>

      {/* Settings custom overlay (Replaces Modal) */}
      {isRendered && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop fade */}
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: overlayOpacity },
            ]}
          >
            <Pressable style={styles.flex} onPress={hideSettings} />
          </Animated.View>

          {/* Settings Sheet slide */}
          <Animated.View
            style={[
              styles.settingsSheet,
              {
                backgroundColor: colors.surfaceElevated,
                transform: [{ translateY: sheetTranslateY }],
                paddingBottom: Math.max(insets.bottom, 24) + 12,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.borderStrong }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Settings</Text>
            </View>

            <View style={styles.menuContainer}>
              {/* Profile Button */}
              <SettingsItem
                icon={<IconUser color={colors.textPrimary} />}
                label="My Profile"
                onPress={() => {
                  hideSettings();
                  onProfilePress();
                }}
              />

              {/* Theme Toggle */}
              <View style={[styles.settingsRow, { borderBottomColor: colors.border }]}>
                <View style={styles.rowIconLabel}>
                  <View style={[styles.iconBox, { backgroundColor: colors.surfaceHover }]}>
                    <IconMoon color={colors.textPrimary} bgColor={colors.surfaceElevated} />
                  </View>
                  <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>
                    Dark Mode
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#D1D5DB", true: colors.accent }}
                  thumbColor="#FFFFFF"
                  style={Platform.OS === "android" ? { transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] } : null}
                />
              </View>

              {/* Logout Button — same row pattern as other settings */}
              <SettingsItem
                icon={<IconLogout color={colors.accent} />}
                label="Log Out"
                labelColor={colors.accent}
                onPress={() => {
                  hideSettings();
                  onLogout();
                }}
              />
            </View>
          </Animated.View>
        </View>
      )}
    </>
  );
}

function SettingsItem({
  icon,
  label,
  labelColor,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.98 });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.settingsRowWrapper}
    >
      <Animated.View
        style={[
          styles.settingsRow,
          { borderBottomColor: colors.border, transform: [{ scale }] },
        ]}
      >
        <View style={styles.rowIconLabel}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceHover }]}>
            {icon}
          </View>
          <Text style={[styles.settingsLabel, { color: labelColor ?? colors.textPrimary }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: labelColor ?? colors.textMuted }]}>→</Text>
      </Animated.View>
    </Pressable>
  );
}

function TabIcon({
  icon,
  label,
  active = false,
  color,
  inactiveColor,
  onPress,
  badgeCount,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color: string;
  inactiveColor: string;
  onPress?: () => void;
  badgeCount?: number;
}) {
  const { colors } = useTheme();
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedScale: 0.9 });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tab}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <View style={styles.tabIconContainer}>
          <View style={{ opacity: active ? 1 : 0.6 }}>{icon}</View>
          {badgeCount && badgeCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: active ? color : inactiveColor },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Monochrome Icons (Built with View/Text)                           */
/* ------------------------------------------------------------------ */

function IconChat({ color }: { color: string }) {
  return (
    <View style={[styles.iconBase, { borderColor: color, borderWidth: 2, borderRadius: 4 }]}>
      <View style={[styles.iconLine, { backgroundColor: color, width: "60%", top: "35%" }]} />
      <View style={[styles.iconLine, { backgroundColor: color, width: "40%", top: "60%" }]} />
    </View>
  );
}



function IconBell({ color }: { color: string }) {
  return (
    <View style={[styles.iconBase, { alignItems: "center", justifyContent: "center" }]}>
      <View style={[styles.iconBellBody, { backgroundColor: color }]} />
      <View style={[styles.iconBellClapper, { backgroundColor: color }]} />
    </View>
  );
}

function IconGear({ color }: { color: string }) {
  return (
    <View style={[styles.iconBase, { alignItems: "center", justifyContent: "center" }]}>
      <View style={[styles.iconGearOuter, { borderColor: color }]}>
        <View style={[styles.iconGearInner, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function IconUser({ color }: { color: string }) {
  return (
    <View style={[styles.iconBase, { alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
      <View style={[styles.iconUserHead, { backgroundColor: color }]} />
      <View style={[styles.iconUserBody, { backgroundColor: color }]} />
    </View>
  );
}

function IconMoon({ color, bgColor }: { color: string; bgColor: string }) {
  return (
    <View style={[styles.iconBase, { alignItems: "center", justifyContent: "center" }]}>
      <View style={[styles.iconMoonMain, { backgroundColor: color }]} />
      <View style={[styles.iconMoonCut, { backgroundColor: bgColor }]} />
    </View>
  );
}

function IconLogout({ color }: { color: string }) {
  return (
    <View style={[styles.iconBase, { justifyContent: "center" }]}>
      <View style={[styles.iconLogoutDoor, { borderColor: color }]} />
      <View style={[styles.iconLogoutArrow, { borderTopColor: color, borderRightColor: color }]} />
      <View style={[styles.iconLogoutLine, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.1,
  },
  /* Monochrome Icon Styles */
  iconBase: {
    width: 20,
    height: 20,
    position: "relative",
  },
  iconLine: {
    height: 2,
    position: "absolute",
    left: "20%",
    borderRadius: 1,
  },
  iconVideoBody: {
    width: 14,
    height: 10,
    borderWidth: 2,
    borderRadius: 2,
  },
  iconVideoCap: {
    position: "absolute",
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 5,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  iconBellBody: {
    width: 12,
    height: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconBellClapper: {
    width: 4,
    height: 2,
    marginTop: 1,
    borderRadius: 1,
  },
  iconGearOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderStyle: "dashed",
  },
  iconGearInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  iconUserHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  iconUserBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  iconMoonMain: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  iconMoonCut: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1C2128", // This should match surfaceElevated effectively
    top: -1,
    right: -2,
  },
  iconLogoutDoor: {
    width: 12,
    height: 16,
    borderWidth: 2,
    borderRightWidth: 0,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  iconLogoutArrow: {
    position: "absolute",
    right: 0,
    width: 6,
    height: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  iconLogoutLine: {
    position: "absolute",
    right: 0,
    width: 10,
    height: 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  settingsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  menuContainer: {
    gap: 2,
  },
  settingsRowWrapper: {
    width: "100%",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowIconLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    fontSize: 18,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  chevron: {
    fontSize: 18,
    fontFamily: Platform.OS === "android" ? "monospace" : "System",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
});
