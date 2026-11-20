// نسخ احتياطي موقّعة: تتبعث تلقائياً للآيدي المحدد كل ما يتغير شي في البوت (إعدادات أو كود)، وتنرجع بأمر restore
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const AdmZip = require("adm-zip");
const Pro = require("./prodb");

const ROOT = path.join(__dirname, "..");
const BACKUP_ID = process.env.BACKUP_ID || "1345715711095472280";
const DBFILE = path.join(process.env.DATA_DIR || ROOT, "data.json");
const PRODB = Pro.FILE;
const IMAGES_DIR = () => require("./utils/ticketAdmin").IMAGES_DIR;
const MAX_ZIP = 9 * 1024 * 1024;           // حد رفع الملف في ديسكورد (نبقى تحته)
const DEBOUNCE = 60 * 1000, MIN_GAP = 2 * 60 * 1000;

// بيانات تتغير كل شوي بسبب نشاط الأعضاء (ما تستاهل نسخة بكل مرة)
const ACTIVITY = /^(xp_users_|lastvoice_|invs_|invby_|records_|ticket_chan_|ticket_hist_|ticket_num_|ticket_points_|ticket_pending_|abs_|rate_|mutes_|prison_|backup_)/;

const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const secret = () => process.env.BACKUP_SECRET || sha(`${process.env.TOKEN || ""}|nova-backup-v1`);
const sign = o => crypto.createHmac("sha256", secret()).update(JSON.stringify({ v: o.v, at: o.at, reason: o.reason, files: o.files, codeHash: o.codeHash })).digest("hex");
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

