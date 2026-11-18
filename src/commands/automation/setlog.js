const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setlog', adminOnly:true,
  async execute(message, args) {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply({embeds:[err('Mention a channel.')]});
    const gid = message.guild.id;
    db.prepare('INSERT OR IGNORE INTO log_settings (guild_id) VALUES (?)').run(gid);
    db.prepare('UPDATE log_settings SET messages_channel=?,moderation_channel=?,joins_channel=?,voice_channel=? WHERE guild_id=?')
      .run(ch.id, ch.id, ch.id, ch.id, gid);
    db.prepare('UPDATE log_settings SET messages_enabled=1,moderation_enabled=1,joins_enabled=1,voice_enabled=1 WHERE guild_id=?').run(gid);
    message.reply({embeds:[ok(`All logs set to ${ch}. Use \`#log <type> off\` to disable specific ones.`)]});
  }
};
