const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setwelcomemsg', adminOnly:true,
  async execute(message, args) {
    const msg = args.join(' ');
    if (!msg) return message.reply({embeds:[err('Provide a message.\nPlaceholders: `{user}` `{username}` `{server}` `{membercount}`')]});
    db.prepare('UPDATE guild_settings SET welcome_msg=? WHERE guild_id=?').run(msg, message.guild.id);
    message.reply({embeds:[ok(`Welcome message set to:\n> ${msg}`)]});
  }
};
