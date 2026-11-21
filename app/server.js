// Ruang Cerita — demo server.
// Zero dependencies: Node's http module serves the static files, and chat uses
// Server-Sent Events (server -> browser) plus small JSON POSTs (browser -> server).
// All chat data lives in memory only. Nothing is written to disk.

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const ai = require("./ai");

const PORT = Number(process.env.PORT) || 8080;
const PUBLIC_DIR = path.join(__dirname, "public");
const BOT_DELAY_MS = 5000; // wait this long for a human listener before the backup bot joins

// ---------- in-memory state ----------
const sessions = new Map(); // id -> session
const studentStreams = new Map(); // sessionId -> Set(res)
const listenerStreams = new Map(); // listenerId -> Set(res)
let autoBot = true; // listener console can switch this off

const BOT_LISTENER = {
  id: "bot",
  alias: "Embun-08",
  campus: "Universitas Cendana Biru",
  sga: true,
};

const BOT_SCRIPT = [
  "Halo, terima kasih sudah mau cerita di sini. Aku Embun, pendengar dari kampus lain. Kamu aman di sini 🙂",
  "Itu pasti bikin kamu tidak nyaman. Boleh ceritakan sedikit lagi, kalau kamu mau?",
  "Yang kamu alami bukan salahmu. Perasaanmu itu valid.",
  "Kalau kamu ragu apakah ini termasuk pelecehan, ada panduan singkat yang bisa kamu baca. Kamu juga bisa menyimpan bukti di brankas, yang terkunci di HP-mu sendiri.",
  "Kamu tidak harus memutuskan sekarang. Kalau suatu saat kamu siap melapor, aplikasi ini bisa bantu menyusun paket laporannya.",
];

function newId(bytes = 6) {
  return crypto.randomBytes(bytes).toString("hex");
}

function publicSession(s) {
  return {
    id: s.id,
    alias: s.alias,
    topic: s.topic,
    mode: s.mode,
    status: s.status,
    createdAt: s.createdAt,
    listener: s.listener,
    messages: s.messages,
  };
}

// ---------- SSE helpers ----------
function sseOpen(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // exact value: tunnels (cloudflared) only stream this type unbuffered
    "Cache-Control": "no-cache, no-transform",
    "Content-Encoding": "identity",
    "X-Accel-Buffering": "no",
    Connection: "keep-alive",
  });
  if (res.socket) res.socket.setNoDelay(true);
  // padding comment so proxies/tunnels flush the stream immediately
  res.write(`: ${" ".repeat(2048)}\nretry: 2000\n\n`);
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function toStudent(sessionId, event, data) {
  for (const res of studentStreams.get(sessionId) || []) sseSend(res, event, data);
}

function toListener(listenerId, event, data) {
  for (const res of listenerStreams.get(listenerId) || []) sseSend(res, event, data);
}

function toAllListeners(event, data) {
  for (const id of listenerStreams.keys()) toListener(id, event, data);
}

// A listener counts as online only if their console checked in recently.
// (Through tunnels, closed streams can look open forever, so stream count is not reliable.)
const listenerSeen = new Map(); // listenerId -> last check-in time
const touchListener = (lid) => listenerSeen.set(lid, Date.now());

function humanListenersOnline() {
  let n = 0;
  for (const t of listenerSeen.values()) if (Date.now() - t < 8000) n++;
  return n;
}

function waitingQueue() {
  return [...sessions.values()]
    .filter((s) => s.status === "waiting")
    .map((s) => ({ id: s.id, alias: s.alias, topic: s.topic, createdAt: s.createdAt }));
}

function broadcastQueue() {
  toAllListeners("queue", waitingQueue());
}

// keep connections alive through proxies / sleepy Wi-Fi
setInterval(() => {
  for (const set of [...studentStreams.values(), ...listenerStreams.values()])
    for (const res of set) res.write(": ping\n\n");
}, 20000);

// ---------- session logic ----------
function addMessage(s, from, text, kind = "text", redacted = []) {
  const msg = { id: newId(4), from, text: String(text).slice(0, 2000), kind, at: Date.now() };
  if (redacted.length) msg.redacted = redacted;
  s[from === "student" ? "studentMsgAt" : "listenerMsgAt"] = msg.at;
  s.messages.push(msg);
  toStudent(s.id, "message", msg);
  if (s.listener && s.listener.id !== "bot") toListener(s.listener.id, "message", { sessionId: s.id, ...msg });
  return msg;
}

function assign(s, listener) {
  s.status = "active";
  s.listener = listener;
  toStudent(s.id, "matched", listener);
  if (listener.id !== "bot") toListener(listener.id, "session", publicSession(s));
  broadcastQueue();
}

