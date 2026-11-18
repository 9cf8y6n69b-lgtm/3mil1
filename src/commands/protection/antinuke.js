const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'antinuke', adminOnly:true,
  async execute(message, args) {
    const v = args[0]?.toLowerCase();
    const acts = ['ban','kick','mute'];
    if (![ 'on','off', ...acts ].includes(v))
      return message.reply({embeds:[err('Use `on`, `off`, or set the action: `ban` `kick` `mute`.\nLimits: `#limit ban 3/10s` · `#limit kick 5/10s`')]});
    db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(message.guild.id);
    if (acts.includes(v)) {
      db.prepare('UPDATE protection SET antinuke_action=? WHERE guild_id=?').run(v, message.guild.id);
      return message.reply({embeds:[ok(`Anti-nuke action set to **${v}**.`)]});
    }
    db.prepare('UPDATE protection SET antinuke=? WHERE guild_id=?').run(v==='on'?1:0, message.guild.id);
    message.reply({embeds:[ok(`Anti-nuke **${v}**. Mass ban/kick attempts will be punished (whitelisted users and the server owner are exempt).`)]});
  }
};
