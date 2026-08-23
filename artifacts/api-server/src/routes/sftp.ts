import { Router } from "express";
import { Client, type SFTPWrapper } from "ssh2";
import { logger } from "../lib/logger.js";

const router = Router();

interface SftpSession {
  client: Client;
  sftp: SFTPWrapper;
  lastUsed: number;
}

const sessions = new Map<string, SftpSession>();

// Expire sessions idle > 20 min
setInterval(() => {
  const cutoff = Date.now() - 20 * 60 * 1000;
  for (const [id, s] of sessions.entries()) {
    if (s.lastUsed < cutoff) {
      try { s.client.end(); } catch {}
      sessions.delete(id);
      logger.info({ sessionId: id }, "SFTP session expired");
    }
  }
}, 5 * 60 * 1000);

function mkId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// POST /api/sftp/connect
router.post("/sftp/connect", (req, res) => {
  const { host, port, username, password, privateKey } = req.body as {
    host: string; port?: number; username: string;
    password?: string; privateKey?: string;
  };

  if (!host || !username) {
    res.status(400).json({ error: "host and username are required" });
    return;
  }

  const client = new Client();
  const sessionId = mkId();

  const config: any = {
    host,
    port: port || 22,
    username,
    readyTimeout: 15000,
    algorithms: {
      serverHostKey: ["ssh-ed25519", "ecdsa-sha2-nistp256", "rsa-sha2-512", "rsa-sha2-256", "ssh-rsa"],
    },
  };

  if (privateKey) {
    config.privateKey = privateKey;
  } else if (password) {
    config.password = password;
  }

  let responded = false;
  const fail = (msg: string) => {
    if (!responded) { responded = true; res.status(500).json({ error: msg }); }
    client.end();
  };

  client.on("ready", () => {
    client.sftp((err, sftp) => {
      if (err) { fail(err.message); return; }
      sessions.set(sessionId, { client, sftp, lastUsed: Date.now() });
      responded = true;
      res.json({ sessionId });
    });
  });

  client.on("error", (err) => { fail(err.message); });

  client.connect(config);
});

// GET /api/sftp/list?sessionId=X&path=/some/dir
router.get("/sftp/list", (req, res) => {
  const { sessionId, path: dirPath = "/" } = req.query as { sessionId: string; path?: string };
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found or expired" }); return; }
  session.lastUsed = Date.now();

  session.sftp.readdir(dirPath, (err, list) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    const files = list.map((item, i) => ({
      id: `${i}-${item.filename}`,
      name: item.filename,
      type: item.attrs.isDirectory() ? "dir" : item.attrs.isSymbolicLink() ? "link" : "file",
      size: item.attrs.size,
      modified: item.attrs.mtime ? item.attrs.mtime * 1000 : undefined,
      permissions: item.longname?.substring(0, 10) ?? "",
    }));
    files.sort((a, b) => {
      if (a.type === "dir" && b.type !== "dir") return -1;
      if (a.type !== "dir" && b.type === "dir") return 1;
      return a.name.localeCompare(b.name);
    });
    res.json({ files });
  });
});

// POST /api/sftp/mkdir
router.post("/sftp/mkdir", (req, res) => {
  const { sessionId, path: dirPath } = req.body as { sessionId: string; path: string };
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  session.lastUsed = Date.now();
  session.sftp.mkdir(dirPath, (err) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ ok: true });
  });
});

// POST /api/sftp/delete
router.post("/sftp/delete", (req, res) => {
  const { sessionId, path: filePath, isDir } = req.body as {
    sessionId: string; path: string; isDir?: boolean;
  };
  const session = sessions.get(sessionId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  session.lastUsed = Date.now();
  const op = isDir
    ? (cb: any) => session.sftp.rmdir(filePath, cb)
    : (cb: any) => session.sftp.unlink(filePath, cb);
  op((err: any) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ ok: true });
  });
});

// POST /api/sftp/disconnect
router.post("/sftp/disconnect", (req, res) => {
  const { sessionId } = req.body as { sessionId: string };
  const s = sessions.get(sessionId);
  if (s) { try { s.client.end(); } catch {} sessions.delete(sessionId); }
  res.json({ ok: true });
});

export default router;
