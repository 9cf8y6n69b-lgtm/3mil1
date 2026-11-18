const { ok, err } = require('../../utils/embed');
const { PermissionFlagsBits } = require('discord.js');
module.exports = {
  name:'lock', modOnly:true,
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    try {
      await ch.permissionOverwrites.edit(message.guild.id, {SendMessages:false});
      message.reply({embeds:[ok(`🔒 **${ch.name}** has been locked.`)]});
    } catch { message.reply({embeds:[err('Failed to lock channel. Check permissions.')]}); }
  }
};
