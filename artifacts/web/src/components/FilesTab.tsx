import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Cloud,
  Code,
  Database,
  Droplet,
  File,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Music,
  RefreshCw,
  Server,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useConnections } from "@/context/ConnectionsContext";

export interface FileEntry {
  id: string;
  name: string;
  type: "file" | "dir" | "link";
  size?: number;
  modified?: number;
  permissions?: string;
}

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

type FileView = "sftp" | "cloud" | "smb";

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

function FileIcon({ entry }: { entry: FileEntry }) {
  if (entry.type === "dir") return <Folder className="w-[18px] h-[18px] text-[#58a6ff]" />;
  if (entry.type === "link") return <File className="w-[18px] h-[18px] text-[#a371f7]" />;
  const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext)) return <ImageIcon className="w-[18px] h-[18px] text-[#3fb950]" />;
  if (["mp4", "mov", "avi"].includes(ext)) return <Video className="w-[18px] h-[18px] text-[#f78166]" />;
  if (["mp3", "wav", "flac"].includes(ext)) return <Music className="w-[18px] h-[18px] text-[#f78166]" />;
  if (["js", "ts", "py", "sh", "json", "yml"].includes(ext)) return <Code className="w-[18px] h-[18px] text-[#d29922]" />;
  if (["txt", "md", "log", "pdf"].includes(ext)) return <FileText className="w-[18px] h-[18px] text-[#8b949e]" />;
  return <File className="w-[18px] h-[18px] text-[#8b949e]" />;
}

interface Props {
  initialConnectionId?: string | null;
  onNotify: (msg: string) => void;
}

