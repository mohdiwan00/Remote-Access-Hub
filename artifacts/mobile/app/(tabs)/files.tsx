import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
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
import { FileItem, type FileEntry } from "@/components/FileItem";
import { useColors } from "@/hooks/useColors";
import { useConnections } from "@/context/ConnectionsContext";
import { useAuth } from "@clerk/expo";

const DEMO_FILES: FileEntry[] = [
  { id: "1", name: "home", type: "dir", modified: Date.now() - 86400000 },
  { id: "2", name: "etc", type: "dir", modified: Date.now() - 86400000 * 3 },
  { id: "3", name: "var", type: "dir", modified: Date.now() - 86400000 },
  { id: "4", name: "usr", type: "dir", modified: Date.now() - 86400000 * 7 },
  { id: "5", name: ".bashrc", type: "file", size: 3526, modified: Date.now() - 86400000 * 2 },
  { id: "6", name: ".ssh", type: "dir", modified: Date.now() - 86400000 * 10 },
  { id: "7", name: "server.log", type: "file", size: 1024 * 512, modified: Date.now() - 3600000 },
  { id: "8", name: "app.py", type: "file", size: 8192, modified: Date.now() - 86400000 },
  { id: "9", name: "requirements.txt", type: "file", size: 256, modified: Date.now() - 86400000 * 4 },
  { id: "10", name: "docker-compose.yml", type: "file", size: 1800, modified: Date.now() - 86400000 * 2 },
  { id: "11", name: "README.md", type: "file", size: 4096, modified: Date.now() - 86400000 * 5 },
  { id: "12", name: "data.tar.gz", type: "file", size: 1024 * 1024 * 48, modified: Date.now() - 86400000 * 14 },
  { id: "13", name: "backup", type: "link", modified: Date.now() - 86400000 },
  { id: "14", name: "media", type: "dir", modified: Date.now() - 86400000 * 20 },
];

type View_ = "sftp" | "cloud" | "smb";

const CLOUD_PROVIDERS = [
  { id: "gdrive", name: "Google Drive", icon: "cloud", color: "#4285F4", connected: false },
  { id: "dropbox", name: "Dropbox", icon: "droplet", color: "#0061FF", connected: false },
  { id: "onedrive", name: "OneDrive", icon: "cloud", color: "#0078D4", connected: true },
  { id: "s3", name: "Amazon S3", icon: "database", color: "#FF9900", connected: false },
  { id: "backblaze", name: "Backblaze B2", icon: "hard-drive", color: "#d43f3a", connected: false },
  { id: "wasabi", name: "Wasabi", icon: "server", color: "#00a34e", connected: false },
];

