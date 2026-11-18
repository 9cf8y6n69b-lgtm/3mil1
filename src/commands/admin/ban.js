const { EmbedBuilder } = require('discord.js');
const { ok, err } = require('../../utils/embed');
const { getLogs } = require('../../database/db');
const config = require('../../../config/config');

module.exports = {
  name:'ban', adminOnly:true,
  async execute(message, args, client) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(()=>null);
    if (!target) return message.reply({embeds:[err('Mention a valid member.')]});
    if (!target.bannable) return message.reply({embeds:[err('I cannot ban this member.')]});
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.ban({reason, deleteMessageSeconds:86400});
    message.reply({embeds:[ok(`**${target.user.tag}** has been banned.\n📝 Reason: ${reason}`)]});
    modLog(message.guild, '🔨 Ban', target.user, message.author, reason);
  }
};

async function modLog(guild, action, target, mod, reason) {
  const logs = getLogs(guild.id);
  if (!logs?.moderation_enabled || !logs?.moderation_channel) return;
  const ch = guild.channels.cache.get(logs.moderation_channel);
  if (!ch) return;
  ch.send({embeds:[new EmbedBuilder().setColor('#EF4444').setTitle(action)
    .addFields(
      {name:'User',   value:`${target.tag} (${target.id})`,  inline:true},
      {name:'Mod',    value:`${mod.tag} (${mod.id})`,         inline:true},
      {name:'Reason', value:reason},
    ).setFooter({text:config.footer}).setTimestamp()]}).catch(()=>{});
}

module.exports._modLog = modLog;
