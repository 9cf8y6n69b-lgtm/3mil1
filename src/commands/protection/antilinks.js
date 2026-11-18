const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');

module.exports = { name:'antilinks', adminOnly:true,
  async execute(message, args) {
    const v = args[0]?.toLowerCase();
    const acts = ['delete','mute','kick','ban'];
    if (![ 'on','off', ...acts ].includes(v))
      return message.reply({embeds:[err('Use `on`, `off`, or an action: `delete` `mute` `kick` `ban`.')]});
    db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(message.guild.id);
    if (acts.includes(v)) {
      db.prepare('UPDATE protection SET antilinks_action=? WHERE guild_id=?').run(v, message.guild.id);
      return message.reply({embeds:[ok(`Anti-links action set to **${v}**.`)]});
    }
    db.prepare('UPDATE protection SET antilinks=? WHERE guild_id=?').run(v==='on'?1:0, message.guild.id);
    message.reply({embeds:[ok(`Anti-links **${v}**.`)]});
  }
};
