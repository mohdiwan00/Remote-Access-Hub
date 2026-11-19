import React, { createContext, useCallback, useContext, useState } from "react";

export type ConnectionType = "ssh" | "vnc" | "rdp" | "sftp";

export interface PortForward {
  id: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  type: "local" | "remote";
}

export interface Connection {
  id: string;
  name: string;
  type: ConnectionType;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKeyId?: string;
  notes?: string;
  lastConnected?: number;
  group?: string;
  proxyJump?: string;
  portForwards?: PortForward[];
}

export interface SSHKey {
  id: string;
  name: string;
  type: "ed25519" | "rsa" | "ecdsa";
  publicKey: string;
  createdAt: number;
}

export interface CloudProvider {
  id: string;
  name: string;
  type: "gdrive" | "dropbox" | "onedrive" | "s3" | "backblaze" | "wasabi";
  color: string;
  connected: boolean;
  displayName?: string;
}

interface ConnectionsContextType {
  connections: Connection[];
  keys: SSHKey[];
  cloudProviders: CloudProvider[];
  addConnection: (conn: Omit<Connection, "id">) => void;
  updateConnection: (id: string, conn: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  clearAllConnections: () => void;
  factoryReset: () => void;
  addKey: (key: Omit<SSHKey, "id" | "createdAt"> & { privateKey?: string }) => string;
  getPrivateKey: (id: string) => string | null;
  deleteKey: (id: string) => void;
  toggleCloudProvider: (id: string) => void;
  setLastConnected: (id: string) => void;
  activeSftpConnectionId: string | null;
  setActiveSftpConnectionId: (id: string | null) => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

const STORAGE_KEY = "connectx_connections_v1";
const KEYS_STORAGE_KEY = "connectx_keys_v1";

const defaultCloudProviders: CloudProvider[] = [
  { id: "gdrive", name: "Google Drive", type: "gdrive", color: "#4285F4", connected: false },
  { id: "dropbox", name: "Dropbox", type: "dropbox", color: "#0061FF", connected: false },
  { id: "onedrive", name: "OneDrive", type: "onedrive", color: "#0078D4", connected: true },
  { id: "s3", name: "Amazon S3", type: "s3", color: "#FF9900", connected: false },
  { id: "backblaze", name: "Backblaze B2", type: "backblaze", color: "#d43f3a", connected: false },
  { id: "wasabi", name: "Wasabi", type: "wasabi", color: "#00a34e", connected: false },
];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

const sampleConnections: Connection[] = [
  {
    id: "demo-1",
    name: "Production Server",
    type: "ssh",
    host: "192.168.1.100",
    port: 22,
    username: "ubuntu",
    group: "Work",
    lastConnected: Date.now() - 1000 * 60 * 30,
  },
  {
    id: "demo-2",
    name: "Dev Box",
    type: "ssh",
    host: "dev.example.com",
    port: 2222,
    username: "developer",
    group: "Work",
    lastConnected: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "demo-3",
    name: "Office Desktop",
    type: "vnc",
    host: "10.0.0.50",
    port: 5900,
    username: "admin",
    group: "Office",
  },
  {
    id: "demo-4",
    name: "Windows Server",
    type: "rdp",
    host: "win-server.local",
    port: 3389,
    username: "Administrator",
    group: "Work",
    lastConnected: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "demo-5",
    name: "NAS Storage",
    type: "sftp",
    host: "nas.home",
    port: 22,
    username: "nas-user",
    group: "Home",
  },
];

function loadConnections(): Connection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Connection[];
  } catch {
    // ignore storage errors
  }
  return sampleConnections;
}

function loadKeys(): SSHKey[] {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SSHKey[];
  } catch {
    // ignore storage errors
  }
  return [];
}

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>(loadConnections);
  const [keys, setKeys] = useState<SSHKey[]>(loadKeys);
  const [cloudProviders, setCloudProviders] = useState<CloudProvider[]>(defaultCloudProviders);

  const saveConnections = useCallback((conns: Connection[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conns));
    } catch {
      // ignore
    }
  }, []);

  const addConnection = useCallback((conn: Omit<Connection, "id">) => {
    const newConn: Connection = { ...conn, id: generateId() };
    setConnections((prev) => {
      const next = [...prev, newConn];
      saveConnections(next);
      return next;
    });
  }, [saveConnections]);

  const updateConnection = useCallback((id: string, updates: Partial<Connection>) => {
    setConnections((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveConnections(next);
      return next;
    });
  }, [saveConnections]);

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveConnections(next);
      return next;
    });
  }, [saveConnections]);

  const clearAllConnections = useCallback(() => {
    setConnections([]);
    saveConnections([]);
  }, [saveConnections]);

  const factoryReset = useCallback(() => {
    keys.forEach((k) => {
      try {
        localStorage.removeItem(`connectx_private_key_${k.id}`);
      } catch {
        // ignore
      }
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(KEYS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setConnections(sampleConnections);
    setKeys([]);
    setCloudProviders(defaultCloudProviders);
  }, [keys]);

  const addKey = useCallback((key: Omit<SSHKey, "id" | "createdAt"> & { privateKey?: string }): string => {
    const id = generateId();
    const { privateKey, ...rest } = key;
    const newKey: SSHKey = { ...rest, id, createdAt: Date.now() };
    if (privateKey) {
      try {
        localStorage.setItem(`connectx_private_key_${id}`, privateKey);
      } catch {
        // ignore
      }
    }
    setKeys((prev) => {
      const next = [...prev, newKey];
      try {
        localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    return id;
  }, []);

  const deleteKey = useCallback((id: string) => {
    try {
      localStorage.removeItem(`connectx_private_key_${id}`);
    } catch {
      // ignore
    }
    setKeys((prev) => {
      const next = prev.filter((k) => k.id !== id);
      try {
        localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const getPrivateKey = useCallback((id: string): string | null => {
    try {
      return localStorage.getItem(`connectx_private_key_${id}`);
    } catch {
      return null;
    }
  }, []);

  const toggleCloudProvider = useCallback((id: string) => {
    setCloudProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p)),
    );
  }, []);

  const setLastConnected = useCallback((id: string) => {
    setConnections((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, lastConnected: Date.now() } : c));
      saveConnections(next);
      return next;
    });
  }, [saveConnections]);

  const [activeSftpConnectionId, setActiveSftpConnectionId] = useState<string | null>(null);

  return (
    <ConnectionsContext.Provider
      value={{
        connections,
        keys,
        cloudProviders,
        addConnection,
        updateConnection,
        deleteConnection,
        clearAllConnections,
        factoryReset,
        addKey,
        getPrivateKey,
        deleteKey,
        toggleCloudProvider,
        setLastConnected,
        activeSftpConnectionId,
        setActiveSftpConnectionId,
      }}
    >
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error("useConnections must be used within ConnectionsProvider");
  return ctx;
}
