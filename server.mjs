import http from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { openDatabase } from "./db/migrate.mjs";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname: process.env.HOSTNAME || "0.0.0.0", port });
const handle = app.getRequestHandler();
const database = openDatabase();
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
const subscriptions = new Map();

function cookieValue(header, name) {
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

function userFor(req) {
  const token = cookieValue(req.headers.cookie, "sg_session");
  return token ? database.prepare("SELECT user_id FROM sessions WHERE token = ?").get(token)?.user_id ?? null : null;
}

function member(userId, conversationId) {
  return database.prepare("SELECT 1 FROM conversation_members WHERE user_id = ? AND conversation_id = ?").get(userId, conversationId);
}

function send(socket, payload) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
}

function sync(socket, sub) {
  const rows = database.prepare("SELECT id FROM messages WHERE conversation_id = ? AND id > ? ORDER BY id LIMIT 100").all(sub.conversationId, sub.lastId);
  if (!rows.length) return;
  sub.lastId = rows.at(-1).id;
  send(socket, { type: "messages", conversationId: sub.conversationId, ids: rows.map((row) => row.id), after: sub.lastId });
}

wss.on("connection", (socket, req, userId) => {
  const subs = new Map();
  socket.isAlive = true;
  socket.on("pong", () => { socket.isAlive = true; });
  socket.on("message", (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { send(socket, { type: "error", error: "Invalid JSON." }); return; }
    const conversationId = Number(message.conversationId);
    if (message.type === "subscribe") {
      if (!Number.isInteger(conversationId) || conversationId <= 0 || !member(userId, conversationId)) { send(socket, { type: "error", error: "Conversation not found." }); return; }
      const sub = { conversationId, lastId: Number(message.after) || 0 };
      subs.set(conversationId, sub);
      subscriptions.set(socket, subs);
      sync(socket, sub);
      send(socket, { type: "ready", conversationId });
    } else if (message.type === "sync") {
      const sub = subs.get(conversationId);
      if (sub) { sub.lastId = Math.max(sub.lastId, Number(message.after) || 0); sync(socket, sub); }
    } else if (message.type === "unsubscribe") {
      subs.delete(conversationId);
    } else if (message.type === "ping") {
      send(socket, { type: "pong", at: Date.now() });
    }
  });
  socket.on("close", () => subscriptions.delete(socket));
  send(socket, { type: "authenticated", userId });
});

const poller = setInterval(() => {
  for (const [socket, subs] of subscriptions) {
    if (socket.readyState !== socket.OPEN) continue;
    for (const sub of subs.values()) {
      const latest = database.prepare("SELECT MAX(id) AS id FROM messages WHERE conversation_id = ?").get(sub.conversationId)?.id ?? 0;
      if (latest > sub.lastId) sync(socket, sub);
    }
  }
}, 500);
const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.isAlive === false) socket.terminate();
    else { socket.isAlive = false; socket.ping(); }
  }
}, 20_000);

await app.prepare();
const server = http.createServer((req, res) => handle(req, res));
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== "/api/ws") { socket.destroy(); return; }
  const userId = userFor(req);
  if (!userId) { socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n"); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (client) => wss.emit("connection", client, req, userId));
});
server.listen(port, () => console.log(`Shalter server listening on http://localhost:${port} (WebSocket /api/ws)`));

function shutdown() {
  clearInterval(poller);
  clearInterval(heartbeat);
  wss.close();
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
