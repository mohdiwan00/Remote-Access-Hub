import React, { useState } from "react";
import { Folder, Key, Server, Settings, Terminal } from "lucide-react";
import { ConnectionsProvider } from "@/context/ConnectionsContext";
import { TerminalProvider, useTerminal } from "@/context/TerminalContext";
import { ConnectionsTab } from "@/components/ConnectionsTab";
import { TerminalTab } from "@/components/TerminalTab";
import { FilesTab } from "@/components/FilesTab";
import { KeysTab } from "@/components/KeysTab";
import { SettingsTab } from "@/components/SettingsTab";

type TabId = "connections" | "terminal" | "files" | "keys" | "settings";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "connections", label: "Connections", icon: Server },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "files", label: "Files", icon: Folder },
  { id: "keys", label: "Keys", icon: Key },
  { id: "settings", label: "Settings", icon: Settings },
];

function ConnectXShell() {
  const { sessions } = useTerminal();
  const [activeTab, setActiveTab] = useState<TabId>("connections");
  const [sftpConnectionId, setSftpConnectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const handleNavigate = (tab: TabId, connId?: string) => {
    if (connId) setSftpConnectionId(connId);
    setActiveTab(tab);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 flex-col border-r border-[#30363d] bg-[#161b22] shrink-0">
        <div className="px-4 py-4 border-b border-[#30363d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/15 border border-[#58a6ff]/30 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#58a6ff]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#e6edf3] leading-tight">ConnectX</p>
            <p className="text-[11px] text-[#8b949e]">SSH • VNC • RDP • SFTP</p>
          </div>
        </div>
        <nav className="flex-1 p-2.5 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#58a6ff]/15 text-[#58a6ff]"
                    : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.id === "terminal" && sessions.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#3fb950]/20 text-[#3fb950] text-[10px] font-bold">
                    {sessions.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "connections" && <ConnectionsTab onNavigateTab={handleNavigate} />}
          {activeTab === "terminal" && <TerminalTab />}
          {activeTab === "files" && (
            <FilesTab initialConnectionId={sftpConnectionId} onNotify={notify} />
          )}
          {activeTab === "keys" && <KeysTab onNotify={notify} />}
          {activeTab === "settings" && <SettingsTab onNotify={notify} />}
        </div>

        {toast && (
          <div className="absolute bottom-4 right-4 z-50 px-4 py-2.5 rounded-xl border border-[#30363d] bg-[#161b22] text-sm text-[#e6edf3] shadow-xl">
            {toast}
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden border-t border-[#30363d] bg-[#161b22] grid grid-cols-5 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold ${
                active ? "text-[#58a6ff]" : "text-[#8b949e]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.id === "terminal" && sessions.length > 0 && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-[#3fb950]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ConnectionsProvider>
      <TerminalProvider>
        <ConnectXShell />
      </TerminalProvider>
    </ConnectionsProvider>
  );
}
