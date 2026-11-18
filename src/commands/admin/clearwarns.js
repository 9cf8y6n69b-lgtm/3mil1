const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'clearwarns', aliases:['clearwarn'], adminOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    db.prepare('DELETE FROM warnings WHERE guild_id=? AND user_id=?').run(message.guild.id, t.id);
    message.reply({embeds:[ok(`All warnings cleared for **${t.user.tag}**.`)]});
  }
};
