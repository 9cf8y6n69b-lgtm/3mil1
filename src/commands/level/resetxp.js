const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'resetxp', adminOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a member.')]});
    db.prepare('UPDATE levels SET xp=0,level=0,messages=0 WHERE user_id=? AND guild_id=?').run(t.id,message.guild.id);
    message.reply({embeds:[ok(`Reset XP for **${t.user.tag}**.`)]});
  }
};
