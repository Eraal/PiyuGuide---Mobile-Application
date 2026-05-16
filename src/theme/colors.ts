/**
 * PiyuGuide Mobile — Unified color system.
 *
 * Both palettes share the same LSPU-inspired branding (`accent` red, `navy`
 * primary) so the logged-in experience matches the onboarding flow.
 */

/* ------------------------------------------------------------------ */
/*  Type                                                              */
/* ------------------------------------------------------------------ */

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentText: string;
  bubbleIncoming: string;
  bubbleIncomingText: string;
  bubbleOutgoing: string;
  bubbleOutgoingText: string;
  timestampText: string;
  timestampTextIncoming: string;
  online: string;
  unreadBadge: string;
  unreadBadgeText: string;
  composerBackground: string;
  composerInputBackground: string;
  composerInputText: string;
  composerPlaceholder: string;
  composerIcon: string;
  searchBackground: string;
  searchText: string;
  searchPlaceholder: string;
  searchIcon: string;
  fabBackground: string;
  fabIcon: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
  headerBackground: string;
  navy: string;
  green: string;
  panelBackground: string;
  /* ---- Chat-specific tokens ---- */
  avatarFallbackBackground: string;
  avatarFallbackText: string;
  fileBubbleBackground: string;
  fileBubbleBorder: string;
  fileBubbleIcon: string;
  fileBubbleText: string;
};

/* ------------------------------------------------------------------ */
/*  Dark palette (premium dark mode)                                  */
/* ------------------------------------------------------------------ */
export const darkColors: ThemeColors = {
  // Core surfaces — warmer dark tones
  background: "#0F1318",
  surface: "#171C24",
  surfaceElevated: "#1E2530",
  surfaceHover: "#242C38",

  // Dividers & borders
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.13)",

  // Text hierarchy
  textPrimary: "#F0F4F8",
  textSecondary: "#8D96A0",
  textMuted: "#505860",

  // Accent — LSPU red
  accent: "#E53935",
  accentLight: "rgba(229,57,53,0.14)",
  accentText: "#FFFFFF",

  // Incoming bubbles — subtle card-like
  bubbleIncoming: "#1E2530",
  bubbleIncomingText: "#F0F4F8",

  // Outgoing bubbles — accent
  bubbleOutgoing: "#E53935",
  bubbleOutgoingText: "#FFFFFF",

  // Timestamp text inside bubbles
  timestampText: "rgba(255,255,255,0.50)",
  timestampTextIncoming: "rgba(255,255,255,0.40)",

  // Status / indicators
  online: "#3FB950",
  unreadBadge: "#E53935",
  unreadBadgeText: "#FFFFFF",

  // Composer bar
  composerBackground: "#171C24",
  composerInputBackground: "#0F1318",
  composerInputText: "#F0F4F8",
  composerPlaceholder: "#505860",
  composerIcon: "#8D96A0",

  // Search bar
  searchBackground: "#171C24",
  searchText: "#F0F4F8",
  searchPlaceholder: "#505860",
  searchIcon: "#505860",

  // FAB
  fabBackground: "#E53935",
  fabIcon: "#FFFFFF",

  // Tab bar
  tabBarBackground: "#0F1318",
  tabBarBorder: "rgba(255,255,255,0.06)",
  tabActive: "#E53935",
  tabInactive: "#505860",

  // Header
  headerBackground: "#0F1318",

  // Branding
  navy: "#023c69",
  green: "#10b981",
  panelBackground: "#0F1318",

  // Chat-specific
  avatarFallbackBackground: "#242C38",
  avatarFallbackText: "#8D96A0",
  fileBubbleBackground: "rgba(255,255,255,0.06)",
  fileBubbleBorder: "rgba(255,255,255,0.10)",
  fileBubbleIcon: "#8D96A0",
  fileBubbleText: "#F0F4F8",
};

/* ------------------------------------------------------------------ */
/*  Light palette — matches onboarding aesthetic                      */
/* ------------------------------------------------------------------ */
export const lightColors: ThemeColors = {
  // Core surfaces — warm off-white matching onboarding
  background: "#F4F7FA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceHover: "#EEF2F6",

  // Dividers & borders — softer
  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(0,0,0,0.10)",

  // Text hierarchy — matching onboarding tones
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",

  // Accent — LSPU red
  accent: "#E53935",
  accentLight: "rgba(229,57,53,0.08)",
  accentText: "#FFFFFF",

  // Incoming bubbles — soft card
  bubbleIncoming: "#E8ECF1",
  bubbleIncomingText: "#0F172A",

  // Outgoing bubbles — accent
  bubbleOutgoing: "#E53935",
  bubbleOutgoingText: "#FFFFFF",

  // Timestamp text
  timestampText: "rgba(255,255,255,0.55)",
  timestampTextIncoming: "rgba(0,0,0,0.38)",

  // Status
  online: "#1A7F37",
  unreadBadge: "#E53935",
  unreadBadgeText: "#FFFFFF",

  // Composer — clean white
  composerBackground: "#FFFFFF",
  composerInputBackground: "#EEF2F6",
  composerInputText: "#0F172A",
  composerPlaceholder: "#94A3B8",
  composerIcon: "#64748B",

  // Search
  searchBackground: "#FFFFFF",
  searchText: "#0F172A",
  searchPlaceholder: "#94A3B8",
  searchIcon: "#94A3B8",

  // FAB
  fabBackground: "#E53935",
  fabIcon: "#FFFFFF",

  // Tab bar — clean white
  tabBarBackground: "#FFFFFF",
  tabBarBorder: "rgba(0,0,0,0.06)",
  tabActive: "#E53935",
  tabInactive: "#94A3B8",

  // Header — clean white
  headerBackground: "#FFFFFF",

  // Branding
  navy: "#023c69",
  green: "#10b981",
  panelBackground: "#F4F7FA",

  // Chat-specific
  avatarFallbackBackground: "#E8ECF1",
  avatarFallbackText: "#64748B",
  fileBubbleBackground: "rgba(0,0,0,0.04)",
  fileBubbleBorder: "rgba(0,0,0,0.08)",
  fileBubbleIcon: "#64748B",
  fileBubbleText: "#0F172A",
};

/* ------------------------------------------------------------------ */
/*  Legacy compat — old screens import { colors }                     */
/* ------------------------------------------------------------------ */
export const colors = {
  navy: "#023c69",
  blue: "#1d4ed8",
  green: "#10b981",
  background: "#06182b",
  surface: "#ffffff",
  softSurface: "rgba(255,255,255,0.1)",
  softBorder: "rgba(255,255,255,0.16)",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  successSurface: "#d1fae5",
  successText: "#047857",
  warningSurface: "#fef3c7",
  warningText: "#92400e",
  panelBackground: "#eef4f7",
} as const;
