const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'punishment', adminOnly:true,
  async execute(message, args) {
    const v = args[0]?.toLowerCase();
    if (!['ban','kick','mute'].includes(v)) return message.reply({embeds:[err('Valid options: `ban`, `kick`, `mute`')]});
    db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(message.guild.id);
    db.prepare('UPDATE protection SET punishment=?, antispam_action=? WHERE guild_id=?').run(v, v, message.guild.id);
    message.reply({embeds:[ok(`Punishment set to **${v}** (used by anti-spam).`)]});
  }
};
