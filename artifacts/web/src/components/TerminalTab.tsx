import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, SlidersHorizontal, Terminal, X } from "lucide-react";
import { useTerminal, type ColorScheme } from "@/context/TerminalContext";

const SCHEME_LABELS: Record<ColorScheme, string> = {
  green: "Green",
  amber: "Amber",
  cyan: "Cyan",
  white: "White",
  solarized: "Solarized",
  dracula: "Dracula",
};

const SCHEME_PALETTES: Record<
  ColorScheme,
  { fg: string; bg: string; prompt: string; accent: string }
> = {
  green: { fg: "#33ff33", bg: "#0a0a0a", prompt: "#00cc00", accent: "#33ff33" },
  amber: { fg: "#ffb000", bg: "#0a0800", prompt: "#cc8800", accent: "#ffb000" },
  cyan: { fg: "#00d4ff", bg: "#00080a", prompt: "#0099bb", accent: "#00d4ff" },
  white: { fg: "#e6edf3", bg: "#0d1117", prompt: "#58a6ff", accent: "#e6edf3" },
  solarized: { fg: "#839496", bg: "#002b36", prompt: "#268bd2", accent: "#839496" },
  dracula: { fg: "#f8f8f2", bg: "#282a36", prompt: "#bd93f9", accent: "#bd93f9" },
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
  { label: "F1", key: "\u001bOP" },
  { label: "F2", key: "\u001bOQ" },
  { label: "F5", key: "\u001b[15~" },
  { label: "F10", key: "\u001b[21~" },
];

