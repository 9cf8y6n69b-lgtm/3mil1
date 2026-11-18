const { EmbedBuilder } = require('discord.js');
const { getGuild, getLogs, replacePlaceholders } = require('../database/db');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const gid = member.guild.id;
    require('../utils/invites').recordLeave(member);
    require('../utils/antinuke').trackAction(member.guild, 'kick', member.id, client);
    const g   = getGuild(gid);
    if (g?.leave_channel) {
      const ch = member.guild.channels.cache.get(g.leave_channel);
      if (ch) {
        const text = replacePlaceholders(g.leave_msg||'**{username}** left.', {
          user:`<@${member.id}>`, username:member.user.username,
          server:member.guild.name, membercount:member.guild.memberCount,
        });
        ch.send(text).catch(()=>{});
      }
    }
    const logs = getLogs(gid);
    if (logs?.joins_enabled && logs?.joins_channel) {
      const ch = member.guild.channels.cache.get(logs.joins_channel);
      if (ch) {
        const e = new EmbedBuilder().setColor('#EF4444').setTitle('📤 Member Left')
          .setDescription(`${member.user.tag}\n\`${member.id}\``)
          .setThumbnail(member.user.displayAvatarURL({dynamic:true})).setTimestamp();
        ch.send({embeds:[e]}).catch(()=>{});
      }
    }
  }
};
