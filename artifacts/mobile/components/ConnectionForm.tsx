import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { Connection, ConnectionType } from "@/context/ConnectionsContext";

const CONNECTION_TYPES: { type: ConnectionType; label: string; defaultPort: number; icon: string }[] = [
  { type: "ssh", label: "SSH", defaultPort: 22, icon: "terminal" },
  { type: "vnc", label: "VNC", defaultPort: 5900, icon: "monitor" },
  { type: "rdp", label: "RDP", defaultPort: 3389, icon: "layout" },
  { type: "sftp", label: "SFTP", defaultPort: 22, icon: "folder" },
];

interface Props {
  initial?: Partial<Connection>;
  onSave: (conn: Omit<Connection, "id">) => void;
  onCancel: () => void;
}

export function ConnectionForm({ initial, onSave, onCancel }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<ConnectionType>(initial?.type ?? "ssh");
  const [name, setName] = useState(initial?.name ?? "");
  const [host, setHost] = useState(initial?.host ?? "");
  const [port, setPort] = useState(String(initial?.port ?? CONNECTION_TYPES[0].defaultPort));
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [group, setGroup] = useState(initial?.group ?? "");
  const [proxyJump, setProxyJump] = useState(initial?.proxyJump ?? "");
  const [useKey, setUseKey] = useState(!initial?.password && !!initial?.privateKeyId);
  const [showPassword, setShowPassword] = useState(false);

  const selectedTypeInfo = CONNECTION_TYPES.find((t) => t.type === type)!;

  const handleTypeChange = (t: ConnectionType) => {
    setType(t);
    if (!initial) {
      const info = CONNECTION_TYPES.find((x) => x.type === t)!;
      setPort(String(info.defaultPort));
    }
  };

  const handleSave = () => {
    if (!name || !host || !username) return;
    onSave({
      type,
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port) || selectedTypeInfo.defaultPort,
      username: username.trim(),
      password: useKey ? undefined : password,
      group: group.trim() || undefined,
      proxyJump: proxyJump.trim() || undefined,
    });
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onCancel} hitSlop={12} style={styles.headerBtn}>
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {initial?.id ? "Edit Connection" : "New Connection"}
        </Text>
        <Pressable onPress={handleSave} hitSlop={12} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, { color: colors.mutedForeground }]}>TYPE</Text>
        <View style={styles.typeRow}>
          {CONNECTION_TYPES.map((t) => {
            const active = t.type === type;
            const tColor = colors[t.type];
            return (
              <Pressable
                key={t.type}
                onPress={() => handleTypeChange(t.type)}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: active ? tColor + "22" : colors.card,
                    borderColor: active ? tColor : colors.border,
                  },
                ]}
              >
                <Feather name={t.icon as any} size={18} color={active ? tColor : colors.mutedForeground} />
                <Text style={[styles.typeBtnText, { color: active ? tColor : colors.mutedForeground }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>CONNECTION</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="Name">
            <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="My Server" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" />
          </Field>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Field label="Hostname / IP">
            <TextInput style={inputStyle} value={host} onChangeText={setHost} placeholder="192.168.1.1" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="url" autoCorrect={false} />
          </Field>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Field label="Port">
            <TextInput style={[inputStyle, { width: 100 }]} value={port} onChangeText={setPort} keyboardType="number-pad" />
          </Field>
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>CREDENTIALS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="Username">
            <TextInput style={inputStyle} value={username} onChangeText={setUsername} placeholder="ubuntu" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" autoCorrect={false} />
          </Field>
          {type === "ssh" && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={[styles.field, styles.switchRow]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Use SSH Key</Text>
                <Switch value={useKey} onValueChange={setUseKey} trackColor={{ true: colors.primary }} />
              </View>
            </>
          )}
          {!useKey && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Field label="Password">
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[inputStyle, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </Field>
            </>
          )}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>ADVANCED</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="Group / Label">
            <TextInput style={inputStyle} value={group} onChangeText={setGroup} placeholder="Work" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
          </Field>
          {type === "ssh" && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Field label="ProxyJump">
                <TextInput style={inputStyle} value={proxyJump} onChangeText={setProxyJump} placeholder="bastion@192.168.0.1" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" autoCorrect={false} />
              </Field>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  scroll: { padding: 16, gap: 8 },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 16, marginBottom: 6, marginLeft: 4 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  typeBtnText: { fontSize: 12, fontWeight: "700" },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  field: { padding: 14, gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontFamily: "monospace" },
  divider: { height: 1, marginHorizontal: 14 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { padding: 8 },
});