export function TerminalTab() {
  const {
    sessions,
    activeSessionId,
    colorScheme,
    fontSize,
    vimMode,
    closeSession,
    setActiveSession,
    sendInput,
    addLine,
    setColorScheme,
    setFontSize,
    setVimMode,
  } = useTerminal();

  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const scheme = SCHEME_PALETTES[activeSession?.colorScheme ?? colorScheme];

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeSession?.lines.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeSessionId || !input.trim()) return;
    const cmd = input;
    setHistory((h) => [cmd, ...h]);
    setHistIdx(-1);
    if (activeSession?.status === "connected") {
      sendInput(activeSessionId, `${cmd}\n`);
    } else {
      addLine(activeSessionId, { text: `$ ${cmd}`, type: "input" });
      addLine(activeSessionId, {
        text: `Session is ${activeSession?.status ?? "disconnected"}. Connect to an accessible SSH host to execute remote commands.`,
        type: "system",
      });
    }
    setInput("");
  };

  const handleToolbarKey = (key: string) => {
    if (!activeSessionId) return;
    if (key === "UP") {
      const nextIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(nextIdx);
      setInput(history[nextIdx] ?? "");
    } else if (key === "DOWN") {
      const nextIdx = Math.max(histIdx - 1, -1);
      setHistIdx(nextIdx);
      setInput(nextIdx === -1 ? "" : (history[nextIdx] ?? ""));
    } else if (key === "ESC") {
      sendInput(activeSessionId, "\u001b");
      setInput("");
    } else if (key === "CTRL") {
      setInput((v) => v + "^");
    } else if (key === "ALT") {
      sendInput(activeSessionId, "\u001b");
    } else if (key === "LEFT") {
      sendInput(activeSessionId, "\u001b[D");
    } else if (key === "RIGHT") {
      sendInput(activeSessionId, "\u001b[C");
    } else {
      sendInput(activeSessionId, key);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-[#30363d] px-4 py-4">
          <h1 className="text-[26px] font-bold tracking-tight text-[#e6edf3]">Terminal</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
            <Terminal className="w-7 h-7 text-[#8b949e]" />
          </div>
          <p className="text-base font-semibold text-[#e6edf3] mb-1">No active sessions</p>
          <p className="text-sm text-[#8b949e] max-w-xs">
            Connect to an SSH server from the Connections tab to open an interactive terminal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#30363d] px-3 py-2 flex items-center gap-2 bg-[#0d1117]">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {sessions.map((s) => {
            const active = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActiveSession(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] font-medium cursor-pointer shrink-0 max-w-[180px] ${
                  active
                    ? "bg-[#161b22] border-[#58a6ff] text-[#e6edf3]"
                    : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      s.status === "connected"
                        ? "#3fb950"
                        : s.status === "connecting"
                        ? "#d29922"
                        : "#f85149",
                  }}
                />
                <span className="truncate">{s.connectionName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmCloseId(s.id);
                  }}
                  className="text-[#8b949e] hover:text-[#e6edf3]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg border transition-colors ${
            showSettings
              ? "border-[#58a6ff] text-[#58a6ff] bg-[#58a6ff]/10"
              : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
          }`}
          title="Terminal appearance"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-[#8b949e] mb-2">COLOR SCHEME</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(Object.keys(SCHEME_LABELS) as ColorScheme[]).map((s) => {
                const active = colorScheme === s;
                const dotColor = SCHEME_PALETTES[s].accent;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setColorScheme(s)}
                    style={{
                      backgroundColor: active ? `${dotColor}22` : "#21262d",
                      borderColor: active ? dotColor : "#30363d",
                      color: active ? dotColor : "#8b949e",
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                    <span>{SCHEME_LABELS[s]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold tracking-wider text-[#8b949e]">
              FONT SIZE: {fontSize}px
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="w-7 h-7 rounded-lg border border-[#30363d] bg-[#21262d] flex items-center justify-center text-[#e6edf3]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="w-7 h-7 rounded-lg border border-[#30363d] bg-[#21262d] flex items-center justify-center text-[#e6edf3]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setVimMode(!vimMode)}
                className={`px-3 py-1 rounded-lg border text-xs font-bold tracking-wider ${
                  vimMode
                    ? "border-[#58a6ff] bg-[#58a6ff]/15 text-[#58a6ff]"
                    : "border-[#30363d] bg-[#21262d] text-[#8b949e]"
                }`}
              >
                VIM
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSession ? (
        <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: scheme.bg }}>
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto p-3 font-mono whitespace-pre-wrap break-all"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
          >
            {activeSession.lines.map((line) => (
              <div
                key={line.id}
                style={{
                  color:
                    line.type === "error"
                      ? "#ff5555"
                      : line.type === "system" || line.type === "input"
                      ? scheme.prompt
                      : scheme.fg,
                }}
              >
                {line.text}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto">
            {TOOLBAR_KEYS.map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={() => handleToolbarKey(k.key)}
                style={{ color: scheme.fg }}
                className="px-2.5 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/15 text-[11px] font-semibold tracking-wider shrink-0"
              >
                {k.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-white/10 px-3 py-2 flex items-center gap-2"
          >
            <span className="font-mono text-xs shrink-0" style={{ color: scheme.prompt }}>
              {activeSession.status === "connected" ? "$" : `[${activeSession.status}]`}
            </span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  handleToolbarKey("UP");
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  handleToolbarKey("DOWN");
                }
              }}
              placeholder="Enter command..."
              autoComplete="off"
              spellCheck={false}
              style={{ color: scheme.fg }}
              className="flex-1 bg-transparent font-mono text-sm placeholder-white/25 focus:outline-none"
            />
            <button
              type="submit"
              style={{ color: scheme.prompt }}
              className="p-1.5 rounded-lg hover:bg-white/10"
              title="Send command"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-base font-semibold text-[#e6edf3]">Select a session</p>
          <p className="text-sm text-[#8b949e]">Click a tab above to view that terminal</p>
        </div>
      )}

      {confirmCloseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#e6edf3]">Close Session</h3>
            <p className="text-sm text-[#8b949e]">
              Disconnect and close this terminal session?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmCloseId(null)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3] hover:bg-[#21262d]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  closeSession(confirmCloseId);
                  setConfirmCloseId(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#f85149] text-white text-sm font-semibold hover:bg-[#e0433c]"
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
