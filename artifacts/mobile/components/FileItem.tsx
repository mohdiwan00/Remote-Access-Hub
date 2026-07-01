import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export interface FileEntry {
  id: string;
  name: string;
  type: "file" | "dir" | "link";
  size?: number;
  modified?: number;
  permissions?: string;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(ts?: number): string {
  if (!ts) return "--";
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function getFileIcon(entry: FileEntry): string {
  if (entry.type === "dir") return "folder";
  const ext = entry.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt": case "md": case "log": return "file-text";
    case "jpg": case "jpeg": case "png": case "gif": case "svg": return "image";
    case "mp4": case "mov": case "avi": return "video";
    case "mp3": case "wav": case "flac": return "music";
    case "zip": case "tar": case "gz": case "7z": return "archive";
    case "js": case "ts": case "py": case "sh": case "json": return "code";
    case "pdf": return "file-text";
    default: return "file";
  }
}

function getFileColor(entry: FileEntry, colors: ReturnType<typeof useColors>): string {
  if (entry.type === "dir") return colors.primary;
  if (entry.type === "link") return colors.vnc;
  const ext = entry.name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext ?? "")) return colors.sftp;
  if (["mp4", "mov", "avi", "mp3"].includes(ext ?? "")) return colors.rdp;
  if (["js", "ts", "py", "sh"].includes(ext ?? "")) return colors.warning;
  return colors.mutedForeground;
}

interface Props {
  entry: FileEntry;
  onPress: () => void;
  onLongPress: () => void;
  selected?: boolean;
}

export function FileItem({ entry, onPress, onLongPress, selected }: Props) {
  const colors = useColors();
  const fileColor = getFileColor(entry, colors);
  const icon = getFileIcon(entry);

  const handleLongPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected
            ? colors.primary + "22"
            : pressed
            ? colors.card
            : "transparent",
          borderColor: selected ? colors.primary + "44" : "transparent",
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: fileColor + "18" }]}>
        <Feather name={icon as any} size={18} color={fileColor} />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.name, { color: entry.type === "dir" ? colors.primary : colors.foreground }]} numberOfLines={1}>
          {entry.name}{entry.type === "link" ? " →" : ""}
        </Text>
        {entry.type !== "dir" && (
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {formatSize(entry.size)}  •  {formatDate(entry.modified)}
          </Text>
        )}
        {entry.type === "dir" && entry.modified && (
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {formatDate(entry.modified)}
          </Text>
        )}
      </View>
      {entry.type === "dir" && (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
      )}
      {selected && (
        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={12} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBox: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
  meta: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
