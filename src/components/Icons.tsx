import React from "react";
import { View, StyleSheet } from "react-native";

export function IconCounseling({ color, size = 20 }: { color: string; size?: number }) {
  const scale = size / 20;
  return (
    <View style={[styles.iconBase, { justifyContent: "center", transform: [{ scale }] }]}>
      <View style={[styles.iconVideoBody, { borderColor: color }]} />
      <View style={[styles.iconVideoCap, { borderLeftColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBase: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconVideoBody: {
    width: 14,
    height: 10,
    borderWidth: 2,
    borderRadius: 2,
  },
  iconVideoCap: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderTopColor: "transparent",
    borderBottomWidth: 4,
    borderBottomColor: "transparent",
    borderLeftWidth: 6,
    marginLeft: 2,
  },
});
