const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'antibots', adminOnly:true,
  async execute(message, args) {
    const v = args[0]?.toLowerCase();
    if (!['on','off'].includes(v)) return message.reply({embeds:[err('Use `on` or `off`.')]});
    db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(message.guild.id);
    db.prepare('UPDATE protection SET antibots=? WHERE guild_id=?').run(v==='on'?1:0, message.guild.id);
    message.reply({embeds:[ok(`Anti-bots **${v}**. New bots will be ${v==='on'?'kicked':'allowed'}.`)]});
  }
};
