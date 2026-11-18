const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setleave', adminOnly:true,
  async execute(message, args) {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply({embeds:[err('Mention a channel.')]});
    db.prepare('UPDATE guild_settings SET leave_channel=? WHERE guild_id=?').run(ch.id, message.guild.id);
    message.reply({embeds:[ok(`Leave channel set to ${ch}.`)]});
  }
};
