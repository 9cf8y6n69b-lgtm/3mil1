const { AuditLogEvent } = require('discord.js');
const { db, getProt } = require('../database/db');
const { punish, modLog } = require('./punish');

const WINDOW = 10_000;           // 10s sliding window
const hits   = new Map();        // `${guild}:${executor}:${type}` -> [timestamps]

/**
 * Called after a ban / kick happened. Finds who did it from the audit log
 * and punishes them if they exceed the configured limit.
 */
async function trackAction(guild, type, targetId, client) {
  try {
    const prot = getProt(guild.id);
    if (!prot?.antinuke) return;

    const evt = type === 'ban' ? AuditLogEvent.MemberBanAdd : AuditLogEvent.MemberKick;
    const logs = await guild.fetchAuditLogs({ type: evt, limit: 5 });
    const entry = logs.entries.find(e => e.target?.id === targetId && Date.now() - e.createdTimestamp < 8000);
    if (!entry?.executor) return;

    const exId = entry.executor.id;
    if (exId === client.user.id || exId === guild.ownerId) return;
    const wl = db.prepare('SELECT 1 FROM protection_whitelist WHERE guild_id=? AND user_id=?').get(guild.id, exId);
    if (wl) return;

    const key = `${guild.id}:${exId}:${type}`;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < WINDOW);
    arr.push(now);
    hits.set(key, arr);

    const limit = type === 'ban' ? (prot.antinuke_ban_limit || 3) : (prot.antinuke_kick_limit || 5);
    if (arr.length < limit) return;
    hits.delete(key);

    const member = await guild.members.fetch(exId).catch(() => null);
    if (!member) return;
    const res = await punish(member, prot.antinuke_action || 'ban', `AntiNuke: mass ${type}`);
    await modLog(guild, `🛡️ **AntiNuke** — ${entry.executor.tag} did ${arr.length} ${type}s in ${WINDOW/1000}s → ${res || 'punishment failed (check my role position)'}`);
  } catch (e) { /* missing audit-log permission etc. */ }
}

module.exports = { trackAction };
