// نظام الخبرة: شات + فويس، لفلات، مكافآت رتب، وكرت لفل أب
const path = require("path");
const Pro = require("../prodb");

const CHAT_XP = { cooldownMs: 60 * 1000, min: 15, max: 25 };
const VOICE_XP_PER_MINUTE = 10;

const cfgKey = g => `xp_cfg_${g}`, usersKey = g => `xp_users_${g}`;
const getCfg = g => ({ enabled: true, levelChannelId: null, rewards: [], ...(Pro.get(cfgKey(g)) || {}) });
const setCfg = (g, patch) => Pro.set(cfgKey(g), { ...getCfg(g), ...patch });

// خبرة الوصول للفل n (تراكمي): 5n² + 50n + 100 لكل لفل
const need = l => 5 * l * l + 50 * l + 100;
function levelOf(xp) { let l = 0, left = xp; while (left >= need(l)) { left -= need(l); l++; } return { level: l, into: left, next: need(l) }; }

const isEnabled = g => getCfg(g).enabled !== false;
const getLevelChannelId = g => getCfg(g).levelChannelId || null;
const setLevelChannel = (g, id) => setCfg(g, { levelChannelId: id || null });
const setEnabled = (g, on) => setCfg(g, { enabled: !!on });
const getRoleRewards = g => (getCfg(g).rewards || []).map(r => ({ level: Number(r.level), roleId: r.roleId })).filter(r => r.level > 0 && r.roleId);
const setRoleRewards = (g, list) => setCfg(g, { rewards: list.slice(0, 25) });

const EMPTY = { xp: 0, chatXp: 0, voiceXp: 0, messages: 0, voiceSeconds: 0, lastMsg: 0 };
function getUser(g, u) {
    const rec = { ...EMPTY, ...((Pro.get(usersKey(g)) || {})[u] || {}) };
    return { ...rec, ...levelOf(rec.xp) };
}

function addXp(g, u, type, gain, extra = {}) {
    const all = Pro.get(usersKey(g)) || {};
    const rec = { ...EMPTY, ...(all[u] || {}), ...extra };
    const before = levelOf(rec.xp).level;
    rec.xp += gain;
    if (type === "chat") rec.chatXp += gain; else rec.voiceXp += gain;
    all[u] = rec;
    Pro.set(usersKey(g), all);
    const after = levelOf(rec.xp).level;
    return { leveledUp: after > before, before, after, xp: rec.xp };
}

function top(g, limit = 10) {
    const all = Pro.get(usersKey(g)) || {};
    return Object.entries(all).map(([id, r]) => ({ id, ...r, ...levelOf(r.xp || 0) })).sort((a, b) => b.xp - a.xp).slice(0, limit);
}

async function applyRoleRewards(member, level) {
    const given = [];
    for (const r of getRoleRewards(member.guild.id).filter(x => x.level <= level).sort((a, b) => a.level - b.level)) {
        const role = member.guild.roles.cache.get(r.roleId);
        if (!role || member.roles.cache.has(role.id)) continue;
        if (await member.roles.add(role, "مكافأة لفل").then(() => true).catch(() => false)) given.push(role);
    }
    return given;
}

// ─────────────── كروت الخبرة (خلفية Bloomy) ───────────────
let CV = null;
try {
    CV = require("@napi-rs/canvas");
    for (const f of ["cairo-arabic-700-normal.woff", "cairo-latin-700-normal.woff"]) { try { CV.GlobalFonts.registerFromPath(require.resolve("@fontsource/cairo/files/" + f), "Cairo"); } catch {} }
} catch {}
const FONT = "Cairo, sans-serif";
const fmt = n => Number(n || 0).toLocaleString("en-US");
const BG_FILE = path.join(__dirname, "..", "..", "assets", "banner.jpg");
let _bg = null;
const bgImage = async () => { try { return _bg ||= await CV.loadImage(BG_FILE); } catch { return null; } };