// ───── الملفات اللي تدخل النسخة ─────
const SKIP_DIR = new Set(["node_modules", ".git", "data", "songs"]);
function walk(dir, rel = "") {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) out.push(...walk(path.join(dir, e.name), r)); }
        else if (e.isFile()) out.push(r);
    }
    return out;
}
const isCode = r => r !== "data.json" && r !== ".env" && !/\.zip$/i.test(r) && (r.includes("/") ? /^(public|assets|void)\//.test(r) : /\.(js|json|example|md|txt)$/i.test(r) || r === ".env.example");
function codeFiles() { try { return walk(ROOT).filter(isCode).sort(); } catch { return []; } }
function codeHash() { const h = crypto.createHash("sha256"); for (const r of codeFiles()) { h.update(r); try { h.update(fs.readFileSync(path.join(ROOT, r))); } catch {} } return h.digest("hex"); }

function dataEntries() {
    const out = [];
    for (const [zp, file] of [["data/data.json", DBFILE], ["data/prodb.json", PRODB]]) { try { out.push([zp, fs.readFileSync(file)]); } catch {} }
    try { const d = IMAGES_DIR(); for (const f of fs.readdirSync(d)) out.push([`data/ticket_images/${f}`, fs.readFileSync(path.join(d, f))]); } catch {}
    return out;
}

function build(reason, { dataOnly = false } = {}) {
    try { Pro._flush(); } catch {}
    const zip = new AdmZip(), files = {};
    const add = (zp, buf) => { zip.addFile(zp, buf); files[zp] = sha(buf); };
    if (!dataOnly) for (const r of codeFiles()) { try { add(`code/${r}`, fs.readFileSync(path.join(ROOT, r))); } catch {} }
    for (const [zp, buf] of dataEntries()) add(zp, buf);
    const meta = { v: 1, at: new Date().toISOString(), reason, files, codeHash: dataOnly ? null : codeHash() };
    meta.sig = sign(meta);
    zip.addFile("backup-meta.json", Buffer.from(JSON.stringify(meta)));
    const buf = zip.toBuffer();
    if (buf.length > MAX_ZIP && !dataOnly) return { ...build(reason, { dataOnly: true }), shrunk: true };
    return { buf, meta, dataOnly };
}

// ───── الإرسال ─────
async function send(client, reason, { force = false } = {}) {
    const { buf, meta, dataOnly, shrunk } = build(reason);
    const stamp = meta.at.replace(/[:T]/g, "-").slice(0, 19), name = `NovaSTORE-backup-${stamp}.zip`;
    const content = `📦 **نسخة احتياطية** — ${reason}\n🕒 <t:${Math.floor(Date.parse(meta.at) / 1000)}:F> • ${(buf.length / 1024).toFixed(0)} KB\n${dataOnly ? `⚠️ ${shrunk ? "الحجم كبير فالنسخة بيانات فقط" : "بيانات فقط"}` : "كود + بيانات"}\nللاسترجاع: ارفع الملف في روم واكتب \`restore\` (أو من الداشبورد ← النسخ الاحتياطي).`;
    const payload = { content, files: [{ attachment: buf, name }] };
    let target = null;
    const user = await client.users.fetch(BACKUP_ID).catch(() => null);
    if (user) target = await user.send(payload).then(() => `DM ${user.tag}`).catch(() => null);
    if (!target) { const ch = await client.channels.fetch(BACKUP_ID).catch(() => null); if (ch && ch.send) target = await ch.send(payload).then(() => `#${ch.name}`).catch(() => null); }
    if (!target) throw new Error("ما قدرت أرسل النسخة للآيدي " + BACKUP_ID + " (افتح الخاص مع البوت أو تأكد من الآيدي).");
    lastSent = Date.now();
    return { to: target, size: buf.length, dataOnly };
}

// ───── الجدولة: ننتظر دقيقة هدوء بعد آخر تعديل وبين كل نسخة ودقيقتين على الأقل ─────
let timer = null, lastSent = 0, clientRef = null; const reasons = new Set();
function schedule(reason) {
    if (!clientRef) return; reasons.add(reason);
    if (timer) return;
    const run = async () => {
        const wait = lastSent + MIN_GAP - Date.now();
        if (wait > 0) { timer = setTimeout(run, wait); return; }
        timer = null; const why = [...reasons].join("، "); reasons.clear();
        try { await send(clientRef, why); } catch (e) { console.error("[backup]", e.message); }
    };
    timer = setTimeout(run, DEBOUNCE);
}

// ───── التحقق والاسترجاع ─────
function verify(buf) {
    let zip; try { zip = new AdmZip(buf); } catch { throw new Error("الملف مو zip صحيح."); }
    const me = zip.getEntry("backup-meta.json"); if (!me) throw new Error("هذا مو ملف نسخة احتياطية من البوت.");
    let meta; try { meta = JSON.parse(me.getData().toString("utf8")); } catch { throw new Error("بيانات النسخة تالفة."); }
    if (!meta.sig || !same(meta.sig, sign(meta))) throw new Error("توقيع النسخة غير صحيح (لازم تكون من نفس البوت/التوكن، أو ضبط BACKUP_SECRET).");
    const entries = zip.getEntries().filter(e => !e.isDirectory && e.entryName !== "backup-meta.json");
    for (const e of entries) {
        if (!(e.entryName in meta.files)) throw new Error("ملف غير موقّع داخل النسخة: " + e.entryName);
        if (sha(e.getData()) !== meta.files[e.entryName]) throw new Error("الملف تالف أو متلاعب فيه: " + e.entryName);
    }
    return { zip, meta, entries };
}
const inside = (root, p) => { const r = path.resolve(root), t = path.resolve(p); return t === r || t.startsWith(r + path.sep); };
function target(zp) {
    if (zp === "data/data.json") return DBFILE;
    if (zp === "data/prodb.json") return PRODB;
    if (zp.startsWith("data/ticket_images/")) { const d = IMAGES_DIR(), t = path.join(d, path.basename(zp)); return inside(d, t) ? t : null; }
    if (zp.startsWith("code/")) { const rel = zp.slice(5), t = path.join(ROOT, rel); return inside(ROOT, t) && isCode(rel.replace(/\\/g, "/")) ? t : null; }
    return null;
}
function restore(buf, { dataOnly = false } = {}) {
    const { meta, entries } = verify(buf);
    // نسخة أمان من الوضع الحالي قبل ما نكتب فوقه
    try { const keep = path.join(path.dirname(PRODB), "pre-restore-backup.zip"); fs.mkdirSync(path.dirname(keep), { recursive: true }); fs.writeFileSync(keep, build("قبل الاسترجاع").buf); } catch {}
    global.__restoring = true; Pro._freeze();
    let n = 0, skipped = 0;
    for (const e of entries) {
        if (dataOnly && !e.entryName.startsWith("data/")) { skipped++; continue; }
        const t = target(e.entryName); if (!t) { skipped++; continue; }
        fs.mkdirSync(path.dirname(t), { recursive: true });
        fs.writeFileSync(t + ".tmp", e.getData()); fs.renameSync(t + ".tmp", t); n++;
    }
    return { files: n, skipped, at: meta.at, reason: meta.reason, dataOnly: dataOnly || !meta.codeHash };
}
const restartSoon = () => setTimeout(() => process.exit(0), 1500);

function init(client) {
    clientRef = client;
    Pro._onSave((d, dirty) => { if ([...dirty].some(k => !ACTIVITY.test(k))) schedule("تعديل إعدادات"); });
    client.once("ready", () => setTimeout(async () => {
        try {
            const h = codeHash(), old = Pro.get("backup_codehash");
            if (h !== old) { Pro.set("backup_codehash", h); await send(client, old ? "تحديث/تعديل كود البوت" : "أول تشغيل"); }
        } catch (e) { console.error("[backup] boot:", e.message); }
    }, 25 * 1000));
}

module.exports = { init, schedule, send, build, verify, restore, restartSoon, BACKUP_ID, MAX_ZIP };
