const { Collection } = require('discord.js');
const { getGuild, getProt, getLvlCfg, getLevel, xpForLevel, db } = require('../database/db');
const { err } = require('../utils/embed');
const { isMod, rng } = require('../utils/helpers');
const config = require('../../config/config');
const { punish, modLog } = require('../utils/punish');

const spamMap = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const gid    = message.guild.id;
    const gConf  = getGuild(gid);
    const prefix = gConf?.prefix || config.prefix;
    const prot   = getProt(gid);

    // ── antispam ────────────────────────────────────────
    if (prot?.antispam && !isMod(message.member, gConf?.mod_role)) {
      const wl = db.prepare('SELECT 1 FROM protection_whitelist WHERE guild_id=? AND user_id=?').get(gid, message.author.id);
      if (!wl) {
        if (!spamMap.has(gid)) spamMap.set(gid, new Map());
        const gMap = spamMap.get(gid);
        const key  = message.author.id;
        if (!gMap.has(key)) gMap.set(key, { n:0, t:null });
        const u = gMap.get(key);
        u.n++;
        if (u.t) clearTimeout(u.t);
        u.t = setTimeout(()=>gMap.delete(key), (prot.antispam_time||5)*1000);
        if (u.n >= (prot.antispam_limit||5)) {
          gMap.delete(key);
          const res = await punish(message.member, prot.antispam_action||prot.punishment||'mute', 'AutoMod: Spam');
          modLog(message.guild, `🤖 AutoMod — **Spam** by ${message.author.tag} → ${res || 'failed (check my role position)'}`);
          return;
        }
      }
    }

    // ── anti-links ──────────────────────────────────────
    if (prot?.antilinks && !isMod(message.member, gConf?.mod_role)) {
      const wl = db.prepare('SELECT 1 FROM protection_whitelist WHERE guild_id=? AND user_id=?').get(gid, message.author.id);
      if (!wl && /(https?:\/\/|discord\.gg\/|www\.)/i.test(message.content)) {
        await message.delete().catch(()=>{});
        const act = prot.antilinks_action;
        if (act && act !== 'delete') {
          const res = await punish(message.member, act, 'AutoMod: Links');
          modLog(message.guild, `🤖 AutoMod — **Link** by ${message.author.tag} → ${res || 'failed'}`);
        }
        return;
      }
    }

    // ── XP ──────────────────────────────────────────────
    if (!message.content.startsWith(prefix)) {
      await handleXP(message, gid);
      return;
    }

    // ── parse command ───────────────────────────────────
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const name = args.shift().toLowerCase();
    const cmd  = client.commands.get(name) || client.commands.get(client.aliases.get(name));
    if (!cmd) return;

    // ── guards ──────────────────────────────────────────
    if (cmd.adminOnly && !message.member.permissions.has('Administrator'))
      return message.reply({embeds:[err('You need **Administrator** permission.')]});
    if (cmd.modOnly && !isMod(message.member, gConf?.mod_role))
      return message.reply({embeds:[err('You need a **Moderator** role.')]});
    if (cmd.ownerOnly && message.author.id !== config.ownerID)
      return message.reply({embeds:[err('This command is for the bot owner only.')]});
    if (cmd.plusOnly) {
      const { getActivePlus } = require('../database/db');
      if (!getActivePlus(gid)) return message.reply({embeds:[err('This command requires a **💎 Plus** subscription.')]});
    }

    // ── cooldown ─────────────────────────────────────────
    if (!client.cooldowns.has(cmd.name)) client.cooldowns.set(cmd.name, new Collection());
    const ts  = client.cooldowns.get(cmd.name);
    const cd  = (cmd.cooldown||3)*1000;
    const now = Date.now();
    if (ts.has(message.author.id)) {
      const exp = ts.get(message.author.id)+cd;
      if (now<exp) return message.reply({embeds:[err(`Wait **${((exp-now)/1000).toFixed(1)}s** before using \`${cmd.name}\` again.`)]});
    }
    ts.set(message.author.id, now);
    setTimeout(()=>ts.delete(message.author.id), cd);

    // ── execute ──────────────────────────────────────────
    try {
      await cmd.execute(message, args, client);
    } catch(e) {
      console.error(`[CMD] ${cmd.name}:`, e);
      message.reply({embeds:[err('An unexpected error occurred.')]}).catch(()=>{});
    }
  }
};

async function handleXP(message, gid) {
  try {
    const lvlCfg = getLvlCfg(gid);
    if (!lvlCfg?.enabled) return;
    const uid  = message.author.id;
    const now  = Math.floor(Date.now()/1000);
    const data = getLevel(uid, gid);
    if (now - data.last_xp < (lvlCfg.xp_cooldown||60)) return;
    const gained  = rng(lvlCfg.xp_min||15, lvlCfg.xp_max||40);
    const newXp   = data.xp + gained;
    let newLvl    = data.level;
    while (newXp >= xpForLevel(newLvl+1)) newLvl++;
    db.prepare('UPDATE levels SET xp=?,level=?,messages=messages+1,last_xp=? WHERE user_id=? AND guild_id=?')
      .run(newXp, newLvl, now, uid, gid);
    if (newLvl > data.level) {
      const ch = lvlCfg.levelup_channel
        ? message.guild.channels.cache.get(lvlCfg.levelup_channel)
        : message.channel;
      if (ch) {
        const msg = (lvlCfg.levelup_msg||'GG {user}! You reached level **{level}**! 🎉')
          .replace('{user}',`<@${uid}>`).replace('{level}',newLvl);
        ch.send(msg).catch(()=>{});
      }
    }
  } catch {}
}

