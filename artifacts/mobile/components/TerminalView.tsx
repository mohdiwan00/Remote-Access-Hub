import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { ColorScheme, TerminalLine, TerminalSession } from "@/context/TerminalContext";

const COLOR_SCHEMES: Record<ColorScheme, { fg: string; bg: string; prompt: string; cursor: string }> = {
  green: { fg: "#33ff33", bg: "#0a0a0a", prompt: "#00cc00", cursor: "#33ff33" },
  amber: { fg: "#ffb000", bg: "#0a0800", prompt: "#cc8800", cursor: "#ffb000" },
  cyan: { fg: "#00d4ff", bg: "#00080a", prompt: "#0099bb", cursor: "#00d4ff" },
  white: { fg: "#e6edf3", bg: "#0d1117", prompt: "#58a6ff", cursor: "#e6edf3" },
  solarized: { fg: "#839496", bg: "#002b36", prompt: "#268bd2", cursor: "#839496" },
  dracula: { fg: "#f8f8f2", bg: "#282a36", prompt: "#bd93f9", cursor: "#f8f8f2" },
};

const TOOLBAR_KEYS = [
  { label: "ESC", key: "ESC" },
  { label: "TAB", key: "\t" },
  { label: "CTRL", key: "CTRL" },
  { label: "ALT", key: "ALT" },
  { label: "↑", key: "UP" },
  { label: "↓", key: "DOWN" },
  { label: "←", key: "LEFT" },
  { label: "→", key: "RIGHT" },
  { label: "F1", key: "F1" },
  { label: "F2", key: "F2" },
  { label: "F5", key: "F5" },
  { label: "F10", key: "F10" },
];

interface Props {
  session: TerminalSession;
  onCommand: (cmd: string) => void;
  onClose: () => void;
}

const SIMULATED_RESPONSES: Record<string, string[]> = {
  ls: ["bin  boot  dev  etc  home  lib  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var"],
  "ls -la": [
    "total 68",
    "drwxr-xr-x 18 root root 4096 Jan  1 00:00 .",
    "drwxr-xr-x 18 root root 4096 Jan  1 00:00 ..",
    "-rw-r--r--  1 root root    0 Jan  1 00:00 .dockerenv",
    "drwxr-xr-x  2 root root 4096 Jan  1 00:00 bin",
    "drwxr-xr-x  2 root root 4096 Jan  1 00:00 etc",
  ],
  pwd: ["/home/ubuntu"],
  whoami: ["ubuntu"],
  "uname -a": ["Linux server 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux"],
  "df -h": [
    "Filesystem      Size  Used Avail Use% Mounted on",
    "/dev/sda1        50G   12G   36G  25% /",
    "tmpfs           2.0G     0  2.0G   0% /dev/shm",
  ],
  top: ["top - 12:00:00 up 5 days,  3:42,  1 user,  load average: 0.05, 0.12, 0.09"],
  date: [new Date().toString()],
};

export function TerminalView({ session, onCommand, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scheme = COLOR_SCHEMES[session.colorScheme];
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const flatRef = useRef<FlatList>(null);

  const prompt = session.status === "connected" ? "" : `${session.status} `;

  const handleSend = () => {
    if (!input.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cmd = input.trim();
    setHistory((h) => [cmd, ...h]);
    setHistIdx(-1);
    onCommand(cmd);
    setInput("");

  };

  const handleToolbarKey = (key: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "UP") {
      const nextIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(nextIdx);
      setInput(history[nextIdx] ?? "");
    } else if (key === "DOWN") {
      const nextIdx = Math.max(histIdx - 1, -1);
      setHistIdx(nextIdx);
      setInput(nextIdx === -1 ? "" : history[nextIdx] ?? "");
    } else if (key === "ESC") {
      onCommand("\u001b");
      setInput("");
    } else if (key === "CTRL") {
      setInput((v) => v + "^");
    } else if (key === "ALT") {
      onCommand("\u001b");
    } else if (key === "UP") {
      onCommand("\u001b[A");
    } else if (key === "DOWN") {
      onCommand("\u001b[B");
    } else if (key === "LEFT") {
      onCommand("\u001b[D");
    } else if (key === "RIGHT") {
      onCommand("\u001b[C");
    } else {
      setInput((v) => v + key);
    }
  };

  const renderLine = ({ item }: { item: TerminalLine }) => {
    return (
      <Text
        style={[
          styles.line,
          {
            color: item.type === "error"
              ? "#ff5555"
              : item.type === "system"
              ? scheme.prompt
              : item.type === "input"
              ? scheme.prompt
              : scheme.fg,
            fontFamily: "monospace",
            fontSize: 13,
          },
        ]}
        selectable
      >
        {item.text}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: scheme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatRef}
        data={session.lines}
        keyExtractor={(item) => item.id}
        renderItem={renderLine}
        contentContainerStyle={styles.lines}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.toolbar, { backgroundColor: scheme.bg, borderTopColor: "#ffffff15" }]}
        contentContainerStyle={styles.toolbarContent}
        keyboardShouldPersistTaps="always"
      >
        {TOOLBAR_KEYS.map((k) => (
          <Pressable
            key={k.label}
            onPress={() => handleToolbarKey(k.key)}
            style={({ pressed }) => [
              styles.toolKey,
              { backgroundColor: pressed ? "#ffffff22" : "#ffffff11", borderColor: "#ffffff22" },
            ]}
          >
            <Text style={[styles.toolKeyText, { color: scheme.fg }]}>{k.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.inputRow, { backgroundColor: scheme.bg, borderTopColor: "#ffffff15", paddingBottom: insets.bottom + 4 }]}>
        <Text style={[styles.promptText, { color: scheme.prompt, fontFamily: "monospace" }]}>
          {prompt}
        </Text>
        <TextInput
          style={[styles.input, { color: scheme.fg, fontFamily: "monospace" }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="send"
          placeholder="Enter command..."
          placeholderTextColor="#ffffff30"
          selectionColor={scheme.cursor}
          blurOnSubmit={false}
        />
        <Pressable onPress={handleSend} style={styles.sendBtn} hitSlop={8}>
          <Feather name="arrow-right" size={20} color={scheme.prompt} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lines: {
    padding: 10,
    paddingBottom: 4,
  },
  line: {
    lineHeight: 20,
  },
  toolbar: {
    maxHeight: 44,
    borderTopWidth: 1,
  },
  toolbarContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    alignItems: "center",
  },
  toolKey: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 40,
    alignItems: "center",
  },
  toolKeyText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    minHeight: 44,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 32,
  },
  sendBtn: {
    padding: 4,
  },
});
