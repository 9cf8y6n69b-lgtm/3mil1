const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'levelupchannel', adminOnly:true,
  async execute(message, args) {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply({embeds:[err('Mention a channel.')]});
    db.prepare('INSERT OR IGNORE INTO level_settings (guild_id) VALUES (?)').run(message.guild.id);
    db.prepare('UPDATE level_settings SET levelup_channel=? WHERE guild_id=?').run(ch.id, message.guild.id);
    message.reply({embeds:[ok(`Level-up notifications set to ${ch}.`)]});
  }
};
