import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useAuth } from "@clerk/expo";
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
  sendInput: (sessionId: string, data: string) => void;
  resize: (sessionId: string, cols: number, rows: number) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function apiWebSocketUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error("EXPO_PUBLIC_DOMAIN is not configured");
  return `${domain.startsWith("https://") ? "wss" : "wss"}://${domain.replace(/^https?:\/\//, "")}/api/ssh/ws`;
}

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("green");
  const [fontSize, setFontSize] = useState(14);
  const [vimMode, setVimMode] = useState(false);
  const sockets = useRef(new Map<string, WebSocket>());

  const openSession = useCallback((connection: Connection): string => {
    const id = generateId();
    const lines: TerminalLine[] = [{
      id: generateId(),
      text: `Connecting to ${connection.host}:${connection.port}...`,
      type: "system",
      timestamp: Date.now(),
    }];
    const session: TerminalSession = {
      id,
      connectionId: connection.id,
      connectionName: connection.name,
      type: connection.type,
      host: connection.host,
      status: "connecting",
      lines,
      createdAt: Date.now(),
      colorScheme,
    };
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(id);

    if (connection.type !== "ssh") {
      setSessions((prev) => prev.map((s) => s.id === id ? {
        ...s,
        status: "error",
        lines: [...s.lines, { id: generateId(), text: `${connection.type.toUpperCase()} sessions are not implemented yet.`, type: "error", timestamp: Date.now() }],
      } : s));
      return id;
    }

    void (async () => {
      const token = await getToken();
      if (!token) {
        setSessions((prev) => prev.map((s) => s.id === id ? {
          ...s, status: "error",
          lines: [...s.lines, { id: generateId(), text: "Your sign-in session has expired. Please sign in again.", type: "error", timestamp: Date.now() }],
        } : s));
        return;
      }
      let socket: WebSocket;
      try {
        const url = new URL(apiWebSocketUrl());
        url.searchParams.set("token", token);
        socket = new WebSocket(url.toString());
      } catch (error) {
        setSessions((prev) => prev.map((s) => s.id === id ? {
          ...s, status: "error",
          lines: [...s.lines, { id: generateId(), text: error instanceof Error ? error.message : "Unable to open WebSocket", type: "error", timestamp: Date.now() }],
        } : s));
        return;
      }
      sockets.current.set(id, socket);
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "connect",
          host: connection.host,
          port: connection.port,
          username: connection.username,
          password: connection.password,
        }));
      };
      socket.onmessage = (event) => {
        let message: { type?: string; data?: string; message?: string };
        try { message = JSON.parse(String(event.data)); } catch { return; }
        setSessions((prev) => prev.map((s) => {
          if (s.id !== id) return s;
          if (message.type === "connected") return { ...s, status: "connected" };
          if (message.type === "connecting") return { ...s, status: "connecting" };
          if (message.type === "output") return {
            ...s,
            lines: [...s.lines, { id: generateId(), text: message.data ?? "", type: "output", timestamp: Date.now() }],
          };
          if (message.type === "error") return {
            ...s,
            status: "error",
            lines: [...s.lines, { id: generateId(), text: message.message ?? "SSH connection failed", type: "error", timestamp: Date.now() }],
          };
          if (message.type === "closed") return { ...s, status: "disconnected" };
          return s;
        }));
      };
      socket.onerror = () => setSessions((prev) => prev.map((s) => s.id === id ? {
        ...s, status: "error",
        lines: [...s.lines, { id: generateId(), text: "WebSocket connection failed. Check the API server URL and network access.", type: "error", timestamp: Date.now() }],
      } : s));
      socket.onclose = () => {
        sockets.current.delete(id);
        setSessions((prev) => prev.map((s) => s.id === id && s.status !== "error" ? { ...s, status: "disconnected" } : s));
      };
    })();
    return id;
  }, [colorScheme, getToken]);

  const closeSession = useCallback((id: string) => {
    sockets.current.get(id)?.close();
    sockets.current.delete(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next;
    });
    setActiveSessionId((prev) => (prev === id ? null : prev));
  }, []);

  const sendInput = useCallback((sessionId: string, data: string) => {
    const socket = sockets.current.get(sessionId);
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "input", data }));
  }, []);

  const resize = useCallback((sessionId: string, cols: number, rows: number) => {
    const socket = sockets.current.get(sessionId);
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "resize", cols, rows }));
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
       addLine, setColorScheme, setFontSize, setVimMode, sendInput, resize,
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
