const { getGuild, replacePlaceholders } = require('../../database/db');
const { err } = require('../../utils/embed');
module.exports = {
  name:'testleave', adminOnly:true,
  async execute(message) {
    const g = getGuild(message.guild.id);
    if (!g?.leave_channel) return message.reply({embeds:[err('No leave channel set.')]});
    const ch = message.guild.channels.cache.get(g.leave_channel);
    if (!ch) return message.reply({embeds:[err('Leave channel not found.')]});
    const text = replacePlaceholders(g.leave_msg || '**{username}** left.', {
      user:`<@${message.author.id}>`, username:message.author.username,
      server:message.guild.name, membercount:message.guild.memberCount,
    });
    ch.send(text);
    message.reply({embeds:[{color:0x22C55E, description:'✅ Test leave sent!'}]});
  }
};
