import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer } from "ws";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { handleSshWebSocket } from "./routes/ssh.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "../../web");
const webDist = path.resolve(webRoot, "dist");

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3000;
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root: webRoot,
      configFile: path.resolve(webRoot, "vite.config.ts"),
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.resolve(webDist, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url?.split("?")[0] ?? "";
    if (pathname === "/api/ssh/ws") {
      wss.handleUpgrade(request, socket as any, head, (ws) => {
        void handleSshWebSocket(ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "Server listening on 0.0.0.0");
  });

  server.on("error", (err) => {
    logger.error({ err }, "Server error");
    process.exit(1);
  });
}

void startServer();

