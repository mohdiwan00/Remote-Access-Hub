import React, { useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  Download,
  Fingerprint,
  Github,
  Globe,
  Info,
  List,
  Minimize2,
  Monitor,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Sliders,
  Trash2,
  Tv,
  Type,
  Upload,
  Wifi,
} from "lucide-react";
import { useConnections } from "@/context/ConnectionsContext";
import { useTerminal } from "@/context/TerminalContext";

interface SettingRowProps {
  label: string;
  value?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  onClick?: () => void;
  danger?: boolean;
}

function SettingRow({
  label,
  value,
  icon: Icon,
  iconColor = "#58a6ff",
  toggle,
  toggleValue,
  onToggle,
  onClick,
  danger,
}: SettingRowProps) {
  const color = danger ? "#f85149" : iconColor;
  return (
    <div
      onClick={!toggle ? onClick : undefined}
      role={!toggle && onClick ? "button" : undefined}
      tabIndex={!toggle && onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!toggle && onClick && e.key === "Enter") onClick();
      }}
      className={`flex items-center gap-3 px-3.5 py-3 ${
        !toggle && onClick ? "cursor-pointer hover:bg-[#21262d]/60" : ""
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-[17px] h-[17px]" style={{ color }} />
      </div>
      <span className={`flex-1 text-[15px] ${danger ? "text-[#f85149]" : "text-[#e6edf3]"}`}>
        {label}
      </span>
      {toggle ? (
        <button
          type="button"
          role="switch"
          aria-checked={toggleValue}
          onClick={() => onToggle?.(!toggleValue)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            toggleValue ? "bg-[#58a6ff]" : "bg-[#30363d]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              toggleValue ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      ) : value ? (
        <span className="text-sm text-[#8b949e]">{value}</span>
      ) : onClick ? (
        <ChevronRight className="w-4 h-4 text-[#8b949e]" />
      ) : null}
    </div>
  );
}

interface Props {
  onNotify: (msg: string) => void;
}

export function SettingsTab({ onNotify }: Props) {
  const { connections, clearAllConnections, factoryReset } = useConnections();
  const { colorScheme, fontSize, vimMode } = useTerminal();

  const [biometric, setBiometric] = useState(true);
  const [timeout, setTimeoutVal] = useState("5 minutes");
  const [strictHostKey, setStrictHostKey] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [compression, setCompression] = useState(true);
  const [dlnaServer, setDlnaServer] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"clear" | "reset" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      connections,
      preferences: { biometric, timeout, strictHostKey, auditLog, autoReconnect, compression },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "connectx-settings-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    onNotify("Settings exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onNotify(`Imported backup from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const cycleTimeout = () => {
    const opts = ["1 minute", "5 minutes", "15 minutes", "Never"];
    const next = opts[(opts.indexOf(timeout) + 1) % opts.length];
    setTimeoutVal(next);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#30363d] px-4 py-4 bg-[#0d1117]">
        <h1 className="text-[26px] font-bold tracking-tight text-[#e6edf3]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section className="space-y-1.5">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">SECURITY</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="Biometric Lock" icon={Fingerprint} toggle toggleValue={biometric} onToggle={setBiometric} />
            <SettingRow label="Timeout" icon={Clock} value={timeout} onClick={cycleTimeout} />
            <SettingRow label="Strict Host Key Checking" icon={Shield} toggle toggleValue={strictHostKey} onToggle={setStrictHostKey} />
            <SettingRow label="Connection Audit Log" icon={List} toggle toggleValue={auditLog} onToggle={setAuditLog} />
          </div>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">SSH</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="Auto-Reconnect" icon={RefreshCw} toggle toggleValue={autoReconnect} onToggle={setAutoReconnect} />
            <SettingRow label="Keep-Alive Interval" icon={Activity} value="30s" onClick={() => onNotify("Keep-alive interval is 30s")} />
            <SettingRow label="Compression" icon={Minimize2} toggle toggleValue={compression} onToggle={setCompression} />
            <SettingRow label="Known Hosts" icon={Server} value={`${connections.length} hosts`} onClick={() => onNotify(`${connections.length} configured hosts`)} />
          </div>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">TERMINAL</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="Default Color Scheme" icon={Monitor} value={colorScheme} />
            <SettingRow label="Default Font Size" icon={Type} value={`${fontSize}px`} />
            <SettingRow label="Bell" icon={Bell} value="Silent" />
            <SettingRow label="Vim Mode" icon={Code} value={vimMode ? "On" : "Off"} />
          </div>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">NETWORK</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="Default Proxy" icon={Globe} value="None" />
            <SettingRow label="Tailscale Discovery" icon={Radio} value="Not configured" />
            <SettingRow label="Mosh (UDP)" icon={Wifi} value="Enabled" />
          </div>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">CLOUD</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="rclone Config" icon={Cloud} value="1 provider" />
            <SettingRow label="DLNA Media Server" icon={Tv} toggle toggleValue={dlnaServer} onToggle={setDlnaServer} />
            <SettingRow label="Sync Bandwidth Limit" icon={Sliders} value="Unlimited" />
          </div>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">ABOUT</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="Version" icon={Info} value="1.0.0 (open source)" />
            <SettingRow
              label="Open Source Remote Client"
              icon={Github}
              onClick={() => onNotify("ConnectX SSH / VNC / RDP / SFTP Client")}
            />
            <SettingRow label="Export Settings" icon={Download} onClick={handleExport} />
            <SettingRow label="Import Settings" icon={Upload} onClick={() => fileInputRef.current?.click()} />
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </section>

        <section className="space-y-1.5 pb-6">
          <h2 className="text-[11px] font-bold tracking-wider text-[#8b949e] ml-1">DANGER ZONE</h2>
          <div className="rounded-[14px] border border-[#30363d] bg-[#161b22] divide-y divide-[#30363d] overflow-hidden">
            <SettingRow label="Clear All Connections" icon={Trash2} danger onClick={() => setConfirmAction("clear")} />
            <SettingRow label="Factory Reset" icon={AlertTriangle} danger onClick={() => setConfirmAction("reset")} />
          </div>
        </section>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#e6edf3]">
              {confirmAction === "clear" ? "Clear All Connections" : "Factory Reset"}
            </h3>
            <p className="text-sm text-[#8b949e]">
              {confirmAction === "clear"
                ? "Delete all saved connections?"
                : "Wipe all saved keys and restore default sample connections?"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === "clear") {
                    clearAllConnections();
                    onNotify("All connections cleared");
                  } else {
                    factoryReset();
                    onNotify("Factory reset complete");
                  }
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#f85149] text-white text-sm font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