function startBot(s) {
  assign(s, BOT_LISTENER);
  s.botStep = 0;
  setTimeout(() => botReply(s), 1500);
}

function botReply(s) {
  if (s.status !== "active" || s.listener?.id !== "bot") return;
  if (s.botStep >= BOT_SCRIPT.length) return;
  toStudent(s.id, "typing", { from: "listener" });
  s.listenerTypingAt = Date.now();
  setTimeout(() => {
    if (s.status !== "active") return;
    const text = BOT_SCRIPT[s.botStep++];
    addMessage(s, "listener", text);
    if (s.botStep === 4) addMessage(s, "listener", "panduan", "link");
  }, 1800);
}

function endSession(s, by) {
  if (s.status === "ended") return;
  s.status = "ended";
  toStudent(s.id, "ended", { by });
  if (s.listener && s.listener.id !== "bot") toListener(s.listener.id, "ended", { sessionId: s.id, by });
  broadcastQueue();
  // forget the conversation shortly after it ends
  setTimeout(() => sessions.delete(s.id), 10 * 60 * 1000);
}

// ---------- HTTP ----------
function readJson(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 1e5) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  if (rel === "/pendengar") rel = "/pendengar.html";
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) return json(res, 403, { error: "forbidden" });
  fs.readFile(file, (err, data) => {
    if (err) return json(res, 404, { error: "not found" });
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

function authStudent(s, token) {
  return s && token && s.token === token;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  const parts = p.split("/").filter(Boolean); // e.g. ["api","sessions",":id","messages"]

  if (!p.startsWith("/api/")) return serveStatic(req, res, p);

  // --- student: create a session ---
  if (req.method === "POST" && p === "/api/sessions") {
    const b = await readJson(req);
    const s = {
      id: newId(),
      token: newId(12),
      alias: String(b.alias || "Anonim").slice(0, 30),
      topic: String(b.topic || "Lainnya").slice(0, 40),
      mode: b.mode === "psikolog" ? "psikolog" : "teman",
      status: "waiting",
      createdAt: Date.now(),
      listener: null,
      messages: [],
    };
    sessions.set(s.id, s);
    broadcastQueue();
    setTimeout(() => {
      if (s.status === "waiting" && autoBot && humanListenersOnline() === 0) startBot(s);
    }, BOT_DELAY_MS);
    return json(res, 200, { id: s.id, token: s.token });
  }

  // --- student: event stream ---
  if (req.method === "GET" && p === "/api/student/events") {
    const s = sessions.get(url.searchParams.get("session"));
    if (!authStudent(s, url.searchParams.get("token"))) return json(res, 404, { error: "session" });
    sseOpen(res);
    if (!studentStreams.has(s.id)) studentStreams.set(s.id, new Set());
    studentStreams.get(s.id).add(res);
    sseSend(res, "state", publicSession(s));
    req.on("close", () => studentStreams.get(s.id)?.delete(res));
    return;
  }

  // --- listener: event stream ---
  if (req.method === "GET" && p === "/api/listener/events") {
    const lid = String(url.searchParams.get("listener") || "");
    if (!lid) return json(res, 400, { error: "listener" });
    touchListener(lid);
    sseOpen(res);
    if (!listenerStreams.has(lid)) listenerStreams.set(lid, new Set());
    listenerStreams.get(lid).add(res);
    sseSend(res, "queue", waitingQueue());
    sseSend(res, "config", { autoBot });
    for (const s of sessions.values())
      if (s.listener?.id === lid && s.status === "active") sseSend(res, "session", publicSession(s));
    req.on("close", () => {
      const set = listenerStreams.get(lid);
      set?.delete(res);
      if (set && set.size === 0) listenerStreams.delete(lid);
    });
    return;
  }

  // --- polling fallback (works through any proxy/tunnel) ---
  if (req.method === "GET" && p === "/api/student/poll") {
    const s = sessions.get(url.searchParams.get("session"));
    if (!authStudent(s, url.searchParams.get("token"))) return json(res, 404, { error: "session" });
    const t = s.listenerTypingAt || 0;
    return json(res, 200, { state: publicSession(s), listenerTyping: Date.now() - t < 3000 && t > (s.listenerMsgAt || 0) });
  }

  if (req.method === "GET" && p === "/api/listener/poll") {
    const lid = String(url.searchParams.get("listener") || "");
    if (!lid) return json(res, 400, { error: "listener" });
    touchListener(lid);
    const mine = [...sessions.values()].filter((s) => s.listener?.id === lid);
    return json(res, 200, {
      queue: waitingQueue(),
      config: { autoBot },
      sessions: mine.map((s) => {
        const t = s.studentTypingAt || 0;
        return { ...publicSession(s), studentTyping: Date.now() - t < 3000 && t > (s.studentMsgAt || 0) };
      }),
    });
  }

  // --- listener: settings / demo reset ---
  if (req.method === "POST" && p === "/api/config") {
    const b = await readJson(req);
    if (typeof b.autoBot === "boolean") autoBot = b.autoBot;
    toAllListeners("config", { autoBot });
    return json(res, 200, { autoBot });
  }

  if (req.method === "POST" && p === "/api/reset") {
    for (const s of sessions.values()) endSession(s, "reset");
    sessions.clear();
    broadcastQueue();
    return json(res, 200, { ok: true });
  }

  // --- AI ---
  if (req.method === "GET" && p === "/api/ai/status") return json(res, 200, ai.status());

  if (req.method === "POST" && p === "/api/ai/assist") {
    const b = await readJson(req);
    const s = sessions.get(b.sessionId);
    if (!s || !s.listener || s.listener.id !== b.listenerId) return json(res, 403, { error: "forbidden" });
    return json(res, 200, await ai.assist(s.messages));
  }

  if (req.method === "POST" && p === "/api/ai/chronology") {
    const b = await readJson(req);
    if (!Array.isArray(b.entries) || !b.entries.length) return json(res, 400, { error: "entries" });
    return json(res, 200, await ai.chronology(b.entries));
  }

  if (req.method === "GET" && p === "/api/status") {
    return json(res, 200, { listenersOnline: humanListenersOnline(), waiting: waitingQueue().length, autoBot });
  }

  // --- per-session actions: /api/sessions/:id/<action> ---
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "sessions" && parts[2] && parts[3]) {
    const s = sessions.get(parts[2]);
    if (!s) return json(res, 404, { error: "session" });
    const b = await readJson(req);
    const action = parts[3];
    const isStudent = authStudent(s, b.token);
    const isListener = s.listener && b.listenerId === s.listener.id;

    if (action === "accept") {
      if (s.status !== "waiting") return json(res, 409, { error: "taken" });
      const l = b.listener || {};
      assign(s, {
        id: String(l.id || "").slice(0, 30),
        alias: String(l.alias || "Pendengar").slice(0, 30),
        campus: String(l.campus || "").slice(0, 60),
        sga: !!l.sga,
      });
      return json(res, 200, publicSession(s));
    }

    if (action === "messages") {
      if (s.status !== "active") return json(res, 409, { error: "not active" });
      if (!isStudent && !isListener) return json(res, 403, { error: "forbidden" });
      const kind = isListener && b.kind === "link" ? "link" : "text";
      const g = kind === "link" ? { blocked: false, text: b.text, redacted: [] } : ai.guard(isStudent ? "student" : "listener", String(b.text || ""));
      if (g.blocked) return json(res, 422, { error: "privasi", reason: g.reason });
      if (isStudent) {
        const m = addMessage(s, "student", g.text, "text", g.redacted);
        if (s.listener?.id === "bot") setTimeout(() => botReply(s), 900);
        return json(res, 200, m);
      }
      return json(res, 200, addMessage(s, "listener", g.text, kind, g.redacted));
    }

    if (action === "typing") {
      if (isStudent) s.studentTypingAt = Date.now();
      if (isListener) s.listenerTypingAt = Date.now();
      if (isStudent && s.listener && s.listener.id !== "bot")
        toListener(s.listener.id, "typing", { sessionId: s.id, from: "student" });
      if (isListener) toStudent(s.id, "typing", { from: "listener" });
      return json(res, 200, { ok: true });
    }

    if (action === "end") {
      if (!isStudent && !isListener) return json(res, 403, { error: "forbidden" });
      endSession(s, isStudent ? "student" : "listener");
      return json(res, 200, { ok: true });
    }

    if (action === "report-listener") {
      if (!isStudent) return json(res, 403, { error: "forbidden" });
      // In a real product this goes to the moderation team. For the demo we only log a count.
      s.listenerReported = true;
      console.log(`[moderasi] laporan terhadap pendengar ${s.listener?.alias} (sesi ${s.id})`);
      return json(res, 200, { ok: true });
    }
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
  console.log("\n  Ruang Cerita berjalan!\n");
  console.log(`  Mahasiswa (laptop ini): http://localhost:${PORT}`);
  console.log(`  Pendengar (laptop ini): http://localhost:${PORT}/pendengar`);
  for (const ip of ips) console.log(`  Pendengar (perangkat lain di jaringan sama): http://${ip}:${PORT}/pendengar`);
  const st = ai.status();
  console.log(`\n  AI: ${st.mode === "live" ? `${st.provider} · ${st.model}` : "MODE DEMO (tanpa API key, pakai aturan lokal)"}`);
  console.log("\n  Tekan Ctrl+C untuk berhenti.\n");
});
