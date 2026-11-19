import React, { useState } from "react";
import { Eye, EyeOff, Folder, LayoutGrid, Monitor, Terminal, X } from "lucide-react";
import { useConnections, type Connection, type ConnectionType } from "@/context/ConnectionsContext";

const CONNECTION_TYPES: {
  type: ConnectionType;
  label: string;
  defaultPort: number;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}[] = [
  { type: "ssh", label: "SSH", defaultPort: 22, color: "#58a6ff", icon: Terminal },
  { type: "vnc", label: "VNC", defaultPort: 5900, color: "#a371f7", icon: Monitor },
  { type: "rdp", label: "RDP", defaultPort: 3389, color: "#f78166", icon: LayoutGrid },
  { type: "sftp", label: "SFTP", defaultPort: 22, color: "#3fb950", icon: Folder },
];

interface Props {
  initial?: Connection | null;
  onSave: (conn: Omit<Connection, "id">) => void;
  onCancel: () => void;
}

export function ConnectionFormModal({ initial, onSave, onCancel }: Props) {
  const { keys } = useConnections();
  const [type, setType] = useState<ConnectionType>(initial?.type ?? "ssh");
  const [name, setName] = useState(initial?.name ?? "");
  const [host, setHost] = useState(initial?.host ?? "");
  const [port, setPort] = useState(String(initial?.port ?? 22));
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [privateKeyId, setPrivateKeyId] = useState(initial?.privateKeyId ?? "");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !host.trim() || !username.trim()) return;
    onSave({
      type,
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port, 10) || selectedTypeInfo.defaultPort,
      username: username.trim(),
      password: useKey ? undefined : password,
      privateKeyId: useKey ? privateKeyId || undefined : undefined,
      group: group.trim() || undefined,
      proxyJump: proxyJump.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#30363d]">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1f2937]"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-[17px] font-semibold text-[#e6edf3]">
            {initial?.id ? "Edit Connection" : "New Connection"}
          </h2>
          <button
            type="submit"
            disabled={!name.trim() || !host.trim() || !username.trim()}
            className="px-4 py-1.5 rounded-full bg-[#58a6ff] text-white text-sm font-semibold hover:bg-[#4c96eb] disabled:opacity-50"
          >
            Save
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-5">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#8b949e] mb-2 px-1">TYPE</p>
            <div className="grid grid-cols-4 gap-2.5">
              {CONNECTION_TYPES.map((t) => {
                const active = t.type === type;
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleTypeChange(t.type)}
                    style={{
                      backgroundColor: active ? `${t.color}22` : "#161b22",
                      borderColor: active ? t.color : "#30363d",
                      color: active ? t.color : "#8b949e",
                    }}
                    className="flex flex-col items-center py-3 rounded-xl border-[1.5px] gap-1.5 transition-colors"
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#8b949e] mb-2 px-1">CONNECTION</p>
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d]">
              <div className="p-3.5 space-y-1.5">
                <label className="block text-xs font-semibold text-[#8b949e]">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Server"
                  required
                  className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder-[#8b949e]/60 focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              <div className="p-3.5 space-y-1.5">
                <label className="block text-xs font-semibold text-[#8b949e]">Hostname / IP</label>
                <input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="192.168.1.1"
                  required
                  className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder-[#8b949e]/60 focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              <div className="p-3.5 space-y-1.5">
                <label className="block text-xs font-semibold text-[#8b949e]">Port</label>
                <input
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  type="number"
                  min={1}
                  max={65535}
                  className="w-28 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#8b949e] mb-2 px-1">CREDENTIALS</p>
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d]">
              <div className="p-3.5 space-y-1.5">
                <label className="block text-xs font-semibold text-[#8b949e]">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ubuntu"
                  required
                  className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder-[#8b949e]/60 focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              {(type === "ssh" || type === "sftp") && (
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8b949e]">Use SSH Key</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useKey}
                    onClick={() => setUseKey(!useKey)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useKey ? "bg-[#58a6ff]" : "bg-[#30363d]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useKey ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}
              {useKey ? (
                <div className="p-3.5 space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8b949e]">Select Key</label>
                  {keys.length === 0 ? (
                    <p className="text-xs text-[#8b949e]">No SSH keys generated yet. Generate one in the Keys tab.</p>
                  ) : (
                    <select
                      value={privateKeyId}
                      onChange={(e) => setPrivateKeyId(e.target.value)}
                      className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
                    >
                      <option value="">-- Choose an SSH key --</option>
                      {keys.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="p-3.5 space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8b949e]">Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="flex-1 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder-[#8b949e]/60 focus:outline-none focus:border-[#58a6ff]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#8b949e] mb-2 px-1">ADVANCED</p>
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d]">
              <div className="p-3.5 space-y-1.5">
                <label className="block text-xs font-semibold text-[#8b949e]">Group / Label</label>
                <input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Work"
                  className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder-[#8b949e]/60 focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              {type === "ssh" && (
                <div className="p-3.5 space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8b949e]">ProxyJump</label>
                  <input
                    value={proxyJump}
                    onChange={(e) => setProxyJump(e.target.value)}
                    placeholder="bastion@192.168.0.1"
                    className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder-[#8b949e]/60 focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
