import type { IncomingMessage } from "node:http";
import { Client, type ConnectConfig } from "ssh2";
import type { WebSocket } from "ws";
import { verifyToken } from "@clerk/backend";
import { logger } from "../lib/logger.js";

interface ConnectMsg {
  type: "connect";
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

interface InputMsg {
  type: "input";
  data: string;
}

interface ResizeMsg {
  type: "resize";
  cols: number;
  rows: number;
}

type ClientMsg = ConnectMsg | InputMsg | ResizeMsg;

export async function handleSshWebSocket(ws: WebSocket, req: IncomingMessage): Promise<void> {
  const token = new URL(req.url ?? "", "http://localhost").searchParams.get("token");
  if (!token || !process.env.CLERK_SECRET_KEY) {
    ws.close(1008, "Authentication required");
    return;
  }
  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    ws.close(1008, "Invalid authentication token");
    return;
  }

  let sshClient: Client | null = null;
  let shellStream: any = null;
  let connected = false;

  const send = (obj: object) => {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify(obj));
    }
  };

  ws.on("message", (raw: Buffer | string) => {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw.toString()) as ClientMsg;
    } catch {
      return;
    }

    if (msg.type === "connect") {
      if (sshClient) {
        sshClient.end();
        sshClient = null;
      }

      const config: ConnectConfig = {
        host: msg.host,
        port: msg.port || 22,
        username: msg.username,
        readyTimeout: 15000,
        keepaliveInterval: 30000,
        algorithms: {
          serverHostKey: ["ssh-ed25519", "ecdsa-sha2-nistp256", "rsa-sha2-512", "rsa-sha2-256", "ssh-rsa"],
        },
      };

      if (msg.privateKey) {
        config.privateKey = msg.privateKey;
      } else if (msg.password) {
        config.password = msg.password;
      }

      sshClient = new Client();

      sshClient.on("ready", () => {
        connected = true;
        send({ type: "connected" });

        sshClient!.shell(
          { term: "xterm-256color", cols: 200, rows: 50 },
          (err, stream) => {
            if (err) {
              send({ type: "error", message: err.message });
              return;
            }
            shellStream = stream;

            stream.on("data", (chunk: Buffer) => {
              send({ type: "output", data: chunk.toString("utf8") });
            });

            stream.stderr?.on("data", (chunk: Buffer) => {
              send({ type: "output", data: chunk.toString("utf8") });
            });

            stream.on("close", () => {
              send({ type: "closed" });
              ws.close();
            });
          },
        );
      });

      sshClient.on("error", (err) => {
        logger.error({ err, host: msg.host }, "SSH connection error");
        send({ type: "error", message: err.message });
      });

      sshClient.on("close", () => {
        if (connected) {
          send({ type: "closed" });
          connected = false;
        }
      });

      send({ type: "connecting" });
      sshClient.connect(config);

    } else if (msg.type === "input" && shellStream) {
      shellStream.write(msg.data);

    } else if (msg.type === "resize" && shellStream) {
      shellStream.setWindow?.(msg.rows, msg.cols, 0, 0);
    }
  });

  ws.on("close", () => {
    shellStream = null;
    if (sshClient) {
      sshClient.end();
      sshClient = null;
    }
    connected = false;
  });

  ws.on("error", (err) => {
    logger.error({ err }, "SSH WebSocket error");
    if (sshClient) {
      sshClient.end();
      sshClient = null;
    }
  });
}
