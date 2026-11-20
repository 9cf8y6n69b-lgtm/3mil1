// بديل pro.db: تخزين مفتاح/قيمة في ملف JSON (data/prodb.json) مع حفظ مؤجل
const fs = require("fs"), path = require("path");
const DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "prodb.json");
let data = {}, timer = null, listeners = [], frozen = false;
const dirty = new Set();
try { fs.mkdirSync(DIR, { recursive: true }); data = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}

const flush = () => {
    timer = null;
    if (frozen) return;
    try { fs.writeFileSync(FILE + ".tmp", JSON.stringify(data)); fs.renameSync(FILE + ".tmp", FILE); } catch (e) { console.error("[prodb] save:", e.message); }
    const d = new Set(dirty); dirty.clear(); listeners.forEach(f => { try { f(data, d); } catch {} });
};
const touch = k => { if (k !== undefined) dirty.add(k); if (!timer && !frozen) timer = setTimeout(flush, 400); };
const clone = v => (v && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v);

const api = {
    get: k => clone(data[k]),
    set: (k, v) => { data[k] = clone(v); touch(k); return v; },
    delete: k => { const had = k in data; delete data[k]; touch(k); return had; },
    has: k => k in data,
    push: (k, v) => { const a = Array.isArray(data[k]) ? data[k] : []; a.push(clone(v)); data[k] = a; touch(k); return a; },
    add: (k, n) => { data[k] = (Number(data[k]) || 0) + n; touch(k); return data[k]; },
    subtract: (k, n) => api.add(k, -n),
    all: () => Object.entries(data).map(([ID, data]) => ({ ID, data: clone(data) })),
    startsWith: p => Object.entries(data).filter(([k]) => k.startsWith(p)).map(([ID, v]) => ({ ID, data: clone(v) })),
    // للتخزين الخارجي (MongoDB): يحمّل كل البيانات ويسمع للتغييرات
    _dump: () => data,
    _load: obj => { data = obj && typeof obj === "object" ? obj : {}; },
    _onSave: f => listeners.push(f),
    _flush: flush,
    _freeze: () => { frozen = true; clearTimeout(timer); timer = null; },
    FILE
};
process.on("SIGTERM", () => { try { flush(); } catch {} });
module.exports = api;
