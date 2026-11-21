// Brankas bukti: an encrypted evidence locker that lives only in this browser.
// PIN -> PBKDF2 (SHA-256) -> AES-GCM key. Entries are encrypted before they
// are written to IndexedDB, so the stored data is unreadable without the PIN.
// Each attached file also gets a SHA-256 fingerprint to show it was not changed.

const DB_NAME = "ruang-cerita-brankas";
const VERIFY_TEXT = "ruang-cerita-ok";
const ITERATIONS = 200000;
let key = null;

export function isSupported() {
  return !!(window.isSecureContext && window.crypto && crypto.subtle && window.indexedDB);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("meta");
      req.result.createObjectStore("entries", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result && "result" in result ? result.result : result);
    t.onerror = () => reject(t.error);
  });
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function b64ToBuf(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptJson(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: bufToB64(iv), ct: bufToB64(ct) };
}

async function decryptJson(rec, k = key) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBuf(rec.iv) }, k, b64ToBuf(rec.ct));
  return JSON.parse(dec.decode(pt));
}

export async function sha256Hex(buf) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hasPin() {
  return !!(await tx("meta", "readonly", (s) => s.get("verifier")));
}

export async function setup(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  key = await deriveKey(pin, salt);
  const v = await encryptJson(VERIFY_TEXT);
  await tx("meta", "readwrite", (s) => {
    s.put(bufToB64(salt), "salt");
    s.put(v, "verifier");
  });
}

export async function unlock(pin) {
  const salt = await tx("meta", "readonly", (s) => s.get("salt"));
  const verifier = await tx("meta", "readonly", (s) => s.get("verifier"));
  const k = await deriveKey(pin, b64ToBuf(salt));
  try {
    if ((await decryptJson(verifier, k)) !== VERIFY_TEXT) return false;
  } catch {
    return false;
  }
  key = k;
  return true;
}

export function lock() {
  key = null;
}

export function isUnlocked() {
  return !!key;
}

export async function addEntry({ incidentDate, place, description, files }) {
  if (!key) throw new Error("locked");
  const attachments = [];
  for (const f of files || []) {
    const buf = await f.arrayBuffer();
    attachments.push({ name: f.name, type: f.type, size: f.size, sha256: await sha256Hex(buf), data: bufToB64(buf) });
  }
  const entry = {
    id: bufToB64(crypto.getRandomValues(new Uint8Array(9))).replace(/[+/=]/g, ""),
    savedAt: new Date().toISOString(),
    incidentDate: incidentDate || "",
    place: place || "",
    description: description || "",
    attachments,
  };
  const rec = { id: entry.id, ...(await encryptJson(entry)) };
  await tx("entries", "readwrite", (s) => s.put(rec));
  return entry;
}

export async function listEntries() {
  if (!key) throw new Error("locked");
  const recs = await tx("entries", "readonly", (s) => s.getAll());
  const out = [];
  for (const r of recs || []) out.push(await decryptJson(r));
  return out.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

export async function deleteEntry(id) {
  await tx("entries", "readwrite", (s) => s.delete(id));
}

export async function wipe() {
  key = null;
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}
