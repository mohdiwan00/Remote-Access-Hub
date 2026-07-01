import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConnectionCard } from "@/components/ConnectionCard";
import { ConnectionForm } from "@/components/ConnectionForm";
import { EmptyState } from "@/components/EmptyState";
import { useConnections, type Connection, type ConnectionType } from "@/context/ConnectionsContext";
import { useTerminal } from "@/context/TerminalContext";
import { useColors } from "@/hooks/useColors";

const TYPE_FILTERS: { type: ConnectionType | "all"; label: string }[] = [
  { type: "all", label: "All" },
  { type: "ssh", label: "SSH" },
  { type: "vnc", label: "VNC" },
  { type: "rdp", label: "RDP" },
  { type: "sftp", label: "SFTP" },
];

export default function ConnectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { connections, addConnection, updateConnection, deleteConnection, setLastConnected } = useConnections();
  const { openSession } = useTerminal();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConnectionType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);

  const filtered = connections.filter((c) => {
    const matchType = filter === "all" || c.type === filter;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.host.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleConnect = (conn: Connection) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLastConnected(conn.id);
    if (conn.type === "ssh") {
      openSession(conn);
      router.push("/(tabs)/terminal");
    } else if (conn.type === "sftp") {
      router.push("/(tabs)/files");
    } else {
      Alert.alert(
        `Connect via ${conn.type.toUpperCase()}`,
        `Connecting to ${conn.host}:${conn.port}\n\nNote: ${conn.type.toUpperCase()} viewer is launching...`,
        [{ text: "OK" }]
      );
    }
  };

  const handleDelete = (conn: Connection) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Connection",
      `Remove "${conn.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteConnection(conn.id),
        },
      ]
    );
  };

  const handleEdit = (conn: Connection) => {
    setEditing(conn);
    setShowForm(true);
  };

  const handleSave = (data: Omit<Connection, "id">) => {
    if (editing) {
      updateConnection(editing.id, data);
    } else {
      addConnection(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>ConnectX</Text>
          <Pressable
            onPress={() => { setEditing(null); setShowForm(true); }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </Pressable>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search connections..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x-circle" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(i) => i.type}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const active = filter === item.type;
            const tColor = item.type !== "all" ? colors[item.type] : colors.primary;
            return (
              <Pressable
                onPress={() => setFilter(item.type as any)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? tColor + "22" : "transparent",
                    borderColor: active ? tColor : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? tColor : colors.mutedForeground }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="server"
          title={search ? "No results" : "No connections yet"}
          subtitle={search ? "Try a different search" : "Tap New to add your first SSH, VNC, RDP or SFTP connection"}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConnectionCard
              connection={item}
              onPress={() => handleConnect(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="fullScreen">
        <ConnectionForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 8 },
  headerTop: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  title: { flex: 1, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  searchBox: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { paddingHorizontal: 12, gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  list: { paddingVertical: 12 },
});
