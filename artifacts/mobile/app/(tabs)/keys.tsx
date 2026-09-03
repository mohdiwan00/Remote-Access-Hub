import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { useConnections, type SSHKey } from "@/context/ConnectionsContext";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/expo";

const KEY_TYPES: SSHKey["type"][] = ["ed25519", "rsa", "ecdsa"];
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const KEY_TYPE_INFO: Record<SSHKey["type"], { label: string; desc: string; color: string }> = {
  ed25519: { label: "Ed25519", desc: "Fastest & most secure. Recommended.", color: "#3fb950" },
  rsa: { label: "RSA 4096", desc: "Widely compatible. Good for older servers.", color: "#58a6ff" },
  ecdsa: { label: "ECDSA", desc: "Elliptic curve. Compact and fast.", color: "#a371f7" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function KeysScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { keys, addKey, deleteKey } = useConnections();
  const { getToken } = useAuth();
  const [showGenerate, setShowGenerate] = useState(false);
  const [keyType, setKeyType] = useState<SSHKey["type"]>("ed25519");
  const [keyName, setKeyName] = useState("");
  const [generating, setGenerating] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      Alert.alert("Name required", "Please enter a name for this key.");
      return;
    }
    setGenerating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Your sign-in session has expired");
      const response = await fetch(`${API_BASE}/api/keys/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: keyType, comment: keyName.trim() }),
      });
      const data = await response.json() as { publicKey?: string; privateKey?: string; error?: string };
      if (!response.ok || !data.publicKey || !data.privateKey) throw new Error(data.error ?? "Key generation failed");
      addKey({ name: keyName.trim(), type: keyType, publicKey: data.publicKey, privateKey: data.privateKey });
      setGenerating(false);
      setShowGenerate(false);
      setKeyName("");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setGenerating(false);
      Alert.alert("Generation failed", error instanceof Error ? error.message : "Unable to generate key");
    }
  };

  const handleDelete = (key: SSHKey) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Key", `Remove "${key.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteKey(key.id) },
    ]);
  };

  const handleCopyKey = (key: SSHKey) => {
    Alert.alert("Public Key", key.publicKey, [{ text: "OK" }]);
  };

  const renderKey = ({ item }: { item: SSHKey }) => {
    const info = KEY_TYPE_INFO[item.type];
    return (
      <View style={[styles.keyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.keyIconBox, { backgroundColor: info.color + "18" }]}>
          <Feather name="key" size={20} color={info.color} />
        </View>
        <View style={styles.keyInfo}>
          <Text style={[styles.keyName, { color: colors.foreground }]}>{item.name}</Text>
          <View style={styles.keyMeta}>
            <View style={[styles.keyBadge, { backgroundColor: info.color + "18", borderColor: info.color + "44" }]}>
              <Text style={[styles.keyBadgeText, { color: info.color }]}>{info.label}</Text>
            </View>
            <Text style={[styles.keyDate, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={[styles.keyPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.publicKey.substring(0, 40)}...
          </Text>
        </View>
        <View style={styles.keyActions}>
          <Pressable onPress={() => handleCopyKey(item)} hitSlop={8} style={styles.keyActionBtn}>
            <Feather name="copy" size={16} color={colors.mutedForeground} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={styles.keyActionBtn}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>SSH Keys</Text>
        <Pressable
          onPress={() => setShowGenerate(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Generate</Text>
        </Pressable>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Keys are stored in encrypted device storage. FIDO2 hardware keys (NFC/USB) supported on compatible devices.
        </Text>
      </View>

      {keys.length === 0 ? (
        <EmptyState
          icon="key"
          title="No SSH keys"
          subtitle="Generate an Ed25519 key pair to authenticate without passwords"
        />
      ) : (
        <FlatList
          data={keys}
          keyExtractor={(k) => k.id}
          renderItem={renderKey}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showGenerate} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowGenerate(false)} hitSlop={12}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Generate Key Pair</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KEY TYPE</Text>
            {KEY_TYPES.map((t) => {
              const info = KEY_TYPE_INFO[t];
              const active = keyType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setKeyType(t)}
                  style={[styles.typeOption, {
                    backgroundColor: active ? info.color + "18" : colors.card,
                    borderColor: active ? info.color : colors.border,
                  }]}
                >
                  <Feather name="key" size={18} color={active ? info.color : colors.mutedForeground} />
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeLabel, { color: active ? info.color : colors.foreground }]}>{info.label}</Text>
                    <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{info.desc}</Text>
                  </View>
                  {active && <Feather name="check-circle" size={18} color={info.color} />}
                </Pressable>
              );
            })}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>KEY NAME</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={keyName}
              onChangeText={setKeyName}
              placeholder="e.g. Work Laptop, Production"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
            />

            <Pressable
              onPress={handleGenerate}
              disabled={generating}
              style={[styles.generateBtn, { backgroundColor: generating ? colors.primary + "77" : colors.primary }]}
            >
              {generating ? (
                <Text style={styles.generateBtnText}>Generating...</Text>
              ) : (
                <>
                  <Feather name="cpu" size={16} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate Key Pair</Text>
                </>
              )}
            </Pressable>

            <Text style={[styles.securityNote, { color: colors.mutedForeground }]}>
              Private key is encrypted with AES-256 and stored in secure device storage. Never leaves your device.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  list: { padding: 16, gap: 10 },
  keyCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  keyIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  keyInfo: { flex: 1, gap: 4 },
  keyName: { fontSize: 15, fontWeight: "600" },
  keyMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  keyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  keyBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  keyDate: { fontSize: 12 },
  keyPreview: { fontSize: 11, fontFamily: "monospace" },
  keyActions: { gap: 10 },
  keyActionBtn: { padding: 4 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600" },
  modalBody: { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  typeOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 15, fontWeight: "600" },
  typeDesc: { fontSize: 12, marginTop: 2 },
  nameInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, marginTop: 8 },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  securityNote: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 8 },
});
