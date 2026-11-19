import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useConnections, type Connection } from "./ConnectionsContext";

export type ColorScheme = "green" | "amber" | "cyan" | "white" | "solarized" | "dracula";

export interface TerminalLine {
  id: string;
  text: string;
  type: "output" | "input" | "system" | "error";
  timestamp: number;
}

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

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ssh/ws`;
}

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const { getPrivateKey } = useConnections();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("green");
  const [fontSize, setFontSize] = useState(14);
  const [vimMode, setVimMode] = useState(false);
  const sockets = useRef(new Map<string, WebSocket>());

  const openSession = useCallback(
    (connection: Connection): string => {
      const id = generateId();
      const lines: TerminalLine[] = [
        {
          id: generateId(),
          text: `Connecting to ${connection.username}@${connection.host}:${connection.port}...`,
          type: "system",
          timestamp: Date.now(),
        },
      ];
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
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "error",
                  lines: [
                    ...s.lines,
                    {
                      id: generateId(),
                      text: `${connection.type.toUpperCase()} interactive terminal sessions are not supported; use the connection viewer instead.`,
                      type: "error",
                      timestamp: Date.now(),
                    },
                  ],
                }
              : s,
          ),
        );
        return id;
      }

      let socket: WebSocket;
      try {
        socket = new WebSocket(getWebSocketUrl());
      } catch (error) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "error",
                  lines: [
                    ...s.lines,
                    {
                      id: generateId(),
                      text: error instanceof Error ? error.message : "Unable to open WebSocket",
                      type: "error",
                      timestamp: Date.now(),
                    },
                  ],
                }
              : s,
          ),
        );
        return id;
      }

      sockets.current.set(id, socket);

      socket.onopen = () => {
        const privateKey = connection.privateKeyId ? getPrivateKey(connection.privateKeyId) : null;
        socket.send(
          JSON.stringify({
            type: "connect",
            host: connection.host,
            port: connection.port,
            username: connection.username,
            password: connection.password,
            privateKey: privateKey ?? undefined,
          }),
        );
      };

      socket.onmessage = (event) => {
        let message: { type?: string; data?: string; message?: string };
        try {
          message = JSON.parse(String(event.data));
        } catch {
          return;
        }
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            if (message.type === "connected") return { ...s, status: "connected" };
            if (message.type === "connecting") return { ...s, status: "connecting" };
            if (message.type === "output") {
              return {
                ...s,
                lines: [
                  ...s.lines,
                  {
                    id: generateId(),
                    text: message.data ?? "",
                    type: "output",
                    timestamp: Date.now(),
                  },
                ],
              };
            }
            if (message.type === "error") {
              return {
                ...s,
                status: "error",
                lines: [
                  ...s.lines,
                  {
                    id: generateId(),
                    text: message.message ?? "SSH connection failed",
                    type: "error",
                    timestamp: Date.now(),
                  },
                ],
              };
            }
            if (message.type === "closed") return { ...s, status: "disconnected" };
            return s;
          }),
        );
      };

      socket.onerror = () => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "error",
                  lines: [
                    ...s.lines,
                    {
                      id: generateId(),
                      text: "WebSocket connection failed. Verify server connectivity and host accessibility.",
                      type: "error",
                      timestamp: Date.now(),
                    },
                  ],
                }
              : s,
          ),
        );
      };

      socket.onclose = () => {
        sockets.current.delete(id);
        setSessions((prev) =>
          prev.map((s) => (s.id === id && s.status !== "error" ? { ...s, status: "disconnected" } : s)),
        );
      };

      return id;
    },
    [colorScheme, getPrivateKey],
  );

  const closeSession = useCallback((id: string) => {
    sockets.current.get(id)?.close();
    sockets.current.delete(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setActiveSessionId((curr) => (curr === id ? (next[0]?.id ?? null) : curr));
      return next;
    });
  }, []);

  const sendInput = useCallback((sessionId: string, data: string) => {
    const socket = sockets.current.get(sessionId);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "input", data }));
    }
  }, []);

  const resize = useCallback((sessionId: string, cols: number, rows: number) => {
    const socket = sockets.current.get(sessionId);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  const addLine = useCallback((sessionId: string, line: Omit<TerminalLine, "id" | "timestamp">) => {
    const full: TerminalLine = { ...line, id: generateId(), timestamp: Date.now() };
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, lines: [...s.lines, full] } : s)),
    );
  }, []);

  const handleSetColorScheme = useCallback((scheme: ColorScheme) => {
    setColorScheme(scheme);
    setSessions((prev) => prev.map((s) => ({ ...s, colorScheme: scheme })));
  }, []);

  return (
    <TerminalContext.Provider
      value={{
        sessions,
        activeSessionId,
        colorScheme,
        fontSize,
        vimMode,
        openSession,
        closeSession,
        setActiveSession: setActiveSessionId,
        addLine,
        setColorScheme: handleSetColorScheme,
        setFontSize,
        setVimMode,
        sendInput,
        resize,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error("useTerminal must be used within TerminalProvider");
  return ctx;
}
