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

let CV = null;
try { CV = require("@napi-rs/canvas"); } catch {}
async function renderLevelUpCard(member, level, role) {
    if (!CV) throw new Error("canvas غير متوفر");
    const W = 900, H = 280, c = CV.createCanvas(W, H), x = c.getContext("2d");
    x.fillStyle = "#0e0f11"; x.fillRect(0, 0, W, H);
    try {
        const bg = await CV.loadImage(path.join(__dirname, "..", "..", "assets", "banner.jpg"));
        x.globalAlpha = 0.55; x.drawImage(bg, 0, 0, W, H); x.globalAlpha = 1;
        x.fillStyle = "rgba(0,0,0,0.45)"; x.fillRect(0, 0, W, H);
    } catch {}
    const av = await CV.loadImage(member.displayAvatarURL({ extension: "png", size: 256 })).catch(() => null);
    x.save(); x.beginPath(); x.arc(140, 140, 90, 0, Math.PI * 2); x.clip();
    if (av) x.drawImage(av, 50, 50, 180, 180); x.restore();
    x.lineWidth = 5; x.strokeStyle = "#ffffff"; x.beginPath(); x.arc(140, 140, 92, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "#ffffff"; x.textAlign = "left";
    x.font = "bold 34px Cairo, CairoLat, sans-serif"; x.fillText("LEVEL UP", 270, 85);
    x.font = "bold 92px Cairo, CairoLat, sans-serif"; x.fillText(String(level), 270, 180);
    x.font = "bold 28px Cairo, CairoAr, sans-serif";
    x.fillText(String(member.displayName).slice(0, 28), 270, 225);
    if (role) { x.fillStyle = "rgba(255,255,255,0.75)"; x.font = "22px Cairo, CairoAr, sans-serif"; x.fillText(`🏅 ${role.name}`.slice(0, 40), 270, 258); }
    return c.toBuffer("image/png");
}

module.exports = {
    CHAT_XP, VOICE_XP_PER_MINUTE, need, levelOf, isEnabled, setEnabled, getLevelChannelId, setLevelChannel, getRoleRewards, setRoleRewards,
    getUser, addXp, top, applyRoleRewards, renderLevelUpCard, getCfg
};
