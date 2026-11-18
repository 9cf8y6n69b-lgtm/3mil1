const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'limit', adminOnly:true,
  async execute(message, args) {
    // Usage: #limit spam 5/10s  OR  #limit ban 3/10s
    const type = args[0]?.toLowerCase();
    const spec = args[1]; // e.g. 5/10s
    if (!type || !spec) return message.reply({embeds:[err('Usage: `#limit spam 5/10s` or `#limit ban 3/10s`')]});
    const [countStr, timeStr] = spec.split('/');
    const count = parseInt(countStr);
    const { parseTime } = require('../../utils/helpers');
    const ms = parseTime(timeStr);
    if (isNaN(count) || !ms) return message.reply({embeds:[err('Invalid format. Example: `5/10s`')]});
    const secs = Math.floor(ms/1000);
    db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(message.guild.id);
    if (type === 'spam') {
      db.prepare('UPDATE protection SET antispam_limit=?, antispam_time=? WHERE guild_id=?').run(count, secs, message.guild.id);
      message.reply({embeds:[ok(`Spam limit: **${count} messages** in **${secs}s**.`)]});
    } else if (type === 'ban') {
      db.prepare('UPDATE protection SET antinuke_ban_limit=? WHERE guild_id=?').run(count, message.guild.id);
      message.reply({embeds:[ok(`Ban limit: **${count}** bans before antinuke triggers.`)]});
    } else if (type === 'kick') {
      db.prepare('UPDATE protection SET antinuke_kick_limit=? WHERE guild_id=?').run(count, message.guild.id);
      message.reply({embeds:[ok(`Kick limit: **${count}** kicks before antinuke triggers.`)]});
    } else {
      message.reply({embeds:[err('Valid types: `spam`, `ban`, `kick`')]});
    }
  }
};
