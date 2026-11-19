// إعدادات الأوامر لكل سيرفر: تعطيل، اختصارات (aliases)، رتبة مطلوبة، روم محدد
const Pro = require("../prodb");

const owners = String(process.env.OWNER_IDS || "").split(/[,\s]+/).filter(Boolean);
const key = g => `cmdcfg_${g}`;
const all = g => Pro.get(key(g)) || {};
const DEF = { disabled: false, aliases: [], roleId: null, channelId: null };

const get = (g, name) => ({ ...DEF, ...(all(g)[name] || {}) });
function set(g, name, patch) { const m = all(g); m[name] = { ...get(g, name), ...patch }; Pro.set(key(g), m); }
function reset(g, name) { const m = all(g); delete m[name]; Pro.set(key(g), m); }

const lc = x => String(x).toLowerCase();

// هل الكلمة محجوزة لأمر ثاني (اسم أو اختصار)؟
function taken(client, g, word, exceptName) {
    const w = lc(word), m = all(g);
    for (const c of client.commands.values()) {
        if (c.name === exceptName) continue;
        if (lc(c.name) === w || (c.aliases || []).some(a => lc(a) === w)) return true;
    }
    return Object.entries(m).some(([n, cfg]) => n !== exceptName && (cfg.aliases || []).some(a => lc(a) === w));
}

// يلقى الأمر بالاسم أو الاختصار المدمج أو اختصار الهيلب
function find(client, g, word) {
    const w = lc(word);
    const hit = client.commands.get(w) || client.commands.find(c => (c.aliases || []).some(a => lc(a) === w));
    if (hit) return hit;
    const m = all(g);
    for (const [n, cfg] of Object.entries(m)) if ((cfg.aliases || []).some(a => lc(a) === w)) return client.commands.get(n) || null;
    return null;
}

function blockReason(guild, member, channel, name) {
    const cfg = get(guild.id, name);
    if (cfg.disabled) return "هذا الأمر معطّل.";
    if (!member || member.permissions.has("ADMINISTRATOR") || owners.includes(member.id)) return null;
    if (cfg.roleId && !member.roles.cache.has(cfg.roleId)) return `هذا الأمر لأصحاب رتبة <@&${cfg.roleId}> فقط.`;
    if (cfg.channelId && channel.id !== cfg.channelId) return `استخدم هذا الأمر في <#${cfg.channelId}>.`;
    return null;
}

module.exports = { owners, get, set, reset, taken, find, blockReason, all };
