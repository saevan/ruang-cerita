import { LISTENERS, PSYCHOLOGISTS, TOPICS, STATS, CONTACTS, GUIDE, FAQ, makeAlias } from "./data.js";
import * as vault from "./vault.js";

const app = document.getElementById("app");
let cleanup = null; // called before the next view renders (closes chat streams)

// ---------- helpers ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (d) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
const fmtTime = (d) => new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(new Date(d));
const go = (hash) => { location.hash = hash; };

const store = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { sessionStorage.removeItem(k); } catch {} },
};

async function api(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function toast(text, ms = 2600) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

function modal(html, onMount) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => back.remove();
  back.addEventListener("click", (e) => { if (e.target === back || e.target.closest("[data-close]")) close(); });
  document.body.appendChild(back);
  onMount?.(back, close);
  return close;
}

function contactRows(list) {
  return list.map((c) => `
    <div class="contact">
      <div><strong>${esc(c.name)}</strong><span class="muted small">${esc(c.note || "")}</span></div>
      ${c.href ? `<a class="val" href="${esc(c.href)}" ${c.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${esc(c.value)}</a>` : `<span class="val">${esc(c.value)}</span>`}
    </div>`).join("");
}

function openSos() {
  modal(`
    <h2>Kamu tidak sendirian</h2>
    <p class="muted">Kalau kamu dalam bahaya sekarang, pergi ke tempat yang ramai dan hubungi nomor di bawah.</p>
    ${contactRows(CONTACTS.darurat)}
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn btn-primary" href="#/mulai" data-close>Cerita ke pendengar</a>
      <button class="btn btn-ghost" data-close>Tutup</button>
    </div>`);
}

function openGuideModal() {
  modal(`${guideHtml()}<div style="margin-top:16px"><button class="btn btn-primary" data-close>Kembali ke chat</button></div>`);
}

function guideHtml() {
  return `
    <div class="eyebrow">Panduan singkat</div>
    <h2>Apakah ini pelecehan?</h2>
    <p>${md(GUIDE.intro)}</p>
    <div class="grid-3" style="margin:16px 0">
      ${GUIDE.groups.map((g) => `
        <div class="card"><span class="icon">${g.icon}</span><h3>${esc(g.title)}</h3>
          <ul style="padding-left:18px;margin:0">${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        </div>`).join("")}
    </div>
    <h3>Penting diingat</h3>
    <ul class="check-list">${GUIDE.consent.map((c) => `<li><span>✔️</span><span>${md(c)}</span></li>`).join("")}</ul>
    <p class="muted small" style="margin-top:14px">${esc(GUIDE.disclaimer)}</p>`;
}

// quick exit: leave instantly to a neutral site and forget this tab's session
document.getElementById("quickExit").addEventListener("click", () => {
  try { sessionStorage.clear(); } catch {}
  location.replace("https://www.google.com/search?q=cuaca+hari+ini");
});
document.getElementById("sos").addEventListener("click", openSos);

// ---------- views ----------
function landing() {
  const sample = LISTENERS.slice(0, 3);
  app.innerHTML = `
  <section class="hero"><div class="wrap hero-grid">
    <div>
      <div class="eyebrow">Ruang aman untuk mahasiswa</div>
      <h1>Cerita aja.<br/>Nggak ada yang tahu ini kamu.</h1>
      <p class="lead">Pendengar terlatih dari <strong>kampus lain</strong>. Gratis. Tanpa nama. Kalau kamu siap, kami bantu kamu melapor, bahkan kalau kampusmu belum punya Satgas PPKPT.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="#/mulai">Mulai cerita sekarang</a>
        <button class="btn btn-warn btn-lg" data-sos>Aku tidak aman sekarang</button>
      </div>
      <div class="pill-row">
        <span class="pill">🔒 Tanpa nama &amp; akun</span>
        <span class="pill">🏫 Pendengar dari kampus lain</span>
        <span class="pill">🆓 Gratis</span>
      </div>
    </div>
    <div class="hero-card" aria-hidden="true">
      <div class="row" style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
        <div class="avatar">S</div>
        <div><strong>Senja-14</strong><div class="small muted">Pendengar SGA · kampus lain</div></div>
      </div>
      <div class="mini-chat">
        <div class="b them">Halo, terima kasih sudah mau cerita. Kamu aman di sini 🙂</div>
        <div class="b me">Aku bingung… senior di organisasi sering kirim pesan yang bikin nggak nyaman.</div>
        <div class="b them">Itu pasti berat. Yang kamu alami bukan salahmu. Boleh cerita lebih lanjut?</div>
      </div>
    </div>
  </div></section>

  <section class="tight"><div class="wrap">
    <h2>Mau cerita ke siapa?</h2>
    <div class="grid-3">
      <a class="card choice" href="#/mulai"><span class="tag">Gratis · Anonim</span><span class="icon">🤝</span><h3>Teman Pendengar</h3><span class="muted">Mahasiswa terlatih dari kampus lain. Kecil kemungkinan kalian saling kenal.</span></a>
      <a class="card choice" href="#/psikolog"><span class="tag paid">Harga mahasiswa</span><span class="icon">🩺</span><h3>Psikolog Profesional</h3><span class="muted">Berlisensi, dengan nomor SIPP yang ditampilkan. Untuk masalah yang lebih berat.</span></a>
      <a class="card choice" href="#/lapor"><span class="tag warn">Kamu yang memutuskan</span><span class="icon">🛡️</span><h3>Laporkan Kejadian</h3><span class="muted">Panduan, brankas bukti, dan jalur lapor. Juga untuk kampus yang belum punya Satgas.</span></a>
    </div>
  </div></section>

  <section><div class="wrap grid-2" style="align-items:center">
    <div>
      <h2>Lagi ngerasain ini?</h2>
      <p class="muted">Kamu nggak harus menunggu masalahnya "cukup besar" untuk cerita.</p>
      <a class="btn btn-primary" href="#/mulai">Cerita sekarang</a>
    </div>
    <ul class="check-list">
      <li><span>📚</span><span>Tugas numpuk dan rasanya mau menyerah</span></li>
      <li><span>🏠</span><span>Kesepian di kost, jauh dari keluarga</span></li>
      <li><span>💸</span><span>Pusing soal uang di akhir bulan</span></li>
      <li><span>📱</span><span>Dapat pesan tidak nyaman dari senior atau dosen</span></li>
      <li><span>🤐</span><span>Mau cerita, tapi takut teman kampus tahu</span></li>
    </ul>
  </div></section>

  <section class="tight"><div class="wrap">
    <h2>Kenapa beda?</h2>
    <div class="table-wrap"><table>
      <thead><tr><th></th><th class="us">Ruang Cerita</th><th>Layanan curhat kampus</th><th>Aplikasi psikolog</th></tr></thead>
      <tbody>
        <tr><td>Pendengar tidak kenal kamu</td><td class="yes us">✓</td><td class="no">✗</td><td class="yes">✓</td></tr>
        <tr><td>Gratis</td><td class="yes us">✓</td><td class="yes">✓</td><td class="no">✗</td></tr>
        <tr><td>Tanpa nama / akun</td><td class="yes us">✓</td><td class="no">✗</td><td class="no">✗</td></tr>
        <tr><td>Jalur lapor, juga untuk kampus tanpa Satgas</td><td class="yes us">✓</td><td class="no">✗</td><td class="no">✗</td></tr>
        <tr><td>Brankas bukti terenkripsi</td><td class="yes us">✓</td><td class="no">✗</td><td class="no">✗</td></tr>
      </tbody>
    </table></div>
    <p class="muted small" style="margin-top:10px">Kami tidak menggantikan layanan curhat kampus seperti SGA. Pendengar SGA bisa bergabung ke jaringan kami dan mendengarkan mahasiswa dari kampus lain.</p>
  </div></section>

  <section><div class="wrap">
    <h2>3 langkah</h2>
    <div class="steps">
      <div class="card"><h3>Pilih</h3><p class="muted">Mau cerita ke teman pendengar, psikolog, atau langsung membuat laporan.</p></div>
      <div class="card"><h3>Cerita</h3><p class="muted">Pakai nama samaran. Pendengarmu dari kampus lain dan sudah dilatih.</p></div>
      <div class="card"><h3>Lanjut kalau perlu</h3><p class="muted">Simpan bukti, ke psikolog, atau buat paket laporan. Semua pilihanmu.</p></div>
    </div>
  </div></section>

  <section class="tight"><div class="wrap">
    <h2>Privasimu, dijelaskan dengan jelas</h2>
    <div class="grid-3">
      <div class="card"><span class="icon">✅</span><h3>Yang kami simpan</h3><p class="muted">Nama samaran dan isi chat selama sesi berjalan. Isi chat dihapus dari server setelah sesi selesai.</p></div>
      <div class="card"><span class="icon">🚫</span><h3>Yang tidak kami simpan</h3><p class="muted">Nama asli, NIM, nomor HP, email, dan lokasi. Bukti di brankas tidak pernah dikirim ke server.</p></div>
      <div class="card"><span class="icon">⚠️</span><h3>Pengecualian</h3><p class="muted">Kalau ada bahaya bagi nyawamu atau orang lain, pendengar akan mengarahkanmu ke bantuan darurat.</p></div>
    </div>
  </div></section>

  <section><div class="wrap">
    <h2>Pendengar kami</h2>
    <p class="muted">Tanpa foto. Hanya nama samaran, asal kampus, dan topik yang mereka kuasai.</p>
    <div class="grid-3">
      ${sample.map(listenerCard).join("")}
    </div>
    <p class="muted small" style="margin-top:10px">Semua nama pendengar dan kampus di demo ini fiksi.</p>
  </div></section>

  <section class="tight"><div class="wrap">
    <h2>Kenapa ini penting <span class="sim-label">Data simulasi</span></h2>
    <div class="stats">
      ${STATS.map((s) => `<div class="card stat"><div class="v">${esc(s.value)}</div><div class="muted">${esc(s.label)}</div></div>`).join("")}
    </div>
    <p class="muted small" style="margin-top:10px">Angka di atas adalah simulasi untuk demo, bukan hasil survei asli.</p>
  </div></section>

  <section><div class="wrap page-narrow" style="margin:0 auto">
    <h2>Pertanyaan yang sering ditanyakan</h2>
    ${FAQ.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
  </div></section>

  <section class="tight" id="mitra"><div class="wrap">
    <div class="card" style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div style="max-width:640px">
        <div class="eyebrow">Untuk SGA &amp; organisasi kampus</div>
        <h2>Punya layanan curhat? Ayo bergabung.</h2>
        <p class="muted" style="margin:0">Pendengar dari kampusmu akan mendengarkan mahasiswa kampus lain, dan mahasiswamu didengarkan oleh pendengar dari kampus lain. Lebih aman untuk semua.</p>
      </div>
      <a class="btn btn-ghost" href="/pendengar">Masuk sebagai pendengar</a>
    </div>
  </div></section>

  <footer><div class="wrap cols">
    <div><strong>Ruang Cerita</strong><br/>Prototipe hackathon. Semua data di demo ini fiksi.</div>
    <div><a href="#/panduan">Panduan</a> · <a href="#/brankas">Brankas bukti</a> · <a href="#/lapor">Laporkan</a> · <a href="/pendengar">Jadi pendengar</a></div>
  </div></footer>`;
  $$("[data-sos]").forEach((b) => b.addEventListener("click", openSos));
}

function listenerCard(l) {
  return `
    <div class="card listener-card">
      <div class="row">
        <div style="display:flex;gap:10px;align-items:center">
          <div class="avatar">${esc(l.alias[0])}</div>
          <div><strong>${esc(l.alias)}</strong><div class="small muted">${esc(l.campus)} · ${esc(l.region)}</div></div>
        </div>
        <span class="status">Online</span>
      </div>
      <div>${l.sga ? '<span class="badge sga">Pendengar SGA</span>' : ""}<span class="badge ok">✓ Terlatih</span><span class="badge">⭐ ${l.rating}</span></div>
      <div class="small muted">Topik: ${esc(l.topics.join(", "))}</div>
    </div>`;
}

function mulai() {
  const existing = store.get("rc-session");
  if (existing) return go("#/chat");
  let alias = makeAlias();
  let topic = null;
  app.innerHTML = `
  <div class="wrap page page-narrow">
    <a class="back" href="#/">← Kembali</a>
    <h1>Mulai cerita</h1>
    <p class="muted">Kamu akan dihubungkan dengan pendengar terlatih dari <strong>kampus lain</strong>.</p>

    <div class="field">
      <label>Nama samaranmu</label>
      <div class="alias-box"><span class="name" id="alias">${esc(alias)}</span><button class="btn btn-ghost btn-sm" id="reroll">Ganti nama</button></div>
    </div>

    <div class="field">
      <label>Kamu mau cerita soal apa? <span class="muted small">(boleh dilewati)</span></label>
      <div class="topic-row">${TOPICS.map((t) => `<button class="topic" data-topic="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    </div>

    <div class="card" style="margin:20px 0">
      <h3>Aturan privasi, sebelum mulai</h3>
      <ul class="check-list">
        <li><span>🙈</span><span>Kamu memakai nama samaran. Kami <strong>tidak</strong> meminta nama asli, NIM, nomor HP, atau lokasi.</span></li>
        <li><span>🏫</span><span>Pendengarmu dari kampus lain dan sudah dilatih. Mereka dilarang meminta data pribadimu.</span></li>
        <li><span>🧹</span><span>Isi chat dihapus dari server setelah sesi selesai.</span></li>
        <li><span>⚠️</span><span>Pengecualian: jika ada bahaya bagi nyawamu atau orang lain, pendengar akan mengarahkanmu ke bantuan darurat.</span></li>
        <li><span>🩺</span><span>Pendengar bukan psikolog. Untuk masalah berat, kamu bisa memilih psikolog profesional.</span></li>
        <li><span>✋</span><span>Kamu bisa mengakhiri chat atau melaporkan pendengar kapan saja.</span></li>
      </ul>
      <label style="display:flex;gap:10px;align-items:center;margin-top:14px;font-weight:600">
        <input type="checkbox" id="agree" style="width:20px;height:20px"/> Aku mengerti dan siap mulai
      </label>
    </div>
    <button class="btn btn-primary btn-lg" id="start" disabled style="width:100%">Mulai cerita</button>
  </div>`;

  $("#reroll").addEventListener("click", () => { alias = makeAlias(); $("#alias").textContent = alias; });
  $$(".topic").forEach((b) => b.addEventListener("click", () => {
    $$(".topic").forEach((x) => x.classList.remove("on"));
    if (topic === b.dataset.topic) { topic = null; return; }
    topic = b.dataset.topic; b.classList.add("on");
  }));
  $("#agree").addEventListener("change", (e) => { $("#start").disabled = !e.target.checked; });
  $("#start").addEventListener("click", async () => {
    $("#start").disabled = true;
    try {
      const r = await api("/api/sessions", { alias, topic: topic || "Lainnya", mode: "teman" });
      store.set("rc-session", { ...r, alias, topic: topic || "Lainnya" });
      go("#/chat");
    } catch {
      toast("Server tidak bisa dihubungi. Pastikan server menyala.");
      $("#start").disabled = false;
    }
  });
}

function chat() {
  const s = store.get("rc-session");
  if (!s) return go("#/mulai");
  app.innerHTML = `
  <div class="chat-shell">
    <div class="chat-head" id="head"><div class="who"><strong>${esc(s.alias)}</strong><span class="small muted">Nama samaranmu</span></div></div>
    <div class="chat-tools" id="tools">
      <button class="btn btn-ghost btn-sm" id="tGuide">📘 Apakah ini pelecehan?</button>
      <a class="btn btn-ghost btn-sm" href="#/brankas">🔒 Simpan bukti</a>
      <a class="btn btn-ghost btn-sm" href="#/lapor">🛡️ Laporkan kejadian</a>
      <button class="btn btn-ghost btn-sm" id="tReport">⚑ Laporkan pendengar</button>
      <button class="btn btn-ghost btn-sm" id="tSos">🆘 Darurat</button>
      <button class="btn btn-warn btn-sm" id="tEnd">Akhiri</button>
    </div>
    <div class="chat-body" id="body"></div>
    <form class="chat-input" id="form" autocomplete="off">
      <input type="text" id="input" placeholder="Tulis ceritamu…" maxlength="2000" disabled />
      <button class="btn btn-primary" id="send" disabled>Kirim</button>
    </form>
  </div>`;

  const body = $("#body");
  const input = $("#input");
  const sendBtn = $("#send");
  let listener = null;
  let status = "waiting";
  let typingTimer = null;
  let lastTypingPing = 0;

  const scroll = () => { body.scrollTop = body.scrollHeight; };
  const setEnabled = (on) => { input.disabled = !on; sendBtn.disabled = !on; $("#tReport").disabled = !on; };

  function headHtml(l) {
    return `
      <div class="avatar">${esc(l.alias[0] || "P")}</div>
      <div class="who"><strong>${esc(l.alias)}</strong>
        <span class="small muted">${esc(l.campus || "Kampus lain")} · ${l.sga ? '<span class="badge sga">Pendengar SGA</span>' : ""}<span class="badge ok">✓ Terlatih</span><span class="badge">Kampus lain</span></span>
      </div>`;
  }

  function msgEl(m) {
    const el = document.createElement("div");
    if (m.kind === "link" && m.text === "panduan") {
      el.className = "msg them link";
      el.innerHTML = `📘 <strong>${esc(listener?.alias || "Pendengar")}</strong> membagikan panduan:<br/>"Apakah ini pelecehan?"<br/><button class="btn btn-primary btn-sm" style="margin-top:8px">Buka panduan</button><span class="t">${fmtTime(m.at)}</span>`;
      el.querySelector("button").addEventListener("click", openGuideModal);
      return el;
    }
    el.className = `msg ${m.from === "student" ? "me" : "them"}`;
    const note = m.redacted && m.from === "student" ? `<span class="t">🛡️ ${esc(m.redacted.join(", "))} disamarkan otomatis demi privasimu</span>` : "";
    el.innerHTML = `${esc(m.text)}${note}<span class="t">${fmtTime(m.at)}</span>`;
    return el;
  }

  function sys(text) {
    const el = document.createElement("div");
    el.className = "sys";
    el.textContent = text;
    body.appendChild(el);
  }

  function showWaiting() {
    body.innerHTML = `<div class="waiting"><div class="spinner"></div><h3>Mencari pendengar dari kampus lain…</h3><p class="muted">Biasanya kurang dari 1 menit. Kamu bisa membaca panduan sambil menunggu.</p></div>`;
    setEnabled(false);
  }

  function showActive(msgs) {
    $("#head").innerHTML = headHtml(listener);
    body.innerHTML = "";
    sys(`Terhubung dengan ${listener.alias} dari ${listener.campus || "kampus lain"}. Dia tidak tahu siapa kamu.`);
    msgs.forEach((m) => body.appendChild(msgEl(m)));
    setEnabled(true);
    scroll();
    input.focus();
  }

  function showEnded(by) {
    status = "ended";
    setEnabled(false);
    $("#tEnd").disabled = true;
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "align-self:stretch;text-align:center;margin-top:8px";
    card.innerHTML = `
      <h3>${by === "listener" ? "Pendengar mengakhiri sesi" : "Sesi selesai"}</h3>
      <p class="muted">Terima kasih sudah bercerita. Isi chat ini akan dihapus dari server.</p>
      <p style="font-weight:700;margin-bottom:6px">Bagaimana pendengarmu?</p>
      <div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button data-n="${n}" aria-label="${n} bintang">★</button>`).join("")}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn-primary" id="again">Cerita lagi</button>
        <a class="btn btn-ghost" href="#/brankas">Simpan bukti</a>
        <a class="btn btn-ghost" href="#/">Beranda</a>
      </div>`;
    body.appendChild(card);
    $$(".stars button", card).forEach((b) => b.addEventListener("click", () => {
      $$(".stars button", card).forEach((x) => x.classList.toggle("on", +x.dataset.n <= +b.dataset.n));
      toast("Terima kasih atas penilaianmu!");
    }));
    $("#again", card).addEventListener("click", () => { store.del("rc-session"); go("#/mulai"); });
    scroll();
  }

  // The same handlers are fed by the live stream (instant on local networks) and by
  // a polling fallback (works through tunnels/proxies that buffer streams).
  const seen = new Set();
  let lost = false;

  function onState(st) {
    status = st.status;
    listener = st.listener;
    seen.clear();
    st.messages.forEach((m) => seen.add(m.id));
    if (st.status === "waiting") showWaiting();
    else if (st.status === "active") showActive(st.messages);
    else { if (listener) showActive(st.messages); showEnded(); }
  }
  function onMatched(l, msgs = []) {
    if (status !== "waiting") return;
    listener = l;
    status = "active";
    msgs.forEach((m) => seen.add(m.id));
    showActive(msgs);
  }
  function onMessage(m) {
    if (seen.has(m.id)) return;
    seen.add(m.id);
    $(".typing", body)?.remove();
    body.appendChild(msgEl(m));
    scroll();
  }
  function onTyping() {
    if (!$(".typing", body)) {
      const t = document.createElement("div");
      t.className = "typing";
      t.textContent = `${listener?.alias || "Pendengar"} sedang mengetik…`;
      body.appendChild(t);
      scroll();
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => $(".typing", body)?.remove(), 3500);
  }
  function onEnded(by) { if (status !== "ended") showEnded(by); }
  function onLost() {
    if (lost) return;
    lost = true;
    store.del("rc-session");
    body.innerHTML = `<div class="waiting"><h3>Sesi tidak ditemukan</h3><p class="muted">Mungkin server dimulai ulang atau sesi sudah dihapus.</p><a class="btn btn-primary" href="#/mulai">Mulai sesi baru</a></div>`;
    setEnabled(false);
  }

  const q = `session=${encodeURIComponent(s.id)}&token=${encodeURIComponent(s.token)}`;
  const es = new EventSource(`/api/student/events?${q}`);
  es.addEventListener("state", (e) => onState(JSON.parse(e.data)));
  es.addEventListener("matched", (e) => onMatched(JSON.parse(e.data)));
  es.addEventListener("message", (e) => onMessage(JSON.parse(e.data)));
  es.addEventListener("typing", onTyping);
  es.addEventListener("ended", (e) => onEnded(JSON.parse(e.data).by));
  es.onerror = () => { if (es.readyState === EventSource.CLOSED) onLost(); };

  let first = true;
  async function poll() {
    try {
      const res = await fetch(`/api/student/poll?${q}`, { cache: "no-store" });
      if (res.status === 404) return onLost();
      const { state: st, listenerTyping } = await res.json();
      if (first) { first = false; if (!body.children.length) return onState(st); }
      if (st.status !== "waiting" && status === "waiting") onMatched(st.listener, st.messages);
      st.messages.forEach(onMessage);
      if (listenerTyping && status === "active") onTyping();
      if (st.status === "ended") onEnded();
    } catch {}
  }
  poll();
  const pollTimer = setInterval(poll, 1500);
  cleanup = () => { es.close(); clearInterval(pollTimer); };

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || status !== "active") return;
    input.value = "";
    try { await api(`/api/sessions/${s.id}/messages`, { token: s.token, text }); }
    catch { toast("Pesan gagal terkirim. Coba lagi."); input.value = text; }
  });
  input.addEventListener("input", () => {
    if (Date.now() - lastTypingPing > 2000 && status === "active") {
      lastTypingPing = Date.now();
      api(`/api/sessions/${s.id}/typing`, { token: s.token }).catch(() => {});
    }
  });
  $("#tGuide").addEventListener("click", openGuideModal);
  $("#tSos").addEventListener("click", openSos);
  $("#tEnd").addEventListener("click", async () => {
    if (status === "waiting") { await api(`/api/sessions/${s.id}/end`, { token: s.token }).catch(() => {}); store.del("rc-session"); return go("#/"); }
    await api(`/api/sessions/${s.id}/end`, { token: s.token }).catch(() => {});
  });
  $("#tReport").addEventListener("click", () => {
    modal(`
      <h2>Laporkan pendengar</h2>
      <p class="muted">Laporanmu dikirim ke tim moderasi. Pendengar tidak akan tahu siapa yang melapor.</p>
      ${["Meminta data pribadi", "Kata-kata tidak pantas", "Membuatku tidak nyaman", "Lainnya"].map((r, i) => `
        <label style="display:flex;gap:10px;align-items:center;font-weight:600;margin:8px 0"><input type="radio" name="r" value="${esc(r)}" ${i === 0 ? "checked" : ""}/> ${esc(r)}</label>`).join("")}
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-warn" id="doReport">Kirim laporan</button>
        <button class="btn btn-ghost" data-close>Batal</button>
      </div>`, (root, close) => {
      $("#doReport", root).addEventListener("click", async () => {
        await api(`/api/sessions/${s.id}/report-listener`, { token: s.token }).catch(() => {});
        close();
        toast("Laporan terkirim ke tim moderasi. Kamu bisa mengakhiri sesi kapan saja.", 3500);
      });
    });
  });
}

