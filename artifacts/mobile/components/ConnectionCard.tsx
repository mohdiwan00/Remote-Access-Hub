import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Connection, ConnectionType } from "@/context/ConnectionsContext";

function typeLabel(type: ConnectionType): string {
  return type.toUpperCase();
}

function typeColor(type: ConnectionType, colors: ReturnType<typeof useColors>): string {
  switch (type) {
    case "ssh": return colors.ssh;
    case "vnc": return colors.vnc;
    case "rdp": return colors.rdp;
    case "sftp": return colors.sftp;
  }
}

function typeIcon(type: ConnectionType): string {
  switch (type) {
    case "ssh": return "terminal";
    case "vnc": return "monitor";
    case "rdp": return "layout";
    case "sftp": return "folder";
  }
}

function timeAgo(ts?: number): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  connection: Connection;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ConnectionCard({ connection, onPress, onEdit, onDelete }: Props) {
  const colors = useColors();
  const tColor = typeColor(connection.type, colors);

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.typeBar, { backgroundColor: tColor }]} />
      <View style={styles.iconWrap}>
        <View style={[styles.iconBg, { backgroundColor: tColor + "22" }]}>
          <Feather name={typeIcon(connection.type) as any} size={20} color={tColor} />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {connection.name}
        </Text>
        <Text style={[styles.host, { color: colors.mutedForeground }]} numberOfLines={1}>
          {connection.username}@{connection.host}:{connection.port}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: tColor + "22", borderColor: tColor + "44" }]}>
            <Text style={[styles.badgeText, { color: tColor }]}>{typeLabel(connection.type)}</Text>
          </View>
          {connection.group && (
            <View style={[styles.badge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{connection.group}</Text>
            </View>
          )}
          <Text style={[styles.lastSeen, { color: colors.mutedForeground }]}>
            {timeAgo(connection.lastConnected)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.actionBtn}>
          <Feather name="edit-2" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    overflow: "hidden",
  },
  typeBar: {
    width: 3,
    alignSelf: "stretch",
  },
  iconWrap: {
    padding: 14,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    paddingVertical: 12,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  host: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  lastSeen: {
    fontSize: 11,
    marginLeft: 2,
  },
  actions: {
    padding: 12,
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
});
