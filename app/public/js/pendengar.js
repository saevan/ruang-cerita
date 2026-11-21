import { LISTENERS, QUICK_REPLIES } from "./data.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmtTime = (d) => new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(new Date(d));
const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s} dtk` : `${Math.round(s / 60)} mnt`; };

const KEY = "rc-listener";
const getMe = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const setMe = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch {} };

async function api(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 660; g.gain.value = 0.06;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 180);
  } catch {}
}

// ---------- login ----------
function login() {
  $("#who").textContent = "";
  let pick = LISTENERS[0].id;
  app.innerHTML = `
  <div class="wrap page page-narrow">
    <div class="eyebrow">Untuk pendengar terlatih</div>
    <h1>Masuk sebagai pendengar</h1>
    <p class="muted">Pilih identitas pendengar (demo). Kamu akan mendengarkan mahasiswa dari <strong>kampus lain</strong>.</p>
    <div style="display:grid;gap:10px;margin:16px 0" id="list">
      ${LISTENERS.map((l, i) => `
        <label class="card" style="display:flex;gap:12px;align-items:center;cursor:pointer;font-weight:400;margin:0">
          <input type="radio" name="l" value="${l.id}" ${i === 0 ? "checked" : ""} style="width:18px;height:18px"/>
          <div class="avatar">${esc(l.alias[0])}</div>
          <div><strong>${esc(l.alias)}</strong> ${l.sga ? '<span class="badge sga">Pendengar SGA</span>' : ""}<div class="small muted">${esc(l.campus)} · ${esc(l.region)}</div></div>
        </label>`).join("")}
    </div>
    <div class="card" style="margin-bottom:16px">
      <h3>Pedoman pendengar</h3>
      <ul class="check-list">
        <li><span>👂</span><span>Dengarkan. Jangan menghakimi atau menyalahkan.</span></li>
        <li><span>🙅</span><span><strong>Jangan pernah</strong> meminta nama, NIM, kampus, nomor HP, atau media sosial.</span></li>
        <li><span>🩺</span><span>Jangan memberi diagnosis atau nasihat hukum. Tawarkan psikolog bila perlu.</span></li>
        <li><span>🆘</span><span>Ada bahaya nyawa? Arahkan ke tombol Darurat (112).</span></li>
        <li><span>🛡️</span><span>Kasus pelecehan: tawarkan panduan, brankas bukti, dan menu Laporkan. Keputusan tetap di tangan mahasiswa.</span></li>
      </ul>
    </div>
    <button class="btn btn-primary btn-lg" id="go" style="width:100%">Masuk</button>
  </div>`;
  $$("input[name=l]").forEach((r) => r.addEventListener("change", () => { pick = r.value; }));
  $("#go").addEventListener("click", () => { setMe(LISTENERS.find((l) => l.id === pick)); consoleView(); });
}

// ---------- console ----------
function consoleView() {
  const me = getMe();
  if (!me) return login();
  $("#who").textContent = `${me.alias} · ${me.campus}`;

  const active = new Map(); // sessionId -> session
  let queue = [];
  let seen = new Set();
  let current = null;
  let lastTypingPing = 0;
  let typingTimer = null;

  app.innerHTML = `
  <div class="console">
    <aside>
      <div class="card" style="padding:14px;margin-bottom:14px">
        <div style="display:flex;gap:10px;align-items:center">
          <div class="avatar">${esc(me.alias[0])}</div>
          <div><strong>${esc(me.alias)}</strong><div class="small muted">${esc(me.campus)}</div></div>
        </div>
        <div style="margin-top:8px">${me.sga ? '<span class="badge sga">Pendengar SGA</span>' : ""}<span class="badge ok">✓ Terlatih</span></div>
      </div>
      <h3>Menunggu <span class="badge" id="qn">0</span></h3>
      <div id="queue"><p class="muted small">Belum ada yang menunggu.</p></div>
      <h3 style="margin-top:18px">Sesi aktif</h3>
      <div id="actives"><p class="muted small">Belum ada sesi.</p></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0"/>
      <label class="toggle"><input type="checkbox" id="bot"/> Balasan otomatis bila tidak ada pendengar online <span class="muted small">(cadangan demo)</span></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-ghost btn-sm" id="reset">Reset demo</button>
        <button class="btn btn-ghost btn-sm" id="out">Keluar</button>
      </div>
    </aside>
    <div class="chat-shell" style="max-width:none;margin:0;height:100%">
      <div class="chat-head" id="head"><div class="who"><strong>Pilih sesi</strong><span class="small muted">Terima permintaan di daftar "Menunggu".</span></div></div>
      <div class="chat-body" id="body"><div class="waiting"><h3>Menunggu mahasiswa…</h3><p class="muted">Permintaan baru akan muncul di kiri, dengan bunyi.</p></div></div>
      <div class="ai-panel hidden" id="aiPanel"></div>
      <div class="quick" id="quick"></div>
      <form class="chat-input" id="form" autocomplete="off">
        <input type="text" id="input" placeholder="Tulis balasan…" disabled maxlength="2000"/>
        <button class="btn btn-primary" id="send" disabled>Kirim</button>
      </form>
    </div>
  </div>`;

  const body = $("#body");
  const input = $("#input");
  const scroll = () => { body.scrollTop = body.scrollHeight; };

  $("#quick").innerHTML = `
    <button class="btn btn-ghost btn-sm" data-link="panduan">📘 Kirim panduan "Apakah ini pelecehan?"</button>
    ${QUICK_REPLIES.map((q) => `<button class="btn btn-ghost btn-sm" data-q="${esc(q)}">${esc(q.length > 48 ? q.slice(0, 46) + "…" : q)}</button>`).join("")}
    <button class="btn btn-warn btn-sm" id="endS">Akhiri sesi</button>`;
  $$("#quick button").forEach((b) => { b.disabled = true; });

  function renderQueue() {
    $("#qn").textContent = queue.length;
    const q = $("#queue");
    if (!queue.length) { q.innerHTML = '<p class="muted small">Belum ada yang menunggu.</p>'; document.title = "Konsol Pendengar"; return; }
    document.title = `(${queue.length}) Permintaan baru · Konsol Pendengar`;
    q.innerHTML = queue.map((s) => `
      <div class="queue-item ${seen.has(s.id) ? "" : "new"}">
        <strong>${esc(s.alias)}</strong><div class="small muted">Topik: ${esc(s.topic)} · menunggu ${ago(s.createdAt)}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%" data-accept="${s.id}">Terima</button>
      </div>`).join("");
    $$("[data-accept]", q).forEach((b) => b.addEventListener("click", () => accept(b.dataset.accept)));
  }

  function renderActives() {
    const a = $("#actives");
    if (!active.size) { a.innerHTML = '<p class="muted small">Belum ada sesi.</p>'; return; }
    a.innerHTML = [...active.values()].map((s) => `
      <button class="queue-item" style="width:100%;text-align:left;cursor:pointer;font:inherit;color:inherit;${s.id === current ? "border-color:var(--primary)" : ""}" data-open="${s.id}">
        <strong>${esc(s.alias)}</strong> ${s.status === "ended" ? '<span class="badge">selesai</span>' : '<span class="status">aktif</span>'}
        <div class="small muted">Topik: ${esc(s.topic)}</div>
      </button>`).join("");
    $$("[data-open]", a).forEach((b) => b.addEventListener("click", () => openSession(b.dataset.open)));
  }

  function msgEl(m) {
    const el = document.createElement("div");
    if (m.kind === "link") {
      el.className = "msg me";
      el.innerHTML = `📘 Kamu membagikan panduan "Apakah ini pelecehan?"<span class="t">${fmtTime(m.at)}</span>`;
      return el;
    }
    el.className = `msg ${m.from === "listener" ? "me" : "them"}`;
    el.innerHTML = `${esc(m.text)}${m.redacted ? `<span class="t">🛡️ ${esc(m.redacted.join(", "))} disamarkan otomatis</span>` : ""}<span class="t">${fmtTime(m.at)}</span>`;
    return el;
  }

  function openSession(id) {
    current = id;
    const s = active.get(id);
    $("#head").innerHTML = `<div class="avatar">${esc(s.alias[0])}</div><div class="who"><strong>${esc(s.alias)}</strong><span class="small muted">Topik: ${esc(s.topic)} · identitas tidak diketahui</span></div>`;
    body.innerHTML = "";
    const sys = document.createElement("div");
    sys.className = "sys";
    sys.textContent = "Mahasiswa ini dari kampus lain. Jangan meminta data pribadi.";
    body.appendChild(sys);
    s.messages.forEach((m) => body.appendChild(msgEl(m)));
    const on = s.status === "active";
    input.disabled = !on; $("#send").disabled = !on;
    $$("#quick button").forEach((b) => { b.disabled = !on; });
    if (s.status === "ended") { const e = document.createElement("div"); e.className = "sys"; e.textContent = "Sesi selesai."; body.appendChild(e); }
    renderActives();
    scroll();
    if (on) input.focus();
    refreshAI();
  }

  async function accept(id) {
    try {
      const s = await api(`/api/sessions/${id}/accept`, { listener: { id: me.id, alias: me.alias, campus: me.campus, sga: me.sga } });
      active.set(s.id, s);
      seen.add(s.id);
      openSession(s.id);
    } catch { toast("Permintaan ini sudah diambil pendengar lain."); }
  }

  async function send(text, kind = "text") {
    if (!current) return;
    try { await api(`/api/sessions/${current}/messages`, { listenerId: me.id, text, kind }); }
    catch (e) {
      if (e.message === "422") { toast("🛡️ Pesan ditahan: pendengar tidak boleh meminta data pribadi."); input.value = text; }
      else toast("Pesan gagal terkirim.");
    }
  }

  // ---------- AI assistant for the listener ----------
  let aiTimer = null;
  let aiSeq = 0;
  const RISK = {
    aman: { label: "Aman", cls: "ok" },
    perhatian: { label: "Perlu perhatian", cls: "warn" },
    darurat: { label: "DARURAT", cls: "danger" },
  };
  function refreshAI() {
    clearTimeout(aiTimer);
    aiTimer = setTimeout(async () => {
      const s = active.get(current);
      const panel = $("#aiPanel");
      if (!s || s.status !== "active" || !s.messages.some((m) => m.from === "student")) { panel.classList.add("hidden"); return; }
      const seq = ++aiSeq;
      panel.classList.remove("hidden");
      panel.innerHTML = `<div class="ai-head">🤖 Asisten AI <span class="muted small">sedang membaca percakapan…</span></div>`;
      try {
        const r = await api("/api/ai/assist", { sessionId: current, listenerId: me.id });
        if (seq !== aiSeq) return;
        const risk = RISK[r.risk] || RISK.aman;
        panel.className = `ai-panel risk-${risk.cls}`;
        panel.innerHTML = `
          <div class="ai-head">🤖 Asisten AI <span class="ai-risk ${risk.cls}">${risk.label}</span>
            <span class="muted small">${esc(r.alasan || "")}</span>
            <span class="ai-mode">${r.mode === "live" ? "AI aktif" : "mode demo"}</span></div>
          ${r.risk === "darurat" ? '<div class="ai-alert">⚠️ Tetap di percakapan. Arahkan ke tombol Darurat / 112.</div>' : ""}
          <div class="ai-sugs">${(r.saran || []).slice(0, 3).map((t) => `<button class="btn btn-ghost btn-sm" data-sug="${esc(t)}">${esc(t)}</button>`).join("")}</div>
          ${r.pengingat ? `<div class="small muted">💡 ${esc(r.pengingat)}</div>` : ""}`;
        $$("[data-sug]", panel).forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.sug; input.focus(); }));
      } catch {
        panel.innerHTML = `<div class="ai-head">🤖 Asisten AI <span class="muted small">tidak tersedia saat ini</span></div>`;
      }
    }, 600);
  }

  $("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    input.value = "";
    send(t);
  });
  input.addEventListener("input", () => {
    if (current && Date.now() - lastTypingPing > 2000) {
      lastTypingPing = Date.now();
      api(`/api/sessions/${current}/typing`, { listenerId: me.id }).catch(() => {});
    }
  });
  $("#quick").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.id === "endS") return api(`/api/sessions/${current}/end`, { listenerId: me.id }).catch(() => {});
    if (b.dataset.link) return send("panduan", "link");
    if (b.dataset.q) { input.value = b.dataset.q; input.focus(); }
  });
  $("#bot").addEventListener("change", (e) => api("/api/config", { autoBot: e.target.checked }).catch(() => {}));
  $("#reset").addEventListener("click", async () => {
    await api("/api/reset").catch(() => {});
    active.clear(); current = null; queue = []; renderQueue(); renderActives();
    body.innerHTML = '<div class="waiting"><h3>Demo di-reset</h3><p class="muted">Semua sesi dihapus.</p></div>';
    $("#head").innerHTML = '<div class="who"><strong>Pilih sesi</strong></div>';
    toast("Demo di-reset.");
  });
  $("#out").addEventListener("click", () => { es.close(); setMe(null); login(); });

  // Same handlers for the live stream (instant locally) and the polling fallback (tunnels).
  function onQueue(next) {
    const changed = next.length !== queue.length || next.some((s) => !queue.find((q) => q.id === s.id));
    if (next.some((s) => !queue.find((q) => q.id === s.id))) beep();
    queue = next;
    if (changed) renderQueue();
    setTimeout(() => { queue.forEach((s) => seen.add(s.id)); }, 4000);
  }
  function onConfig(c) { $("#bot").checked = c.autoBot; }
  function onSession(s) {
    if (active.has(s.id)) return;
    active.set(s.id, s);
    if (!current) openSession(s.id); else renderActives();
  }
  function onMessage(m) {
    const s = active.get(m.sessionId);
    if (!s || s.messages.some((x) => x.id === m.id)) return;
    s.messages.push(m);
    if (m.sessionId === current) {
      $(".typing", body)?.remove(); body.appendChild(msgEl(m)); scroll();
      if (m.from === "student") refreshAI();
    }
    else if (m.from === "student") beep();
  }
  function onTyping(sessionId) {
    if (sessionId !== current) return;
    if (!$(".typing", body)) { const t = document.createElement("div"); t.className = "typing"; t.textContent = "Mahasiswa sedang mengetik…"; body.appendChild(t); scroll(); }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => $(".typing", body)?.remove(), 3500);
  }
  function onEnded(sessionId, by) {
    const s = active.get(sessionId);
    if (!s || s.status === "ended") return;
    s.status = "ended";
    if (sessionId === current) openSession(current); else renderActives();
    toast(by === "student" ? `${s.alias} mengakhiri sesi.` : "Sesi selesai.");
  }

  const es = new EventSource(`/api/listener/events?listener=${encodeURIComponent(me.id)}`);
  es.addEventListener("queue", (e) => onQueue(JSON.parse(e.data)));
  es.addEventListener("config", (e) => onConfig(JSON.parse(e.data)));
  es.addEventListener("session", (e) => onSession(JSON.parse(e.data)));
  es.addEventListener("message", (e) => onMessage(JSON.parse(e.data)));
  es.addEventListener("typing", (e) => onTyping(JSON.parse(e.data).sessionId));
  es.addEventListener("ended", (e) => { const d = JSON.parse(e.data); onEnded(d.sessionId, d.by); });

  async function poll() {
    try {
      const r = await (await fetch(`/api/listener/poll?listener=${encodeURIComponent(me.id)}`, { cache: "no-store" })).json();
      onQueue(r.queue);
      onConfig(r.config);
      for (const ps of r.sessions) {
        onSession(ps);
        ps.messages.forEach((m) => onMessage({ sessionId: ps.id, ...m }));
        if (ps.studentTyping) onTyping(ps.id);
        if (ps.status === "ended") onEnded(ps.id);
      }
    } catch {}
  }
  poll();
  setInterval(poll, 1500);
  setInterval(renderQueue, 15000);
}

consoleView();
