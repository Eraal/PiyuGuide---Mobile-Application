import React, { useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import type { MobileInquiryDetails } from "../services/backend";
import { StatusBadge } from "./StatusBadge";

type InquiryDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  details: MobileInquiryDetails | null;
};

export function InquiryDetailsModal({ visible, onClose, details }: InquiryDetailsModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && opacity._value === 0) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity, backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <Pressable style={styles.flex} onPress={onClose} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sheet, 
            { 
              backgroundColor: colors.surface,
              transform: [{ translateY }],
              paddingBottom: insets.bottom + 20
            }
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Inquiry Details</Text>
            
            {details ? (
              <View style={styles.detailsContainer}>
                {/* Header Info */}
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>SUBJECT</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{details.subject}</Text>
                  <View style={styles.statusRow}>
                     <StatusBadge status={details.status} />
                     <Text style={[styles.date, { color: colors.textMuted }]}>
                       {details.createdAt ? new Date(details.createdAt.replace(" ", "T")).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                     </Text>
                  </View>
                </View>

                {/* Office Info */}
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <IconOffice color={colors.accent} />
                    <Text style={[styles.label, { color: colors.textSecondary, marginLeft: 8 }]}>OFFICE</Text>
                  </View>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{details.office?.name || "N/A"}</Text>
                  {details.office?.description && (
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                      {details.office.description}
                    </Text>
                  )}
                </View>

                {/* Concerns */}
                <View style={[styles.section, { borderBottomWidth: 0 }]}>
                  <View style={styles.sectionHeader}>
                    <IconConcern color={colors.accent} />
                    <Text style={[styles.label, { color: colors.textSecondary, marginLeft: 8 }]}>CONCERN TYPES</Text>
                  </View>
                  <View style={styles.tagContainer}>
                    {details.concerns && details.concerns.length > 0 ? (
                      details.concerns.map((concern, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: colors.surfaceHover }]}>
                          <Text style={[styles.tagText, { color: colors.textPrimary }]}>{concern}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.value, { color: colors.textMuted, fontSize: 14 }]}>No specific concern types listed.</Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={{ color: colors.textMuted }}>Loading details...</Text>
              </View>
            )}
            
            <Pressable 
              onPress={onClose} 
              style={[styles.closeButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Custom Icons
function IconOffice({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      <View style={[styles.iconOfficeFrame, { borderColor: color }]}>
        <View style={[styles.iconOfficeDoor, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function IconConcern({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      <View style={[styles.iconConcernCircle, { borderColor: color }]}>
        <Text style={{ color, fontSize: 10, fontWeight: "bold", textAlign: 'center' }}>?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  flex: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 400,
    maxHeight: "85%",
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  detailsContainer: {
    gap: 0,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 32,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  // Icon specific
  iconBox: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOfficeFrame: {
    width: 16,
    height: 16,
    borderWidth: 1.8,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconOfficeDoor: {
    width: 5,
    height: 7,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  iconConcernCircle: {
    width: 16,
    height: 16,
    borderWidth: 1.8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