function panduan() {
  app.innerHTML = `
  <div class="wrap page">
    <a class="back" href="#/">← Kembali</a>
    ${guideHtml()}
    <div class="card" style="margin-top:24px">
      <h3>Kalau kamu ragu, kamu tetap boleh bercerita.</h3>
      <p class="muted">Kamu tidak perlu yakin dulu untuk mencari bantuan.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn-primary" href="#/mulai">Cerita ke pendengar</a>
        <a class="btn btn-ghost" href="#/brankas">Simpan bukti</a>
        <a class="btn btn-ghost" href="#/lapor">Laporkan kejadian</a>
      </div>
    </div>
  </div>`;
}

// draws a fictional chat screenshot so the demo never uses real people's chats
function fakeScreenshot(title, lines, n) {
  const c = document.createElement("canvas");
  c.width = 420; c.height = 560;
  const g = c.getContext("2d");
  g.fillStyle = "#ece5dd"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#3d3a46"; g.fillRect(0, 0, c.width, 64);
  g.fillStyle = "#fff"; g.font = "bold 18px sans-serif"; g.fillText(title, 18, 30);
  g.font = "13px sans-serif"; g.fillText("contoh fiksi untuk demo", 18, 50);
  let y = 92;
  g.font = "16px sans-serif";
  for (const [who, text, time] of lines) {
    const me = who === "me";
    const words = text.split(" "); const rows = []; let row = "";
    for (const w of words) { const t = row ? `${row} ${w}` : w; if (g.measureText(t).width > 270) { rows.push(row); row = w; } else row = t; }
    rows.push(row);
    const h = rows.length * 22 + 30;
    const x = me ? c.width - 310 : 14;
    g.fillStyle = me ? "#dcf8c6" : "#ffffff";
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, 296, h, 12); else g.rect(x, y, 296, h);
    g.fill();
    g.fillStyle = "#222";
    rows.forEach((r, i) => g.fillText(r, x + 12, y + 24 + i * 22));
    g.fillStyle = "#777"; g.font = "12px sans-serif"; g.fillText(time, x + 250, y + h - 8); g.font = "16px sans-serif";
    y += h + 12;
  }
  return new Promise((resolve) => c.toBlob((b) => resolve(new File([b], `bukti-${n}.png`, { type: "image/png" })), "image/png"));
}