export function FilesTab({ initialConnectionId, onNotify }: Props) {
  const {
    connections,
    cloudProviders,
    toggleCloudProvider,
    getPrivateKey,
    setActiveSftpConnectionId,
  } = useConnections();
  const sftpConnections = connections.filter((c) => c.type === "sftp" || c.type === "ssh");

  const [activeView, setActiveView] = useState<FileView>("sftp");
  const [selectedConnId, setSelectedConnId] = useState<string>(
    initialConnectionId ?? sftpConnections[0]?.id ?? "",
  );
  const [path, setPath] = useState<string[]>(["/"]);
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [sftpSessionId, setSftpSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [showMkdir, setShowMkdir] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inspectFile, setInspectFile] = useState<FileEntry | null>(null);

  useEffect(() => {
    if (initialConnectionId) setSelectedConnId(initialConnectionId);
  }, [initialConnectionId]);

  const activeConnection =
    sftpConnections.find((c) => c.id === selectedConnId) ?? sftpConnections[0];
  const currentPath = "/" + path.slice(1).join("/");

  const loadFiles = useCallback(async (sessionId: string, directory: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sftp/list?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(directory)}`,
      );
      const data = (await response.json()) as { files?: FileEntry[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to list remote files");
      setFiles(data.files ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to list remote files");
    } finally {
      setLoading(false);
    }
  }, []);

  const connectSftp = useCallback(async () => {
    if (!activeConnection) return;
    setDemoMode(false);
    setLoading(true);
    setError(null);
    setPath(["/"]);
    setSelected([]);
    try {
      const privateKey = activeConnection.privateKeyId
        ? getPrivateKey(activeConnection.privateKeyId)
        : null;
      const response = await fetch("/api/sftp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: activeConnection.host,
          port: activeConnection.port,
          username: activeConnection.username,
          password: activeConnection.password,
          privateKey: privateKey ?? undefined,
        }),
      });
      const data = (await response.json()) as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? "Unable to connect to SFTP");
      }
      setSftpSessionId(data.sessionId);
      setActiveSftpConnectionId(activeConnection.id);
      await loadFiles(data.sessionId, "/");
    } catch (e) {
      setSftpSessionId(null);
      setActiveSftpConnectionId(null);
      setError(e instanceof Error ? e.message : "Unable to connect to SFTP");
    } finally {
      setLoading(false);
    }
  }, [activeConnection, getPrivateKey, loadFiles, setActiveSftpConnectionId]);

  useEffect(() => {
    let cancelled = false;
    if (!activeConnection || demoMode) return;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const privateKey = activeConnection.privateKeyId
          ? getPrivateKey(activeConnection.privateKeyId)
          : null;
        const response = await fetch("/api/sftp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: activeConnection.host,
            port: activeConnection.port,
            username: activeConnection.username,
            password: activeConnection.password,
            privateKey: privateKey ?? undefined,
          }),
        });
        const data = (await response.json()) as { sessionId?: string; error?: string };
        if (cancelled) return;
        if (!response.ok || !data.sessionId) {
          throw new Error(data.error ?? "Unable to connect to SFTP");
        }
        setSftpSessionId(data.sessionId);
        setActiveSftpConnectionId(activeConnection.id);
        await loadFiles(data.sessionId, "/");
      } catch (e) {
        if (!cancelled) {
          setActiveSftpConnectionId(null);
          setError(e instanceof Error ? e.message : "Unable to connect to SFTP");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConnection?.id]);

  const handleFileClick = (entry: FileEntry) => {
    if (entry.type === "dir") {
      const nextPath = [...path, entry.name];
      setPath(nextPath);
      if (sftpSessionId && !demoMode) {
        void loadFiles(sftpSessionId, "/" + nextPath.slice(1).join("/"));
      }
    } else {
      setInspectFile(entry);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBack = () => {
    if (path.length > 1) {
      const nextPath = path.slice(0, -1);
      setPath(nextPath);
      if (sftpSessionId && !demoMode) {
        void loadFiles(sftpSessionId, "/" + nextPath.slice(1).join("/"));
      }
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (demoMode) {
      setFiles((prev) => [
        { id: String(Date.now()), name: trimmed, type: "dir", modified: Date.now() },
        ...prev,
      ]);
      setShowMkdir(false);
      setNewFolderName("");
      return;
    }
    if (!sftpSessionId) {
      onNotify("Connect to an SFTP server first");
      return;
    }
    try {
      const response = await fetch("/api/sftp/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sftpSessionId,
          path: `${currentPath === "/" ? "" : currentPath}/${trimmed}`,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to create folder");
      setShowMkdir(false);
      setNewFolderName("");
      await loadFiles(sftpSessionId, currentPath);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Create folder failed");
    }
  };

  const handleDeleteSelected = async () => {
    if (demoMode) {
      setFiles((prev) => prev.filter((f) => !selected.includes(f.id)));
      setSelected([]);
      setConfirmDelete(false);
      return;
    }
    if (!sftpSessionId) return;
    try {
      await Promise.all(
        selected.map(async (id) => {
          const item = files.find((f) => f.id === id);
          if (!item) return;
          const response = await fetch("/api/sftp/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sftpSessionId,
              path: `${currentPath === "/" ? "" : currentPath}/${item.name}`,
              isDir: item.type === "dir",
            }),
          });
          if (!response.ok) {
            const data = (await response.json()) as { error?: string };
            throw new Error(data.error ?? `Unable to delete ${item.name}`);
          }
        }),
      );
      setSelected([]);
      setConfirmDelete(false);
      await loadFiles(sftpSessionId, currentPath);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Delete failed");
      setConfirmDelete(false);
    }
  };

  const renderCloudIcon = (type: string, color: string) => {
    const props = { className: "w-5 h-5", style: { color } };
    if (type === "dropbox") return <Droplet {...props} />;
    if (type === "s3") return <Database {...props} />;
    if (type === "backblaze") return <HardDrive {...props} />;
    if (type === "wasabi") return <Server {...props} />;
    return <Cloud {...props} />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#30363d] px-4 pt-4 pb-3 space-y-3 bg-[#0d1117]">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-[#e6edf3]">Files</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMkdir(true)}
              className="w-9 h-9 rounded-[10px] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
              title="New folder"
            >
              <FolderPlus className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => onNotify("Select an active SFTP session to upload files")}
              className="w-9 h-9 rounded-[10px] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
              title="Upload file"
            >
              <Upload className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: "sftp", label: "SFTP", icon: Folder },
            { id: "cloud", label: "Cloud", icon: Cloud },
            { id: "smb", label: "Network", icon: HardDrive },
          ] as const).map((tab) => {
            const active = activeView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-[10px] border text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-[#58a6ff]/15 border-[#58a6ff] text-[#58a6ff]"
                    : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeView === "sftp" && (
        <div className="flex-1 flex flex-col min-h-0">
          {sftpConnections.length > 0 && (
            <div className="border-b border-[#30363d] px-4 py-2 flex items-center gap-2 bg-[#161b22]/60">
              <select
                value={activeConnection?.id ?? ""}
                onChange={(e) => {
                  setDemoMode(false);
                  setSelectedConnId(e.target.value);
                }}
                className="flex-1 rounded-lg border border-[#30363d] bg-[#21262d] px-2.5 py-1.5 text-xs font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
              >
                {sftpConnections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.username}@{c.host}:{c.port})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void connectSftp()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#30363d] bg-[#21262d] text-xs text-[#e6edf3] hover:border-[#58a6ff]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Reconnect</span>
              </button>
            </div>
          )}

          <div className="border-b border-[#30363d] px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto font-mono text-[13px]">
              {path.map((segment, i) => (
                <React.Fragment key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      if (i < path.length - 1) {
                        const nextPath = path.slice(0, i + 1);
                        setPath(nextPath);
                        if (sftpSessionId && !demoMode) {
                          void loadFiles(sftpSessionId, "/" + nextPath.slice(1).join("/"));
                        }
                      }
                    }}
                    className={
                      i === path.length - 1
                        ? "text-[#e6edf3] font-semibold"
                        : "text-[#8b949e] hover:text-[#e6edf3]"
                    }
                  >
                    {segment === "/" ? "root" : segment}
                  </button>
                  {i < path.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-[#8b949e]" />}
                </React.Fragment>
              ))}
            </div>
            {path.length > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <div className="mx-3 mt-2 px-3.5 py-2 rounded-xl border border-[#58a6ff]/40 bg-[#58a6ff]/15 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#58a6ff]">{selected.length} selected</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[#f85149] hover:opacity-80"
                  title="Delete selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-[#8b949e] hover:text-[#e6edf3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!activeConnection && !demoMode && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Server className="w-8 h-8 text-[#8b949e] mb-3" />
                <p className="text-base font-semibold text-[#e6edf3]">No SFTP connection</p>
                <p className="text-sm text-[#8b949e] mt-1">
                  Add an SSH or SFTP connection first
                </p>
              </div>
            )}

            {activeConnection && error && !demoMode && (
              <div className="m-2 p-4 rounded-xl border border-[#f85149]/40 bg-[#f85149]/10 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0 mt-0.5" />
                  <div className="text-sm text-[#f85149] flex-1">
                    <p className="font-semibold">SFTP Connection Error</p>
                    <p className="text-xs opacity-90 mt-0.5 font-mono">{error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDemoMode(true);
                    setError(null);
                    setFiles(DEMO_FILES);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22] text-xs font-semibold text-[#e6edf3] hover:border-[#58a6ff]"
                >
                  Preview Sample Directory
                </button>
              </div>
            )}

            {loading && (
              <p className="text-center py-8 text-sm text-[#8b949e]">Loading remote files…</p>
            )}

            {!loading && (!error || demoMode) && (files.length > 0 || demoMode) &&
              files.map((entry) => {
                const isSel = selected.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      isSel
                        ? "bg-[#58a6ff]/15 border-[#58a6ff]/40"
                        : "border-transparent hover:bg-[#161b22]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelect(entry.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSel
                          ? "bg-[#58a6ff] border-[#58a6ff] text-white"
                          : "border-[#30363d] text-transparent hover:border-[#8b949e]"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileClick(entry)}
                      className="flex-1 flex items-center gap-3 min-w-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                        <FileIcon entry={entry} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            entry.type === "dir" ? "text-[#58a6ff]" : "text-[#e6edf3]"
                          }`}
                        >
                          {entry.name}
                          {entry.type === "link" ? " →" : ""}
                        </p>
                        <p className="text-[11px] font-mono text-[#8b949e]">
                          {entry.type !== "dir" ? `${formatSize(entry.size)}  •  ` : ""}
                          {formatDate(entry.modified)}
                        </p>
                      </div>
                      {entry.type === "dir" && <ChevronRight className="w-4 h-4 text-[#8b949e]" />}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeView === "cloud" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <p className="text-[13px] text-[#8b949e] mb-2">
            Connect cloud storage via rclone — 60+ providers supported
          </p>
          {cloudProviders.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                toggleCloudProvider(p.id);
                onNotify(`${p.name} ${p.connected ? "disconnected" : "connected"}`);
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-[#30363d] bg-[#161b22] p-3.5 hover:border-[#58a6ff]/50 transition-colors text-left"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${p.color}22` }}
              >
                {renderCloudIcon(p.type, p.color)}
              </div>
              <span className="flex-1 text-[15px] font-medium text-[#e6edf3]">{p.name}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                  p.connected
                    ? "bg-[#3fb950]/15 border-[#3fb950]/40 text-[#3fb950]"
                    : "bg-[#1f2937] border-[#30363d] text-[#8b949e]"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: p.connected ? "#3fb950" : "#8b949e" }}
                />
                {p.connected ? "Connected" : "Connect"}
              </span>
            </button>
          ))}
        </div>
      )}

      {activeView === "smb" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
            <HardDrive className="w-7 h-7 text-[#8b949e]" />
          </div>
          <p className="text-base font-semibold text-[#e6edf3] mb-1">No network shares</p>
          <p className="text-sm text-[#8b949e] max-w-xs">
            Add a Windows/SMB share or tunnel via SSH to browse shared network folders
          </p>
        </div>
      )}

      {showMkdir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#e6edf3]">New Folder</h3>
            <p className="text-xs font-mono text-[#8b949e]">Create folder at {currentPath}</p>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="folder-name"
              autoFocus
              className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMkdir(false)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#58a6ff] text-white text-sm font-semibold"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#e6edf3]">Delete Files</h3>
            <p className="text-sm text-[#8b949e]">Delete {selected.length} selected item(s)?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3]"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteSelected()}
                className="px-4 py-2 rounded-lg bg-[#f85149] text-white text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#e6edf3] truncate">{inspectFile.name}</h3>
              <button onClick={() => setInspectFile(null)} className="text-[#8b949e]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 font-mono text-xs space-y-1">
              <p className="text-[#8b949e]">
                Size: <span className="text-[#e6edf3]">{formatSize(inspectFile.size)}</span>
              </p>
              <p className="text-[#8b949e]">
                Modified: <span className="text-[#e6edf3]">{formatDate(inspectFile.modified)}</span>
              </p>
              {inspectFile.permissions && (
                <p className="text-[#8b949e]">
                  Permissions: <span className="text-[#e6edf3]">{inspectFile.permissions}</span>
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setInspectFile(null)}
                className="px-4 py-2 rounded-lg bg-[#58a6ff] text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
