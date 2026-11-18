// Applies a punishment (ban / kick / mute) to a guild member.
async function punish(member, action, reason) {
  try {
    if (action === 'ban')  { await member.ban({ reason }); return 'banned'; }
    if (action === 'kick') { await member.kick(reason);    return 'kicked'; }
    await member.timeout(60 * 60 * 1000, reason);          // mute = 1h timeout
    return 'muted';
  } catch { return null; }
}

async function modLog(guild, text) {
  try {
    const { getLogs } = require('../database/db');
    const logs = getLogs(guild.id);
    if (!logs?.moderation_enabled || !logs?.moderation_channel) return;
    const ch = guild.channels.cache.get(logs.moderation_channel);
    if (ch) ch.send(text).catch(() => {});
  } catch {}
}

module.exports = { punish, modLog };
