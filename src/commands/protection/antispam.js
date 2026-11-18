const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'antispam', adminOnly:true,
  async execute(message, args) {
    const v = args[0]?.toLowerCase();
    if (!['on','off'].includes(v)) return message.reply({embeds:[err('Use `on` or `off`.')]});
    db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(message.guild.id);
    db.prepare('UPDATE protection SET antispam=? WHERE guild_id=?').run(v==='on'?1:0, message.guild.id);
    message.reply({embeds:[ok(`Antispam **${v}**.`)]});
  }
};
