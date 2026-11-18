const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setleavemsg', adminOnly:true,
  async execute(message, args) {
    const msg = args.join(' ');
    if (!msg) return message.reply({embeds:[err('Provide a message.\nPlaceholders: `{username}` `{server}` `{membercount}`')]});
    db.prepare('UPDATE guild_settings SET leave_msg=? WHERE guild_id=?').run(msg, message.guild.id);
    message.reply({embeds:[ok(`Leave message set to:\n> ${msg}`)]});
  }
};
