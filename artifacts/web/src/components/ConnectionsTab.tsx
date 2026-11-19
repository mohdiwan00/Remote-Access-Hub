import React, { useState } from "react";
import { Edit2, Folder, LayoutGrid, Monitor, Plus, Search, Server, Terminal, Trash2, X, XCircle } from "lucide-react";
import { useConnections, type Connection, type ConnectionType } from "@/context/ConnectionsContext";
import { useTerminal } from "@/context/TerminalContext";
import { ConnectionFormModal } from "./ConnectionFormModal";

const TYPE_FILTERS: { type: ConnectionType | "all"; label: string; color: string }[] = [
  { type: "all", label: "All", color: "#58a6ff" },
  { type: "ssh", label: "SSH", color: "#58a6ff" },
  { type: "vnc", label: "VNC", color: "#a371f7" },
  { type: "rdp", label: "RDP", color: "#f78166" },
  { type: "sftp", label: "SFTP", color: "#3fb950" },
];

function getTypeColor(type: ConnectionType): string {
  switch (type) {
    case "ssh": return "#58a6ff";
    case "vnc": return "#a371f7";
    case "rdp": return "#f78166";
    case "sftp": return "#3fb950";
  }
}

function TypeIcon({ type, color }: { type: ConnectionType; color: string }) {
  const props = { className: "w-5 h-5", style: { color } };
  switch (type) {
    case "ssh": return <Terminal {...props} />;
    case "vnc": return <Monitor {...props} />;
    case "rdp": return <LayoutGrid {...props} />;
    case "sftp": return <Folder {...props} />;
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
  onNavigateTab: (tab: "connections" | "terminal" | "files" | "keys" | "settings", sftpConnectionId?: string) => void;
}

export function ConnectionsTab({ onNavigateTab }: Props) {
  const {
    connections,
    activeSftpConnectionId,
    addConnection,
    updateConnection,
    deleteConnection,
    setLastConnected,
  } = useConnections();
  const { sessions, openSession, setActiveSession } = useTerminal();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConnectionType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Connection | null>(null);
  const [remoteViewerConn, setRemoteViewerConn] = useState<Connection | null>(null);

  const getConnectionStatus = (conn: Connection): "active" | "connecting" | "offline" => {
    const connSessions = sessions.filter((s) => s.connectionId === conn.id);
    if (connSessions.some((s) => s.status === "connected") || activeSftpConnectionId === conn.id) {
      return "active";
    }
    if (connSessions.some((s) => s.status === "connecting")) {
      return "connecting";
    }
    return "offline";
  };

  const filtered = connections.filter((c) => {
    const matchType = filter === "all" || c.type === filter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.host.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      (c.group?.toLowerCase().includes(q) ?? false);
    return matchType && matchSearch;
  });

  const handleConnect = (conn: Connection) => {
    setLastConnected(conn.id);
    if (conn.type === "ssh") {
      const existing = sessions.find(
        (s) => s.connectionId === conn.id && (s.status === "connected" || s.status === "connecting"),
      );
      if (existing) {
        setActiveSession(existing.id);
      } else {
        openSession(conn);
      }
      onNavigateTab("terminal");
    } else if (conn.type === "sftp") {
      onNavigateTab("files", conn.id);
    } else {
      setRemoteViewerConn(conn);
    }
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

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#30363d] px-4 pt-4 pb-3 space-y-3 bg-[#0d1117]">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-[#e6edf3]">ConnectX</h1>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#58a6ff] text-white text-sm font-semibold hover:bg-[#4c96eb] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[#30363d] bg-[#21262d] px-3 py-2 focus-within:border-[#58a6ff] transition-colors">
          <Search className="w-4 h-4 text-[#8b949e] shrink-0" />
          <input
            type="search"
            aria-label="Filter saved connections by name or host"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && search) setSearch("");
            }}
            placeholder="Filter by name, host, or user..."
            className="flex-1 bg-transparent text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="text-[#8b949e] hover:text-[#e6edf3]"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {TYPE_FILTERS.map((f) => {
              const active = filter === f.type;
              return (
                <button
                  key={f.type}
                  onClick={() => setFilter(f.type)}
                  style={{
                    backgroundColor: active ? `${f.color}22` : "transparent",
                    borderColor: active ? f.color : "#30363d",
                    color: active ? f.color : "#8b949e",
                  }}
                  className="px-3.5 py-1.5 rounded-full border text-[13px] font-semibold transition-colors shrink-0"
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          {(search.trim() || filter !== "all") && (
            <span className="text-xs font-mono text-[#8b949e] shrink-0">
              {filtered.length}/{connections.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
              <Server className="w-7 h-7 text-[#8b949e]" />
            </div>
            <p className="text-base font-semibold text-[#e6edf3] mb-1">
              {search.trim() || filter !== "all" ? "No matching connections" : "No connections yet"}
            </p>
            <p className="text-sm text-[#8b949e] max-w-xs mb-4">
              {search.trim() || filter !== "all"
                ? "Try a different name, host, or protocol filter"
                : "Click New to add your first SSH, VNC, RDP or SFTP connection"}
            </p>
            {(search.trim() || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="px-3.5 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22] text-xs font-semibold text-[#e6edf3] hover:border-[#58a6ff]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((conn) => {
            const tColor = getTypeColor(conn.type);
            const connStatus = getConnectionStatus(conn);
            const statusDotColor =
              connStatus === "active"
                ? "#3fb950"
                : connStatus === "connecting"
                ? "#d29922"
                : "#f85149";
            const statusLabel =
              connStatus === "active"
                ? "Active"
                : connStatus === "connecting"
                ? "Connecting"
                : "Offline";
            return (
              <div
                key={conn.id}
                onClick={() => handleConnect(conn)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleConnect(conn)}
                className="group flex items-center rounded-xl border border-[#30363d] bg-[#161b22] hover:border-[#58a6ff]/60 transition-all cursor-pointer overflow-hidden"
              >
                <div className="w-[3px] self-stretch shrink-0" style={{ backgroundColor: tColor }} />
                <div className="p-3.5 shrink-0">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${tColor}22` }}
                  >
                    <TypeIcon type={conn.type} color={tColor} />
                  </div>
                </div>
                <div className="flex-1 py-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      title={`Session status: ${statusLabel}`}
                      aria-label={`Session status: ${statusLabel}`}
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        connStatus === "connecting" ? "animate-pulse" : ""
                      }`}
                      style={{ backgroundColor: statusDotColor }}
                    />
                    <p className="text-[15px] font-semibold text-[#e6edf3] truncate">{conn.name}</p>
                    <span
                      className="text-[11px] font-medium shrink-0"
                      style={{ color: statusDotColor }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#8b949e] truncate mt-0.5">
                    {conn.username}@{conn.host}:{conn.port}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span
                      style={{
                        backgroundColor: `${tColor}22`,
                        borderColor: `${tColor}44`,
                        color: tColor,
                      }}
                      className="px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider"
                    >
                      {conn.type.toUpperCase()}
                    </span>
                    {conn.group && (
                      <span className="px-2 py-0.5 rounded border border-[#30363d] bg-[#1f2937] text-[10px] font-bold tracking-wider text-[#8b949e]">
                        {conn.group}
                      </span>
                    )}
                    <span className="text-[11px] text-[#8b949e] ml-0.5">
                      {timeAgo(conn.lastConnected)}
                    </span>
                  </div>
                </div>
                <div
                  className="flex flex-col gap-2.5 p-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(conn);
                      setShowForm(true);
                    }}
                    title="Edit connection"
                    className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(conn)}
                    title="Delete connection"
                    className="p-1.5 rounded-lg text-[#f85149] hover:bg-[#f85149]/15"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <ConnectionFormModal
          initial={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#e6edf3]">Delete Connection</h3>
            <p className="text-sm text-[#8b949e]">
              Remove <span className="text-[#e6edf3] font-medium">"{confirmDelete.name}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3] hover:bg-[#21262d]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteConnection(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#f85149] text-white text-sm font-semibold hover:bg-[#e0433c]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {remoteViewerConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#e6edf3]">
                {remoteViewerConn.type.toUpperCase()} Desktop Session
              </h3>
              <button
                onClick={() => setRemoteViewerConn(null)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-[#e6edf3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3.5 space-y-1.5 font-mono text-xs">
              <p className="text-[#e6edf3]">
                <span className="text-[#8b949e]">Host:</span> {remoteViewerConn.host}:{remoteViewerConn.port}
              </p>
              <p className="text-[#e6edf3]">
                <span className="text-[#8b949e]">User:</span> {remoteViewerConn.username}
              </p>
              <p className="text-[#e6edf3]">
                <span className="text-[#8b949e]">Protocol:</span> {remoteViewerConn.type.toUpperCase()}
              </p>
            </div>
            <p className="text-sm text-[#8b949e]">
              {remoteViewerConn.type.toUpperCase()} framebuffer streaming requires a native desktop viewer or SSH tunnel bridge. You can still manage credentials, SSH tunnels, and terminal/SFTP sessions directly in ConnectX.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRemoteViewerConn(null)}
                className="px-4 py-2 rounded-lg bg-[#58a6ff] text-white text-sm font-semibold hover:bg-[#4c96eb]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
