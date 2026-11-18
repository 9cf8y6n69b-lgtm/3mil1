const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'resetinvites', adminOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (t) {
      db.prepare('DELETE FROM invites WHERE guild_id=? AND user_id=?').run(message.guild.id, t.id);
      return message.reply({embeds:[ok(`Reset invites for **${t.user.tag}**.`)]});
    }
    // reset all
    db.prepare('DELETE FROM invites WHERE guild_id=?').run(message.guild.id);
    message.reply({embeds:[ok('Reset all invite data for this server.')]});
  }
};