async function brankas() {
  app.innerHTML = `<div class="wrap page page-narrow"><a class="back" href="#/">← Kembali</a><div id="v"></div></div>`;
  const v = $("#v");

  if (!vault.isSupported()) {
    v.innerHTML = `<h1>Brankas bukti</h1><div class="notice warn">Brankas butuh koneksi aman. Buka aplikasi lewat <strong>http://localhost</strong> di perangkat yang menjalankan server.</div>`;
    return;
  }

  if (!(await vault.hasPin())) {
    v.innerHTML = `
      <div class="eyebrow">Brankas bukti</div>
      <h1>Buat PIN brankas</h1>
      <p class="muted">Bukti disimpan <strong>hanya di perangkat ini</strong> dan dikunci dengan PIN. Kami tidak bisa membukanya, dan kami tidak bisa memulihkan PIN yang lupa.</p>
      <div class="field"><label>PIN (4–8 angka)</label><input type="password" inputmode="numeric" id="p1" maxlength="8"/></div>
      <div class="field"><label>Ulangi PIN</label><input type="password" inputmode="numeric" id="p2" maxlength="8"/></div>
      <button class="btn btn-primary" id="mk">Buat brankas</button>`;
    $("#mk").addEventListener("click", async () => {
      const a = $("#p1").value, b = $("#p2").value;
      if (!/^\d{4,8}$/.test(a)) return toast("PIN harus 4–8 angka.");
      if (a !== b) return toast("PIN tidak sama.");
      await vault.setup(a);
      toast("Brankas siap 🔒");
      brankas();
    });
    return;
  }

  if (!vault.isUnlocked()) {
    v.innerHTML = `
      <div class="eyebrow">Brankas bukti</div>
      <h1>Buka brankas</h1>
      <div class="field"><label>PIN</label><input type="password" inputmode="numeric" id="pin" maxlength="8" autofocus/></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" id="un">Buka</button>
        <button class="btn btn-ghost" id="forgot">Lupa PIN?</button>
      </div>`;
    const tryUnlock = async () => {
      if (await vault.unlock($("#pin").value)) brankas();
      else toast("PIN salah.");
    };
    $("#un").addEventListener("click", tryUnlock);
    $("#pin").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
    $("#forgot").addEventListener("click", () => confirmWipe());
    return;
  }

  const entries = await vault.listEntries();
  let pending = [];
  v.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <div><div class="eyebrow">Brankas bukti</div><h1 style="margin:0">Catatan &amp; bukti</h1></div>
      <span class="lock-badge">🔒 Terenkripsi di perangkat ini</span>
    </div>
    <p class="muted" style="margin-top:8px">Setiap catatan mendapat <strong>cap waktu otomatis</strong>, dan setiap file mendapat <strong>sidik digital (SHA-256)</strong>. Sidik ini berubah kalau file diubah sedikit saja, jadi bisa membuktikan bukti masih asli.</p>

    <div class="card" style="margin:16px 0">
      <h3>Tambah catatan</h3>
      <div class="grid-2">
        <div class="field"><label>Tanggal kejadian</label><input type="date" id="d"/></div>
        <div class="field"><label>Tempat / media</label><input type="text" id="pl" placeholder="mis. chat pribadi WhatsApp"/></div>
      </div>
      <div class="field"><label>Apa yang terjadi?</label><textarea id="ds" placeholder="Tulis dengan kata-katamu sendiri. Tidak harus lengkap."></textarea></div>
      <div class="field"><label>Lampiran (screenshot, foto)</label><input type="file" id="f" accept="image/*" multiple/></div>
      <div class="thumbs" id="pv"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-primary" id="save">Simpan ke brankas</button>
        <button class="btn btn-ghost btn-sm" id="demo">Isi contoh (demo)</button>
      </div>
    </div>

    <h3>Tersimpan (${entries.length})</h3>
    <div id="list" style="display:grid;gap:12px">${entries.length ? "" : '<p class="muted">Belum ada catatan.</p>'}</div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:24px">
      <a class="btn btn-primary" href="#/lapor">Buat paket laporan →</a>
      <button class="btn btn-ghost" id="lockBtn">Kunci brankas</button>
      <button class="btn btn-warn btn-sm" id="wipe">Hapus seluruh brankas</button>
    </div>`;

  const list = $("#list");
  for (const en of entries.slice().reverse()) list.appendChild(entryCard(en, async () => { await vault.deleteEntry(en.id); brankas(); }));

  const showPending = () => {
    $("#pv").innerHTML = "";
    pending.forEach((f) => { const img = document.createElement("img"); img.src = URL.createObjectURL(f); img.alt = f.name; $("#pv").appendChild(img); });
  };
  $("#f").addEventListener("change", (e) => { pending = [...pending, ...e.target.files]; showPending(); });
  $("#demo").addEventListener("click", async () => {
    $("#d").value = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
    $("#pl").value = "Chat pribadi WhatsApp dari senior organisasi";
    $("#ds").value = "Kak R. (senior di organisasi) beberapa kali mengirim pesan yang membuatku tidak nyaman. Dia meminta fotoku dan bilang akan membantuku jadi ketua divisi kalau aku menurut. Waktu aku tidak membalas, dia bilang tahu alamat kostku.";
    pending = [
      await fakeScreenshot("Kak R. (senior organisasi)", [["them", "Sari, kirim foto kamu yang tadi siang dong 😏", "21.04"], ["me", "Maaf kak, buat apa ya?", "21.10"], ["them", "Udah kirim aja. Jangan bilang siapa-siapa ya, nanti kakak bantu kamu jadi ketua divisi", "21.11"]], 1),
      await fakeScreenshot("Kak R. (senior organisasi)", [["them", "Kok nggak dibales?", "23.40"], ["them", "Aku tau kosan kamu lho", "23.52"]], 2),
    ];
    showPending();
    toast("Contoh fiksi sudah diisi. Tekan Simpan.");
  });
  $("#save").addEventListener("click", async () => {
    const description = $("#ds").value.trim();
    if (!description && !pending.length) return toast("Tulis sesuatu atau tambahkan lampiran dulu.");
    $("#save").disabled = true;
    await vault.addEntry({ incidentDate: $("#d").value, place: $("#pl").value.trim(), description, files: pending });
    toast("Tersimpan dengan cap waktu 🔒");
    brankas();
  });
  $("#lockBtn").addEventListener("click", () => { vault.lock(); brankas(); });
  $("#wipe").addEventListener("click", () => confirmWipe());
}

function confirmWipe() {
  modal(`
    <h2>Hapus seluruh brankas?</h2>
    <p class="muted">Semua catatan, bukti, dan PIN akan dihapus dari perangkat ini. Ini tidak bisa dibatalkan.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-warn" id="yes">Ya, hapus semua</button><button class="btn btn-ghost" data-close>Batal</button></div>`,
  (root, close) => $("#yes", root).addEventListener("click", async () => { await vault.wipe(); close(); toast("Brankas dihapus."); brankas(); }));
}

