const { db } = require('../database/db');

const cache = new Map(); // guildId -> Map(code -> uses)

async function cacheGuild(guild) {
  try {
    const inv = await guild.invites.fetch();
    cache.set(guild.id, new Map(inv.map(i => [i.code, i.uses || 0])));
  } catch { /* no Manage Server permission */ }
}

function addInvite(inv) {
  if (!cache.has(inv.guild.id)) cache.set(inv.guild.id, new Map());
  cache.get(inv.guild.id).set(inv.code, inv.uses || 0);
}
function removeInvite(inv) { cache.get(inv.guild.id)?.delete(inv.code); }

// Returns the inviter id of the invite that was just used (or null)
async function findUsedInvite(guild) {
  try {
    const before = cache.get(guild.id) || new Map();
    const now = await guild.invites.fetch();
    let used = null;
    for (const i of now.values()) {
      if ((i.uses || 0) > (before.get(i.code) || 0)) { used = i; break; }
    }
    cache.set(guild.id, new Map(now.map(i => [i.code, i.uses || 0])));
    return used?.inviter?.id || null;
  } catch { return null; }
}

function recordJoin(member, inviterId) {
  if (!inviterId) return;
  const gid = member.guild.id;
  const fake = (Date.now() - member.user.createdTimestamp) < 7 * 86400000 ? 1 : 0;
  db.prepare('INSERT OR IGNORE INTO invites (guild_id,user_id) VALUES (?,?)').run(gid, inviterId);
  db.prepare('UPDATE invites SET total=total+1, fake=fake+? WHERE guild_id=? AND user_id=?').run(fake, gid, inviterId);
  db.prepare('INSERT OR REPLACE INTO invite_joins (guild_id,member_id,inviter_id) VALUES (?,?,?)').run(gid, member.id, inviterId);
}

function recordLeave(member) {
  const row = db.prepare('SELECT inviter_id FROM invite_joins WHERE guild_id=? AND member_id=?').get(member.guild.id, member.id);
  if (!row) return;
  db.prepare('UPDATE invites SET left_count=left_count+1 WHERE guild_id=? AND user_id=?').run(member.guild.id, row.inviter_id);
  db.prepare('DELETE FROM invite_joins WHERE guild_id=? AND member_id=?').run(member.guild.id, member.id);
}

module.exports = { cacheGuild, addInvite, removeInvite, findUsedInvite, recordJoin, recordLeave };
