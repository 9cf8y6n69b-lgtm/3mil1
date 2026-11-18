const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');

const types = {
  messages:   ['messages_enabled',   'messages_channel'],
  moderation: ['moderation_enabled', 'moderation_channel'],
  joins:      ['joins_enabled',      'joins_channel'],
  voice:      ['voice_enabled',      'voice_channel'],
};

module.exports = {
  name:'log', adminOnly:true,
  async execute(message, args) {
    const gid  = message.guild.id;
    const type = args[0]?.toLowerCase();
    const val  = args[1]?.toLowerCase();

    if (!types[type]) return message.reply({embeds:[err(`Valid types: \`${Object.keys(types).join('`, `')}\``)]});
    if (!['on','off'].includes(val)) return message.reply({embeds:[err('Use `on` or `off`.')]});

    const [enabledCol, channelCol] = types[type];
    const enabled = val === 'on' ? 1 : 0;

    db.prepare('INSERT OR IGNORE INTO log_settings (guild_id) VALUES (?)').run(gid);

    if (enabled) {
      const ch = message.mentions.channels.first();
      if (!ch) return message.reply({embeds:[err('Mention a channel when enabling. Example: `#log messages on #channel`')]});
      db.prepare(`UPDATE log_settings SET ${enabledCol}=1, ${channelCol}=? WHERE guild_id=?`).run(ch.id, gid);
      message.reply({embeds:[ok(`**${type}** logs enabled in ${ch}.`)]});
    } else {
      db.prepare(`UPDATE log_settings SET ${enabledCol}=0 WHERE guild_id=?`).run(gid);
      message.reply({embeds:[ok(`**${type}** logs disabled.`)]});
    }
  }
};
