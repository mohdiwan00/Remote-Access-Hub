import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ConnectionType = "ssh" | "vnc" | "rdp" | "sftp";

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

export interface PortForward {
  id: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  type: "local" | "remote";
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
  type: "gdrive" | "dropbox" | "onedrive" | "s3" | "sftp" | "smb";
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
  addKey: (key: Omit<SSHKey, "id" | "createdAt">) => void;
  deleteKey: (id: string) => void;
  toggleCloudProvider: (id: string) => void;
  setLastConnected: (id: string) => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

const STORAGE_KEY = "connectx_connections_v1";
const KEYS_STORAGE_KEY = "connectx_keys_v1";

const defaultCloudProviders: CloudProvider[] = [
  { id: "gdrive", name: "Google Drive", type: "gdrive", connected: false },
  { id: "dropbox", name: "Dropbox", type: "dropbox", connected: false },
  { id: "onedrive", name: "OneDrive", type: "onedrive", connected: false },
  { id: "s3", name: "Amazon S3", type: "s3", connected: false },
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

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [cloudProviders, setCloudProviders] = useState<CloudProvider[]>(defaultCloudProviders);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        setConnections(JSON.parse(data));
      } else {
        setConnections(sampleConnections);
      }
    });
    AsyncStorage.getItem(KEYS_STORAGE_KEY).then((data) => {
      if (data) setKeys(JSON.parse(data));
    });
  }, []);

  const save = useCallback((conns: Connection[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conns));
  }, []);

  const addConnection = useCallback((conn: Omit<Connection, "id">) => {
    const newConn: Connection = { ...conn, id: generateId() };
    setConnections((prev) => {
      const next = [...prev, newConn];
      save(next);
      return next;
    });
  }, [save]);

  const updateConnection = useCallback((id: string, updates: Partial<Connection>) => {
    setConnections((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      save(next);
      return next;
    });
  }, [save]);

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => {
      const next = prev.filter((c) => c.id !== id);
      save(next);
      return next;
    });
  }, [save]);

  const addKey = useCallback((key: Omit<SSHKey, "id" | "createdAt">) => {
    const newKey: SSHKey = { ...key, id: generateId(), createdAt: Date.now() };
    setKeys((prev) => {
      const next = [...prev, newKey];
      AsyncStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteKey = useCallback((id: string) => {
    setKeys((prev) => {
      const next = prev.filter((k) => k.id !== id);
      AsyncStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleCloudProvider = useCallback((id: string) => {
    setCloudProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
    );
  }, []);

  const setLastConnected = useCallback((id: string) => {
    setConnections((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, lastConnected: Date.now() } : c));
      save(next);
      return next;
    });
  }, [save]);

  return (
    <ConnectionsContext.Provider value={{
      connections, keys, cloudProviders,
      addConnection, updateConnection, deleteConnection,
      addKey, deleteKey, toggleCloudProvider, setLastConnected,
    }}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error("useConnections must be used within ConnectionsProvider");
  return ctx;
}