function entryCard(en, onDelete) {
  const el = document.createElement("div");
  el.className = "card entry";
  el.innerHTML = `
    <div class="meta"><span>🕒 Disimpan: <strong>${fmt(en.savedAt)}</strong></span>${en.incidentDate ? `<span>📅 Kejadian: ${esc(en.incidentDate)}</span>` : ""}${en.place ? `<span>📍 ${esc(en.place)}</span>` : ""}</div>
    ${en.description ? `<div>${esc(en.description)}</div>` : ""}
    <div class="thumbs">${en.attachments.map((a) => `<img src="data:${esc(a.type)};base64,${a.data}" alt="${esc(a.name)}"/>`).join("")}</div>
    ${en.attachments.map((a) => `<div class="hash">${esc(a.name)} · SHA-256: ${a.sha256.slice(0, 16)}…</div>`).join("")}
    ${onDelete ? '<div><button class="link-btn small del">Hapus catatan ini</button></div>' : ""}`;
  if (onDelete) $(".del", el).addEventListener("click", onDelete);
  return el;
}

async function lapor() {
  const st = store.get("rc-report") || {};
  const save = () => store.set("rc-report", st);
  app.innerHTML = `<div class="wrap page page-narrow"><a class="back" href="#/">← Kembali</a><div id="v"></div></div>`;
  const v = $("#v");

  const satgasButtons = `
    <div class="grid-3">
      <button class="card choice" data-s="ada"><span class="icon">🏛️</span><h3>Ya, ada</h3></button>
      <button class="card choice" data-s="belum"><span class="icon">🚧</span><h3>Belum ada</h3></button>
      <button class="card choice" data-s="tidaktahu"><span class="icon">🤔</span><h3>Tidak tahu</h3></button>
    </div>`;

  let channels = CONTACTS.laporTanpaSatgas;
  let routeHtml = "";
  if (st.satgas === "ada") {
    channels = [{ name: "Satgas PPKPT kampusmu", value: "Cek situs atau media sosial resmi kampus", note: "Jalur utama kalau kampusmu punya Satgas" }, ...CONTACTS.laporTanpaSatgas];
    routeHtml = `<div class="notice">Kampusmu punya Satgas PPKPT. Itu jalur utamamu. Kalau kamu tidak merasa aman melapor ke kampus, ada jalur lain di bawah.</div>`;
  } else if (st.satgas) {
    routeHtml = `<div class="notice warn"><strong>${st.satgas === "belum" ? "Kampusmu belum punya Satgas PPKPT." : "Belum yakin kampusmu punya Satgas?"}</strong> Kamu tetap punya jalan. Kamu bisa melapor ke pihak di luar kampus:</div>`;
  }

  let entries = null;
  if (vault.isSupported() && vault.isUnlocked()) entries = await vault.listEntries();

  v.innerHTML = `
    <div class="eyebrow">Laporkan kejadian</div>
    <h1>Kamu yang memutuskan</h1>
    <p class="muted">Melapor tidak wajib. Halaman ini membantumu tahu jalannya dan menyiapkan paket laporan. <strong>Tidak ada yang dikirim otomatis.</strong></p>

    <h3 style="margin-top:24px">1. Apakah kampusmu punya Satgas PPKPT?</h3>
    ${satgasButtons}

    <div id="step2" class="${st.satgas ? "" : "hidden"}" style="margin-top:28px">
      <h3>2. Ke mana kamu bisa melapor</h3>
      ${routeHtml}
      <div class="card" style="margin-top:12px">${contactRows(channels)}</div>
      <div class="field" style="margin-top:16px">
        <label>Tujuan paket laporan</label>
        <select id="ch">${channels.map((c) => `<option ${st.channel === c.name ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      </div>
    </div>

    <div id="step3" class="${st.satgas ? "" : "hidden"}" style="margin-top:28px">
      <h3>3. Pilih bukti dari brankas</h3>
      <div id="ev"></div>
      <div class="field" style="margin-top:16px">
        <label>Bagaimana kamu ingin dihubungi? <span class="muted small">(boleh dikosongkan supaya tetap anonim)</span></label>
        <input type="text" id="ct" placeholder="mis. email khusus yang kamu buat sendiri" value="${esc(st.contact || "")}"/>
      </div>
      <button class="btn btn-primary btn-lg" id="build" style="width:100%">Siapkan paket laporan</button>
    </div>`;

  $$("[data-s]").forEach((b) => {
    if (b.dataset.s === st.satgas) b.style.borderColor = "var(--primary)";
    b.addEventListener("click", () => { st.satgas = b.dataset.s; st.channel = null; save(); lapor(); });
  });

  const ev = $("#ev");
  if (!vault.isSupported()) ev.innerHTML = `<div class="notice warn">Brankas hanya bisa dibuka lewat http://localhost.</div>`;
  else if (!entries) ev.innerHTML = `<div class="notice">Brankas terkunci. <a href="#/brankas">Buka brankas</a> dulu, lalu kembali ke sini.</div>`;
  else if (!entries.length) ev.innerHTML = `<div class="notice">Brankas masih kosong. <a href="#/brankas">Tambah catatan</a> dulu.</div>`;
  else {
    const chosen = new Set(st.entryIds || entries.map((e) => e.id));
    ev.innerHTML = entries.map((e) => `
      <label class="card" style="display:flex;gap:12px;align-items:flex-start;font-weight:400;margin-bottom:8px;cursor:pointer">
        <input type="checkbox" data-id="${esc(e.id)}" ${chosen.has(e.id) ? "checked" : ""} style="width:20px;height:20px;margin-top:3px"/>
        <span><strong>${fmt(e.savedAt)}</strong> · ${e.attachments.length} lampiran<br/><span class="muted small">${esc((e.description || e.place || "").slice(0, 120))}</span></span>
      </label>`).join("");
  }

  $("#build")?.addEventListener("click", () => {
    st.channel = $("#ch").value;
    st.contact = $("#ct").value.trim();
    st.entryIds = $$("#ev input[type=checkbox]").filter((c) => c.checked).map((c) => c.dataset.id);
    save();
    if (!entries || !st.entryIds.length) return toast("Pilih minimal satu catatan dari brankas.");
    go("#/paket");
  });
}

async function paket() {
  const st = store.get("rc-report") || {};
  if (!vault.isSupported() || !vault.isUnlocked()) return go("#/brankas");
  const all = await vault.listEntries();
  const entries = all.filter((e) => (st.entryIds || []).includes(e.id));
  if (!entries.length) return go("#/lapor");
  const now = new Date();
  const aiOk = !!(st.ai && st.ai.forIds === (st.entryIds || []).join(","));
  const satgasText = { ada: "Kampus memiliki Satgas PPKPT", belum: "Kampus belum memiliki Satgas PPKPT", tidaktahu: "Pelapor tidak tahu apakah kampus memiliki Satgas PPKPT" }[st.satgas] || "-";

  app.innerHTML = `
  <div class="wrap page" style="max-width:860px">
    <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <a class="btn btn-ghost" href="#/lapor">← Kembali</a>
      <button class="btn btn-primary" id="print">Cetak / Simpan PDF</button>
    </div>
    <div class="notice no-print" style="margin-bottom:16px">Paket ini <strong>belum dikirim ke siapa pun</strong>. Kamu yang memutuskan kapan dan ke mana mengirimnya.</div>
    <div class="card no-print" style="margin-bottom:16px">
      <h3>✨ Rapikan kronologi dengan AI</h3>
      <p class="muted small" style="margin-bottom:10px">AI menyusun ceritamu menjadi kronologi yang rapi dan netral, <strong>tanpa menambah fakta</strong>. Hanya teks catatan yang dikirim ke layanan AI. Gambar tidak dikirim, dan kami tidak menyimpannya.</p>
      ${aiOk && st.ai.yang_perlu_dilengkapi?.length ? `<div class="notice" style="margin-bottom:10px"><strong>Saran AI, hal yang bisa kamu lengkapi:</strong><ul style="margin:6px 0 0;padding-left:18px">${st.ai.yang_perlu_dilengkapi.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="aiChrono">${aiOk ? "Rapikan ulang" : "Rapikan dengan AI"}</button>
        ${aiOk ? '<button class="btn btn-ghost btn-sm" id="aiRemove">Hapus hasil AI</button>' : ""}
      </div>
    </div>
    <div class="paper">
      <h1>Paket Laporan Kejadian</h1>
      <table>
        <tr><th>Disusun pada</th><td>${fmt(now)}</td></tr>
        <tr><th>Tujuan</th><td>${esc(st.channel || "-")}</td></tr>
        <tr><th>Status kampus</th><td>${esc(satgasText)}</td></tr>
        <tr><th>Kontak pelapor</th><td>${st.contact ? esc(st.contact) : "Anonim (pelapor memilih tidak mencantumkan kontak)"}</td></tr>
        <tr><th>Jumlah catatan</th><td>${entries.length} catatan, ${entries.reduce((n, e) => n + e.attachments.length, 0)} lampiran</td></tr>
      </table>

      ${aiOk ? `
        <h2>Ringkasan &amp; kronologi <span style="font-weight:400;font-size:0.8rem;color:#666">(dirapikan AI dari catatan pelapor, sudah diperiksa pelapor)</span></h2>
        <p>${esc(st.ai.ringkasan || "")}</p>
        <table>
          <thead><tr><th>Waktu</th><th>Kejadian</th></tr></thead>
          <tbody>${(st.ai.kronologi || []).map((k) => `<tr><td>${esc(k.waktu)}</td><td>${esc(k.kejadian)}</td></tr>`).join("")}</tbody>
        </table>
        <table style="margin-top:10px">
          <tr><th>Pihak terlibat</th><td>${esc((st.ai.pihak_terlibat || []).join("; ") || "Tidak disebutkan")}</td></tr>
          <tr><th>Bukti</th><td>${esc((st.ai.bukti || []).join("; ") || "-")}</td></tr>
          <tr><th>Dampak</th><td>${esc(st.ai.dampak || "Tidak disebutkan")}</td></tr>
        </table>` : ""}

      <h2>${aiOk ? "Catatan asli pelapor" : "Kronologi"}</h2>
      <table>
        <thead><tr><th>Tanggal kejadian</th><th>Tempat / media</th><th>Uraian</th><th>Dicatat pada</th></tr></thead>
        <tbody>${entries.map((e) => `<tr><td>${esc(e.incidentDate || "-")}</td><td>${esc(e.place || "-")}</td><td>${esc(e.description || "-")}</td><td>${fmt(e.savedAt)}</td></tr>`).join("")}</tbody>
      </table>

      <h2>Lampiran bukti</h2>
      ${entries.map((e, i) => e.attachments.map((a, j) => `
        <div style="margin:12px 0;break-inside:avoid">
          <strong>Lampiran ${i + 1}.${j + 1}</strong> · ${esc(a.name)} · dicatat ${fmt(e.savedAt)}<br/>
          <img src="data:${esc(a.type)};base64,${a.data}" alt="${esc(a.name)}"/>
          <div class="hash">SHA-256: ${a.sha256}</div>
        </div>`).join("")).join("") || '<p class="muted">Tidak ada lampiran.</p>'}

      <h2>Catatan</h2>
      <p class="muted small">Setiap lampiran memiliki sidik digital SHA-256 yang dihitung saat bukti disimpan di brankas. Jika file diubah, sidiknya akan berbeda. Paket ini disusun sendiri oleh pelapor menggunakan aplikasi Ruang Cerita (prototipe).</p>
    </div>
  </div>`;
  $("#print").addEventListener("click", () => window.print());
  $("#aiRemove")?.addEventListener("click", () => { delete st.ai; store.set("rc-report", st); paket(); });
  $("#aiChrono").addEventListener("click", async () => {
    const btn = $("#aiChrono");
    btn.disabled = true;
    btn.textContent = "AI sedang merapikan…";
    try {
      const r = await api("/api/ai/chronology", {
        entries: entries.map((e) => ({ incidentDate: e.incidentDate, place: e.place, description: e.description, savedAt: e.savedAt, attachments: e.attachments.map((a) => a.name) })),
      });
      st.ai = { ...r, forIds: (st.entryIds || []).join(",") };
      store.set("rc-report", st);
      toast(r.mode === "live" ? "Kronologi dirapikan AI. Periksa kembali ya." : "Kronologi dirapikan (mode demo). Periksa kembali ya.");
      paket();
    } catch {
      toast("AI tidak tersedia saat ini.");
      btn.disabled = false;
      btn.textContent = "Rapikan dengan AI";
    }
  });
}

function psikolog() {
  app.innerHTML = `
  <div class="wrap page">
    <a class="back" href="#/">← Kembali</a>
    <div class="eyebrow">Psikolog profesional</div>
    <h1>Bicara dengan psikolog</h1>
    <p class="muted">Semua psikolog berlisensi, dan nomor SIPP (izin praktik psikolog) ditampilkan supaya bisa kamu cek. Kamu tetap memakai nama samaran.</p>
    <div class="grid-3" style="margin-top:16px">
      ${PSYCHOLOGISTS.map((p) => `
        <div class="card listener-card">
          <div style="display:flex;gap:10px;align-items:center"><div class="avatar">${esc(p.name.split(" ")[1][0])}</div><div><strong>${esc(p.name)}</strong><div class="small muted">SIPP: ${esc(p.sipp)}</div></div></div>
          <div>${p.focus.map((f) => `<span class="badge">${esc(f)}</span>`).join("")}</div>
          <div class="small"><strong>${esc(p.price)}</strong> <span class="muted">/ sesi · harga mahasiswa</span></div>
          <div class="small muted">Jadwal tercepat: ${esc(p.slot)}</div>
          <button class="btn btn-primary btn-sm" data-book="${esc(p.name)}">Pilih jadwal</button>
        </div>`).join("")}
    </div>
    <p class="muted small" style="margin-top:10px">Nama psikolog, nomor SIPP, dan harga di halaman ini adalah contoh fiksi untuk demo.</p>
    <div class="card" style="margin-top:20px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
      <div><h3 style="margin:0">Belum yakin butuh psikolog?</h3><span class="muted">Cerita dulu ke teman pendengar. Gratis.</span></div>
      <a class="btn btn-ghost" href="#/mulai">Cerita ke teman pendengar</a>
    </div>
  </div>`;
  $$("[data-book]").forEach((b) => b.addEventListener("click", () => modal(`
    <h2>Pilih jadwal</h2>
    <p>Dengan <strong>${esc(b.dataset.book)}</strong></p>
    <div class="notice">Ini contoh untuk demo. Di versi asli, kamu memilih jadwal dan membayar di sini, tetap dengan nama samaran.</div>
    <div style="margin-top:16px"><button class="btn btn-primary" data-close>Mengerti</button></div>`)));
}

// ---------- router ----------
const routes = { "": landing, mulai, chat, panduan, brankas, lapor, paket, psikolog };

async function render() {
  cleanup?.();
  cleanup = null;
  const path = location.hash.replace(/^#\/?/, "").split("?")[0];
  const view = routes[path] || landing;
  $$(".nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#/${path}`));
  document.getElementById("sos").classList.toggle("hidden", path === "chat" || path === "paket");
  window.scrollTo(0, 0);
  await view();
}

window.addEventListener("hashchange", render);
render();
