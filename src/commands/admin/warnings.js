const { EmbedBuilder } = require('discord.js');
const { err } = require('../../utils/embed');
const { db } = require('../../database/db');
const config = require('../../../config/config');
module.exports = {
  name:'warnings', aliases:['warns'], modOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first() || message.member;
    const warns = db.prepare('SELECT * FROM warnings WHERE guild_id=? AND user_id=? ORDER BY created_at DESC').all(message.guild.id, t.id);
    if (!warns.length) return message.reply({embeds:[new EmbedBuilder().setColor('#22C55E').setDescription(`✅ **${t.user.tag}** has no warnings.`).setFooter({text:config.footer}).setTimestamp()]});
    const lines = warns.map((w,i)=>`**${i+1}.** ${w.reason} — by <@${w.mod_id}> — <t:${w.created_at}:R>`);
    message.reply({embeds:[new EmbedBuilder().setColor('#F59E0B').setTitle(`⚠️ Warnings — ${t.user.tag}`)
      .setDescription(lines.join('\n')).setFooter({text:`${warns.length} total • ${config.footer}`}).setTimestamp()]});
  }
};
