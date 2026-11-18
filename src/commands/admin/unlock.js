const { ok, err } = require('../../utils/embed');
module.exports = {
  name:'unlock', modOnly:true,
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    try {
      await ch.permissionOverwrites.edit(message.guild.id, {SendMessages:null});
      message.reply({embeds:[ok(`🔓 **${ch.name}** has been unlocked.`)]});
    } catch { message.reply({embeds:[err('Failed.')]}); }
  }
};