function rr(x, px, py, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(px, py, w, h, r); else { x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); } }
// خلفية: صورة Bloomy مقصوصة (cover) + تعتيم أغمق على اليسار عشان النص يبان
async function card(W, H) {
    const c = CV.createCanvas(W, H), x = c.getContext("2d");
    x.save(); rr(x, 0, 0, W, H, 30); x.clip();
    x.fillStyle = "#0b0b0d"; x.fillRect(0, 0, W, H);
    const bg = await bgImage();
    if (bg) { const k = Math.max(W / bg.width, H / bg.height), w = bg.width * k, h = bg.height * k; x.drawImage(bg, (W - w) / 2, (H - h) / 2, w, h); }
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(6,6,8,0.9)"); g.addColorStop(0.55, "rgba(6,6,8,0.74)"); g.addColorStop(1, "rgba(6,6,8,0.45)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.restore();
    x.strokeStyle = "rgba(255,255,255,0.22)"; x.lineWidth = 2; rr(x, 1, 1, W - 2, H - 2, 30); x.stroke();
    return { c, x };
}
async function avatar(x, user, cx, cy, r) {
    const img = await CV.loadImage(user.displayAvatarURL({ extension: "png", size: 256 })).catch(() => null);
    x.save(); x.shadowColor = "rgba(255,255,255,0.35)"; x.shadowBlur = 22; x.beginPath(); x.arc(cx, cy, r + 5, 0, Math.PI * 2); x.fillStyle = "#e9edf2"; x.fill(); x.restore();
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    if (img) x.drawImage(img, cx - r, cy - r, r * 2, r * 2); else { x.fillStyle = "#2a2d33"; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
    x.restore();
}
function bar(x, px, py, w, h, pct) {
    x.fillStyle = "rgba(255,255,255,0.16)"; rr(x, px, py, w, h, h / 2); x.fill();
    const fw = Math.max(h, w * Math.min(1, Math.max(0, pct)));
    const g = x.createLinearGradient(px, 0, px + w, 0); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#9aa3af");
    x.save(); x.shadowColor = "rgba(255,255,255,0.45)"; x.shadowBlur = 12; x.fillStyle = g; rr(x, px, py, fw, h, h / 2); x.fill(); x.restore();
}
const txt = (x, t, px, py, size, color = "#fff", align = "left", maxW) => { x.font = `bold ${size}px ${FONT}`; x.fillStyle = color; x.textAlign = align; x.textBaseline = "middle"; x.direction = "ltr"; maxW ? x.fillText(String(t), px, py, maxW) : x.fillText(String(t), px, py); };

// كرت الرانك: صورة العضو، الاسم، شريط التقدم، اللفل والترتيب
async function renderRankCard(member, u, rank) {
    if (!CV) throw new Error("canvas غير متوفر");
    const { c, x } = await card(1000, 320);
    await avatar(x, member.user || member, 150, 160, 92);
    txt(x, member.displayName, 275, 78, 42, "#fff", "left", 470);
    txt(x, `${fmt(u.into)} / ${fmt(u.next)} XP`, 275, 128, 26, "rgba(255,255,255,0.78)");
    bar(x, 275, 158, 470, 30, u.into / u.next);
    txt(x, `رسائل ${fmt(u.messages)}   •   فويس ${fmt(Math.floor(u.voiceSeconds / 60))} دقيقة   •   إجمالي ${fmt(u.xp)} XP`, 275, 226, 22, "rgba(255,255,255,0.62)", "left", 470);
    x.strokeStyle = "rgba(255,255,255,0.18)"; x.lineWidth = 2; x.beginPath(); x.moveTo(775, 50); x.lineTo(775, 270); x.stroke();
    txt(x, "LEVEL", 868, 76, 24, "rgba(255,255,255,0.7)", "center"); txt(x, u.level, 868, 128, 66, "#fff", "center");
    txt(x, "RANK", 868, 196, 24, "rgba(255,255,255,0.7)", "center"); txt(x, "#" + (rank || "-"), 868, 246, 50, "#fff", "center");
    return c.toBuffer("image/png");
}

// كرت اللفل أب
async function renderLevelUpCard(member, level, role) {
    if (!CV) throw new Error("canvas غير متوفر");
    const { c, x } = await card(900, 280);
    await avatar(x, member.user || member, 140, 140, 84);
    txt(x, "LEVEL UP", 265, 62, 30, "rgba(255,255,255,0.75)");
    txt(x, level, 265, 142, 96, "#fff");
    txt(x, member.displayName, 265, 216, 32, "#fff", "left", 580);
    if (role) txt(x, `رتبة جديدة: ${role.name}`, 265, 250, 22, "rgba(255,255,255,0.7)", "left", 580);
    return c.toBuffer("image/png");
}

// كرت التوب 10
async function renderTopCard(guild, rows) {
    if (!CV) throw new Error("canvas غير متوفر");
    const rowH = 74, H = 120 + rows.length * rowH + 20, { c, x } = await card(1000, H);
    txt(x, "TOP " + rows.length, 50, 56, 40); txt(x, guild.name, 950, 56, 26, "rgba(255,255,255,0.7)", "right", 560);
    x.strokeStyle = "rgba(255,255,255,0.18)"; x.lineWidth = 2; x.beginPath(); x.moveTo(40, 96); x.lineTo(960, 96); x.stroke();
    const top = rows[0] ? rows[0].xp || 1 : 1, MEDAL = ["#ffd24a", "#d7dde6", "#d99a6c"];
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i], y = 120 + i * rowH, cy = y + rowH / 2 - 4, mem = guild.members.cache.get(r.id);
        x.fillStyle = i < 3 ? MEDAL[i] : "rgba(255,255,255,0.16)"; x.beginPath(); x.arc(70, cy, 22, 0, Math.PI * 2); x.fill();
        txt(x, i + 1, 70, cy, 24, i < 3 ? "#111" : "#fff", "center");
        if (mem) await avatar(x, mem.user, 142, cy, 26);
        txt(x, mem ? mem.displayName : r.id, 190, cy - 12, 26, "#fff", "left", 330);
        bar(x, 190, cy + 12, 330, 12, r.xp / top);
        txt(x, `LEVEL ${r.level}`, 950, cy - 12, 24, "#fff", "right"); txt(x, `${fmt(r.xp)} XP`, 950, cy + 14, 20, "rgba(255,255,255,0.65)", "right");
    }
    return c.toBuffer("image/png");
}
function rankOf(g, u) { const all = Pro.get(usersKey(g)) || {}; return Object.entries(all).sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0)).findIndex(([id]) => id === u) + 1; }

module.exports = {
    renderRankCard, renderTopCard, rankOf,
    CHAT_XP, VOICE_XP_PER_MINUTE, need, levelOf, isEnabled, setEnabled, getLevelChannelId, setLevelChannel, getRoleRewards, setRoleRewards,
    getUser, addXp, top, applyRoleRewards, renderLevelUpCard, getCfg
};
