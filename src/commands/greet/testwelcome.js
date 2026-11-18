const { EmbedBuilder } = require('discord.js');
const { getGuild, replacePlaceholders } = require('../../database/db');
const { err } = require('../../utils/embed');
module.exports = {
  name:'testwelcome', adminOnly:true,
  async execute(message) {
    const g = getGuild(message.guild.id);
    if (!g?.welcome_channel) return message.reply({embeds:[err('No welcome channel set. Use `#setwelcome #channel`')]});
    const ch = message.guild.channels.cache.get(g.welcome_channel);
    if (!ch) return message.reply({embeds:[err('Welcome channel not found.')]});
    const text = replacePlaceholders(g.welcome_msg || 'Welcome {user}!', {
      user:`<@${message.author.id}>`, username:message.author.username,
      server:message.guild.name, membercount:message.guild.memberCount,
    });
    ch.send({embeds:[new EmbedBuilder().setColor('#'+g.embed_color||'7C3AED')
      .setTitle('👋 Welcome!').setDescription(text)
      .setThumbnail(message.author.displayAvatarURL({dynamic:true}))
      .setFooter({text:'DealerBot • Dev: Youssef'}).setTimestamp()]});
    message.reply({embeds:[{color:0x22C55E, description:'✅ Test welcome sent!'}]});
  }
};