export default function FilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { connections } = useConnections();
  const { getToken } = useAuth();
  const [activeView, setActiveView] = useState<View_>("sftp");
  const [path, setPath] = useState(["/"]);
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [sftpSessionId, setSftpSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const currentPath = "/" + path.slice(1).join("/");
  const connection = connections.find((item) => item.type === "sftp" || item.type === "ssh");
  const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  const authFetch = async (url: string, init?: RequestInit) => {
    const token = await getToken();
    if (!token) throw new Error("Your sign-in session has expired");
    return fetch(url, {
      ...init,
      headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
    });
  };

  const loadFiles = async (sessionId: string, directory: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${apiBase}/api/sftp/list?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(directory)}`);
      const data = await response.json() as { files?: FileEntry[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to list remote files");
      setFiles(data.files ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to list remote files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!connection) {
      setFiles([]);
      setError(null);
      return;
    }
    setLoading(true);
    void authFetch(`${apiBase}/api/sftp/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host: connection.host, port: connection.port, username: connection.username, password: connection.password }),
    }).then(async (response) => {
      const data = await response.json() as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) throw new Error(data.error ?? "Unable to connect to SFTP");
      if (cancelled) return;
      setSftpSessionId(data.sessionId);
      await loadFiles(data.sessionId, "/");
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Unable to connect to SFTP");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      setSftpSessionId((sessionId) => {
        if (sessionId) void authFetch(`${apiBase}/api/sftp/disconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        return null;
      });
    };
  }, [connection?.id]);

  const handleFilePress = (entry: FileEntry) => {
    if (selected.length > 0) {
      toggleSelect(entry.id);
      return;
    }
    if (entry.type === "dir") {
      const nextPath = [...path, entry.name];
      setPath(nextPath);
      if (sftpSessionId) void loadFiles(sftpSessionId, "/" + nextPath.slice(1).join("/"));
    } else {
      Alert.alert(entry.name, `Size: ${entry.size ? (entry.size / 1024).toFixed(1) + " KB" : "--"}\n\nWhat would you like to do?`, [
        { text: "Download", onPress: () => Alert.alert("Download", "Download transport is not available yet.") },
        { text: "Preview", onPress: () => Alert.alert("Preview", "Remote file preview is not available yet.") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const toggleSelect = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBack = () => {
    if (path.length > 1) {
      const nextPath = path.slice(0, -1);
      setPath(nextPath);
      if (sftpSessionId) void loadFiles(sftpSessionId, "/" + nextPath.slice(1).join("/"));
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete", `Delete ${selected.length} item(s)?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        if (!sftpSessionId) return;
        try {
          await Promise.all(selected.map(async (id) => {
            const item = files.find((file) => file.id === id);
            if (!item) return;
            const response = await authFetch(`${apiBase}/api/sftp/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sftpSessionId,
                path: `${currentPath === "/" ? "" : currentPath}/${item.name}`,
                isDir: item.type === "dir",
              }),
            });
            if (!response.ok) {
              const data = await response.json() as { error?: string };
              throw new Error(data.error ?? `Unable to delete ${item.name}`);
            }
          }));
          setSelected([]);
          await loadFiles(sftpSessionId, currentPath);
        } catch (e) {
          Alert.alert("Delete failed", e instanceof Error ? e.message : "Unable to delete selected items");
        }
      } },
    ]);
  };

  const handleNewFolder = () => {
    Alert.prompt("New Folder", "Create a folder at " + currentPath, [
      { text: "Cancel", style: "cancel" },
      { text: "Create", onPress: async (name?: string) => {
        if (!sftpSessionId || !name?.trim()) return;
        const response = await authFetch(`${apiBase}/api/sftp/mkdir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sftpSessionId, path: `${currentPath === "/" ? "" : currentPath}/${name.trim()}` }),
        });
        if (!response.ok) {
          const data = await response.json() as { error?: string };
          Alert.alert("Create folder failed", data.error ?? "Unable to create folder");
          return;
        }
        await loadFiles(sftpSessionId, currentPath);
      } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Files</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={handleNewFolder} hitSlop={8} style={[styles.iconBtn, { borderColor: colors.border }]}>
              <Feather name="folder-plus" size={18} color={colors.mutedForeground} />
            </Pressable>
            <Pressable onPress={() => Alert.alert("Upload", "Select files to upload")} hitSlop={8} style={[styles.iconBtn, { borderColor: colors.border }]}>
              <Feather name="upload" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <View style={styles.viewTabs}>
          {(["sftp", "cloud", "smb"] as View_[]).map((v) => {
            const active = activeView === v;
            const labels: Record<View_, string> = { sftp: "SFTP", cloud: "Cloud", smb: "Network" };
            const icons: Record<View_, string> = { sftp: "folder", cloud: "cloud", smb: "hard-drive" };
            return (
              <Pressable
                key={v}
                onPress={() => setActiveView(v)}
                style={[styles.viewTab, {
                  backgroundColor: active ? colors.primary + "22" : "transparent",
                  borderColor: active ? colors.primary : "transparent",
                }]}
              >
                <Feather name={icons[v] as any} size={14} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.viewTabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {labels[v]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeView === "sftp" && (
        <>
          <View style={[styles.breadcrumb, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbContent}>
              {path.map((segment, i) => (
                <React.Fragment key={i}>
                  <Pressable onPress={() => i < path.length - 1 ? setPath(path.slice(0, i + 1)) : null}>
                    <Text style={[styles.breadcrumbText, {
                      color: i === path.length - 1 ? colors.foreground : colors.mutedForeground,
                      fontWeight: i === path.length - 1 ? "600" : "400",
                    }]}>
                      {segment === "/" ? "root" : segment}
                    </Text>
                  </Pressable>
                  {i < path.length - 1 && (
                    <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
            {path.length > 1 && (
              <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
                <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {selected.length > 0 && (
            <View style={[styles.selectionBar, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.selectionText, { color: colors.primary }]}>{selected.length} selected</Text>
              <View style={styles.selectionActions}>
                <Pressable hitSlop={8} style={styles.selAction} onPress={() => Alert.alert("Download", "Downloading selected files")}>
                  <Feather name="download" size={16} color={colors.primary} />
                </Pressable>
                <Pressable hitSlop={8} style={styles.selAction} onPress={handleDelete}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
                <Pressable hitSlop={8} onPress={() => setSelected([])}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          )}

            {!connection && <EmptyState icon="server" title="No SFTP connection" subtitle="Add an SSH or SFTP connection first" />}
            {connection && error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={{ color: colors.destructive, flex: 1 }}>{error}</Text>
              </View>
            )}
            {connection && loading && <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading remote files…</Text>}
            {connection && !loading && !error && <FlatList
            data={files}
            keyExtractor={(f) => f.id}
            renderItem={({ item }) => (
              <FileItem
                entry={item}
                onPress={() => handleFilePress(item)}
                onLongPress={() => toggleSelect(item.id)}
                selected={selected.includes(item.id)}
              />
            )}
            contentContainerStyle={styles.fileList}
            showsVerticalScrollIndicator={false}
          />
          }
        </>
      )}

      {activeView === "cloud" && (
        <ScrollView contentContainerStyle={styles.cloudList}>
          <Text style={[styles.cloudHint, { color: colors.mutedForeground }]}>
            Connect cloud storage via rclone — 60+ providers supported
          </Text>
          {CLOUD_PROVIDERS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => Alert.alert(p.name, p.connected ? "Browse or disconnect?" : "Connect with OAuth browser flow?", [
                { text: p.connected ? "Browse" : "Connect via Browser", onPress: () => {} },
                { text: p.connected ? "Disconnect" : "Cancel", style: "cancel" },
              ])}
              style={[styles.cloudCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.cloudIcon, { backgroundColor: p.color + "22" }]}>
                <Feather name={p.icon as any} size={22} color={p.color} />
              </View>
              <Text style={[styles.cloudName, { color: colors.foreground }]}>{p.name}</Text>
              <View style={[styles.connBadge, {
                backgroundColor: p.connected ? colors.sftp + "22" : colors.muted,
                borderColor: p.connected ? colors.sftp + "55" : colors.border,
              }]}>
                <View style={[styles.connDot, { backgroundColor: p.connected ? colors.sftp : colors.mutedForeground }]} />
                <Text style={[styles.connText, { color: p.connected ? colors.sftp : colors.mutedForeground }]}>
                  {p.connected ? "Connected" : "Connect"}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {activeView === "smb" && (
        <EmptyState
          icon="hard-drive"
          title="No network shares"
          subtitle="Add a Windows/SMB share or scan your local network to discover shared folders"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 8 },
  headerTop: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 10 },
  title: { flex: 1, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  viewTabs: { flexDirection: "row", marginHorizontal: 16, gap: 6 },
  viewTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  viewTabText: { fontSize: 13, fontWeight: "600" },
  breadcrumb: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, paddingVertical: 8 },
  breadcrumbContent: { paddingHorizontal: 16, gap: 4, alignItems: "center" },
  breadcrumbText: { fontSize: 13, fontFamily: "monospace" },
  backBtn: { padding: 10 },
  selectionBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginTop: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  selectionText: { flex: 1, fontSize: 14, fontWeight: "600" },
  selectionActions: { flexDirection: "row", gap: 16, alignItems: "center" },
  selAction: { padding: 4 },
  fileList: { paddingVertical: 8 },
  loadingText: { textAlign: "center", padding: 24, fontSize: 13 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, margin: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ff555566" },
  cloudList: { padding: 16, gap: 10 },
  cloudHint: { fontSize: 13, marginBottom: 4 },
  cloudCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  cloudIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cloudName: { flex: 1, fontSize: 15, fontWeight: "500" },
  connBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: 12, fontWeight: "600" },
});
