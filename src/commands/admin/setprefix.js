const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setprefix', adminOnly:true,
  async execute(message, args) {
    const p = args[0];
    if (!p || p.length > 5) return message.reply({embeds:[err('Provide a prefix (max 5 chars).')]});
    db.prepare('UPDATE guild_settings SET prefix=? WHERE guild_id=?').run(p, message.guild.id);
    message.reply({embeds:[ok(`Prefix changed to \`${p}\``)]});
  }
};
