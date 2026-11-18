const { ok, err } = require('../../utils/embed');
const { EmbedBuilder } = require('discord.js');
const { db, getLogs } = require('../../database/db');
const { _modLog } = require('./_modlog');
const config = require('../../../config/config');

module.exports = {
  name:'warn', modOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    const reason = args.slice(1).join(' ') || 'No reason provided';
    db.prepare('INSERT INTO warnings (guild_id,user_id,mod_id,reason) VALUES (?,?,?,?)').run(message.guild.id, t.id, message.author.id, reason);
    const count = db.prepare('SELECT COUNT(*) as c FROM warnings WHERE guild_id=? AND user_id=?').get(message.guild.id, t.id).c;
    message.reply({embeds:[ok(`**${t.user.tag}** warned. (${count} total warnings)\n📝 Reason: ${reason}`)]});
    _modLog(message.guild, '⚠️ Warn', t.user, message.author, reason);
    try { await t.user.send(`⚠️ You have been warned in **${message.guild.name}**.\nReason: ${reason}`); } catch {}
  }
};
