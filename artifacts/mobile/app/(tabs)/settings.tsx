import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  label: string;
  value?: string;
  icon: string;
  iconColor?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ label, value, icon, iconColor, toggle, toggleValue, onToggle, onPress, danger }: SettingRowProps) {
  const colors = useColors();
  const color = danger ? colors.destructive : iconColor ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={toggle || !onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed && onPress ? colors.card + "aa" : "transparent" }
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      {toggle ? (
        <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ true: colors.primary }} />
      ) : value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : onPress ? (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [biometric, setBiometric] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [keepAlive, setKeepAlive] = useState(true);
  const [strictHostKey, setStrictHostKey] = useState(false);
  const [compression, setCompression] = useState(true);
  const [auditLog, setAuditLog] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );

  const Divider = () => <View style={[styles.divider, { backgroundColor: colors.border }]} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        <Section title="SECURITY">
          <SettingRow
            label="Biometric Lock"
            icon="fingerprint"
            toggle
            toggleValue={biometric}
            onToggle={setBiometric}
          />
          <Divider />
          <SettingRow
            label="Timeout"
            icon="clock"
            value="5 minutes"
            onPress={() => Alert.alert("Timeout", "Select lock timeout", [
              { text: "1 minute", onPress: () => {} },
              { text: "5 minutes", onPress: () => {} },
              { text: "15 minutes", onPress: () => {} },
              { text: "Never", onPress: () => {} },
            ])}
          />
          <Divider />
          <SettingRow
            label="Strict Host Key Checking"
            icon="shield"
            toggle
            toggleValue={strictHostKey}
            onToggle={setStrictHostKey}
          />
          <Divider />
          <SettingRow
            label="Connection Audit Log"
            icon="list"
            toggle
            toggleValue={auditLog}
            onToggle={setAuditLog}
          />
        </Section>

        <Section title="SSH">
          <SettingRow
            label="Auto-Reconnect"
            icon="refresh-cw"
            toggle
            toggleValue={autoReconnect}
            onToggle={setAutoReconnect}
          />
          <Divider />
          <SettingRow
            label="Keep-Alive Interval"
            icon="activity"
            value="30s"
            onPress={() => Alert.alert("Keep-Alive", "Set keep-alive interval")}
          />
          <Divider />
          <SettingRow
            label="Compression"
            icon="minimize-2"
            toggle
            toggleValue={compression}
            onToggle={setCompression}
          />
          <Divider />
          <SettingRow
            label="Known Hosts"
            icon="server"
            value="3 hosts"
            onPress={() => Alert.alert("Known Hosts", "Manage known_hosts file")}
          />
        </Section>

        <Section title="TERMINAL">
          <SettingRow
            label="Default Color Scheme"
            icon="monitor"
            value="Green"
            onPress={() => Alert.alert("Color Scheme", "Change in the Terminal tab")}
          />
          <Divider />
          <SettingRow
            label="Default Font Size"
            icon="type"
            value="14px"
            onPress={() => Alert.alert("Font Size", "Change in the Terminal tab")}
          />
          <Divider />
          <SettingRow
            label="Bell"
            icon="bell"
            value="Silent"
            onPress={() => {}}
          />
          <Divider />
          <SettingRow
            label="Vim Mode"
            icon="code"
            value="Off"
            onPress={() => {}}
          />
        </Section>

        <Section title="NETWORK">
          <SettingRow
            label="Default Proxy"
            icon="globe"
            value="None"
            onPress={() => Alert.alert("Proxy", "Configure proxy settings")}
          />
          <Divider />
          <SettingRow
            label="Tailscale Discovery"
            icon="radio"
            value="Not configured"
            onPress={() => Alert.alert("Tailscale", "Peer-to-peer VPN network discovery")}
          />
          <Divider />
          <SettingRow
            label="Mosh (UDP)"
            icon="wifi"
            value="Enabled"
            onPress={() => {}}
          />
        </Section>

        <Section title="CLOUD">
          <SettingRow
            label="rclone Config"
            icon="cloud"
            value="1 provider"
            onPress={() => Alert.alert("rclone", "Manage cloud provider configurations")}
          />
          <Divider />
          <SettingRow
            label="DLNA Media Server"
            icon="tv"
            toggle
            toggleValue={false}
            onToggle={() => Alert.alert("DLNA", "Enable local media streaming server")}
          />
          <Divider />
          <SettingRow
            label="Sync Bandwidth Limit"
            icon="sliders"
            value="Unlimited"
            onPress={() => {}}
          />
        </Section>

        <Section title="ABOUT">
          <SettingRow label="Version" icon="info" value="1.0.0 (open source)" />
          <Divider />
          <SettingRow
            label="View on GitHub"
            icon="github"
            onPress={() => Alert.alert("GitHub", "Open source SSH/VNC/RDP/SFTP client for Android")}
          />
          <Divider />
          <SettingRow
            label="Export Settings"
            icon="download"
            onPress={() => Alert.alert("Export", "Export encrypted settings backup")}
          />
          <Divider />
          <SettingRow
            label="Import Settings"
            icon="upload"
            onPress={() => Alert.alert("Import", "Import settings from backup")}
          />
        </Section>

        <Section title="DANGER ZONE">
          <SettingRow
            label="Clear All Connections"
            icon="trash-2"
            danger
            onPress={() => Alert.alert("Clear All", "Delete all saved connections?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: () => {} },
            ])}
          />
          <Divider />
          <SettingRow
            label="Factory Reset"
            icon="alert-triangle"
            danger
            onPress={() => Alert.alert("Reset", "Wipe all data including keys and connections?", [
              { text: "Cancel", style: "cancel" },
              { text: "Reset", style: "destructive", onPress: () => {} },
            ])}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  scroll: { padding: 16, gap: 6 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginLeft: 4, marginBottom: 2 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14 },
  divider: { height: 1, marginLeft: 58 },
});
