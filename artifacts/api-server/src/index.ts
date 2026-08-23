import http from "node:http";
import { WebSocketServer } from "ws";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { handleSshWebSocket } from "./routes/ssh.js";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const pathname = request.url?.split("?")[0] ?? "";
  if (pathname === "/api/ssh/ws") {
    wss.handleUpgrade(request, socket as any, head, (ws) => {
      handleSshWebSocket(ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
