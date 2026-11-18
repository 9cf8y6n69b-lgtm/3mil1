const { ok, err } = require('../../utils/embed');
const { db, xpForLevel } = require('../../database/db');
module.exports = { name:'setlevel', adminOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    const lvl = parseInt(args[1]);
    if (!t || isNaN(lvl) || lvl<0) return message.reply({embeds:[err('Usage: `#setlevel @user <level>`')]});
    const xp = xpForLevel(lvl);
    db.prepare('UPDATE levels SET level=?,xp=? WHERE user_id=? AND guild_id=?').run(lvl,xp,t.id,message.guild.id);
    message.reply({embeds:[ok(`Set **${t.user.tag}** to level **${lvl}**.`)]});
  }
};
