import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { TerminalView } from "@/components/TerminalView";
import { useTerminal, type ColorScheme } from "@/context/TerminalContext";
import { useColors } from "@/hooks/useColors";

const SCHEME_LABELS: Record<ColorScheme, string> = {
  green: "Green",
  amber: "Amber",
  cyan: "Cyan",
  white: "White",
  solarized: "Solarized",
  dracula: "Dracula",
};

const SCHEME_COLORS: Record<ColorScheme, string> = {
  green: "#33ff33",
  amber: "#ffb000",
  cyan: "#00d4ff",
  white: "#e6edf3",
  solarized: "#839496",
  dracula: "#bd93f9",
};

export default function TerminalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, activeSessionId, colorScheme, fontSize, vimMode, closeSession, setActiveSession, addLine, setColorScheme, setFontSize, setVimMode } = useTerminal();
  const [showSettings, setShowSettings] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleCommand = (cmd: string) => {
    if (!activeSessionId) return;
    if (cmd.startsWith("__output__")) {
      addLine(activeSessionId, { text: cmd.replace("__output__", ""), type: "output" });
    } else if (cmd === "__clear__") {
      // handled inside TerminalView
    } else {
      addLine(activeSessionId, { text: `$ ${cmd}`, type: "input" });
    }
  };

  const handleClose = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Close Session", "Disconnect and close this terminal session?", [
      { text: "Cancel", style: "cancel" },
      { text: "Close", style: "destructive", onPress: () => closeSession(id) },
    ]);
  };

  if (sessions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Terminal</Text>
        </View>
        <EmptyState
          icon="terminal"
          title="No active sessions"
          subtitle="Connect to an SSH server from the Connections tab to open a terminal"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {sessions.map((s) => {
            const active = s.id === activeSessionId;
            return (
              <Pressable
                key={s.id}
                onPress={() => setActiveSession(s.id)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? colors.card : "transparent",
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: s.status === "connected" ? colors.sftp : colors.destructive }]} />
                <Text style={[styles.tabText, { color: active ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                  {s.connectionName}
                </Text>
                <Pressable onPress={() => handleClose(s.id)} hitSlop={8}>
                  <Feather name="x" size={13} color={colors.mutedForeground} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          onPress={() => setShowSettings(!showSettings)}
          style={[styles.settingsBtn, { borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="sliders" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {showSettings && (
        <View style={[styles.settingsPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>COLOR SCHEME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schemesRow}>
            {(Object.keys(SCHEME_LABELS) as ColorScheme[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setColorScheme(s)}
                style={[styles.schemeChip, {
                  backgroundColor: colorScheme === s ? SCHEME_COLORS[s] + "22" : colors.input,
                  borderColor: colorScheme === s ? SCHEME_COLORS[s] : colors.border,
                }]}
              >
                <View style={[styles.schemeDot, { backgroundColor: SCHEME_COLORS[s] }]} />
                <Text style={[styles.schemeText, { color: colorScheme === s ? SCHEME_COLORS[s] : colors.mutedForeground }]}>
                  {SCHEME_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.settingsRow}>
            <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>FONT SIZE: {fontSize}px</Text>
            <View style={styles.fontBtns}>
              <Pressable onPress={() => setFontSize(Math.max(10, fontSize - 1))} style={[styles.fontBtn, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Feather name="minus" size={14} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={() => setFontSize(Math.min(24, fontSize + 1))} style={[styles.fontBtn, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Feather name="plus" size={14} color={colors.foreground} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => setVimMode(!vimMode)}
              style={[styles.vimToggle, { backgroundColor: vimMode ? colors.primary + "22" : colors.input, borderColor: vimMode ? colors.primary : colors.border }]}
            >
              <Text style={[styles.vimText, { color: vimMode ? colors.primary : colors.mutedForeground }]}>VIM</Text>
            </Pressable>
          </View>
        </View>
      )}

      {activeSession ? (
        <TerminalView
          session={activeSession}
          onCommand={handleCommand}
          onClose={() => handleClose(activeSession.id)}
        />
      ) : (
        <EmptyState icon="terminal" title="Select a session" subtitle="Tap a tab above to view that terminal" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", paddingHorizontal: 16, paddingBottom: 4 },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 8, alignItems: "center" },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, maxWidth: 160 },
  tabText: { fontSize: 13, fontWeight: "500", flex: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  settingsBtn: { padding: 10, marginRight: 8, borderRadius: 8, borderWidth: 1 },
  settingsPanel: { borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, flex: 1 },
  schemesRow: { gap: 8, paddingVertical: 2 },
  schemeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  schemeDot: { width: 8, height: 8, borderRadius: 4 },
  schemeText: { fontSize: 12, fontWeight: "600" },
  fontBtns: { flexDirection: "row", gap: 6 },
  fontBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  vimToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  vimText: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
});
