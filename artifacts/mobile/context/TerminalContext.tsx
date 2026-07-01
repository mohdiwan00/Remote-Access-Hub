import React, { createContext, useCallback, useContext, useState } from "react";
import type { Connection } from "./ConnectionsContext";

export type ColorScheme = "green" | "amber" | "cyan" | "white" | "solarized" | "dracula";

export interface TerminalSession {
  id: string;
  connectionId: string;
  connectionName: string;
  type: "ssh" | "vnc" | "rdp" | "sftp";
  host: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  lines: TerminalLine[];
  createdAt: number;
  colorScheme: ColorScheme;
}

export interface TerminalLine {
  id: string;
  text: string;
  type: "output" | "input" | "system" | "error";
  timestamp: number;
}

interface TerminalContextType {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  colorScheme: ColorScheme;
  fontSize: number;
  vimMode: boolean;
  openSession: (connection: Connection) => string;
  closeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addLine: (sessionId: string, line: Omit<TerminalLine, "id" | "timestamp">) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setFontSize: (size: number) => void;
  setVimMode: (enabled: boolean) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

const simulateLogin = (conn: Connection): TerminalLine[] => {
  const ts = Date.now();
  return [
    { id: generateId(), text: `Connecting to ${conn.host}:${conn.port}...`, type: "system", timestamp: ts },
    { id: generateId(), text: `SSH-2.0-OpenSSH_9.3`, type: "output", timestamp: ts + 100 },
    { id: generateId(), text: `Authenticating as ${conn.username}...`, type: "system", timestamp: ts + 200 },
    { id: generateId(), text: `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)`, type: "output", timestamp: ts + 400 },
    { id: generateId(), text: ``, type: "output", timestamp: ts + 401 },
    { id: generateId(), text: ` * Documentation:  https://help.ubuntu.com`, type: "output", timestamp: ts + 402 },
    { id: generateId(), text: ` * Management:     https://landscape.canonical.com`, type: "output", timestamp: ts + 403 },
    { id: generateId(), text: ``, type: "output", timestamp: ts + 404 },
    { id: generateId(), text: `Last login: ${new Date(Date.now() - 86400000).toDateString()} from 192.168.1.1`, type: "output", timestamp: ts + 500 },
    { id: generateId(), text: `${conn.username}@${conn.host.replace(/\..*/g, "")}:~$`, type: "output", timestamp: ts + 600 },
  ];
};

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("green");
  const [fontSize, setFontSize] = useState(14);
  const [vimMode, setVimMode] = useState(false);

  const openSession = useCallback((connection: Connection): string => {
    const id = generateId();
    const lines = connection.type === "ssh" ? simulateLogin(connection) : [
      { id: generateId(), text: `Connecting to ${connection.host}:${connection.port}...`, type: "system" as const, timestamp: Date.now() },
      { id: generateId(), text: `Session established.`, type: "system" as const, timestamp: Date.now() + 300 },
    ];
    const session: TerminalSession = {
      id,
      connectionId: connection.id,
      connectionName: connection.name,
      type: connection.type,
      host: connection.host,
      status: "connected",
      lines,
      createdAt: Date.now(),
      colorScheme,
    };
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(id);
    return id;
  }, [colorScheme]);

  const closeSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next;
    });
    setActiveSessionId((prev) => (prev === id ? null : prev));
  }, []);

  const addLine = useCallback((sessionId: string, line: Omit<TerminalLine, "id" | "timestamp">) => {
    const full: TerminalLine = { ...line, id: generateId(), timestamp: Date.now() };
    setSessions((prev) =>
      prev.map((s) => s.id === sessionId ? { ...s, lines: [...s.lines, full] } : s)
    );
  }, []);

  return (
    <TerminalContext.Provider value={{
      sessions, activeSessionId, colorScheme, fontSize, vimMode,
      openSession, closeSession, setActiveSession: setActiveSessionId,
      addLine, setColorScheme, setFontSize, setVimMode,
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error("useTerminal must be used within TerminalProvider");
  return ctx;
}
