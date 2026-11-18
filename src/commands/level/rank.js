const { EmbedBuilder } = require('discord.js');
const { getLevel, getLvlCfg, xpForLevel, db } = require('../../database/db');
const { err } = require('../../utils/embed');
const config = require('../../../config/config');

module.exports = { name:'rank', aliases:['level','xp'],
  async execute(message, args) {
    const t = message.mentions.members.first() || message.member;
    const gid = message.guild.id;
    const data = getLevel(t.id, gid);
    const nextXp = xpForLevel(data.level+1);
    const pct = Math.floor((data.xp / nextXp)*100);
    const bar = '█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));

    const allUsers = db.prepare('SELECT * FROM levels WHERE guild_id=? ORDER BY xp DESC').all(gid);
    const rank = allUsers.findIndex(u=>u.user_id===t.id)+1;

    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED')
      .setTitle(`✨ ${t.user.username}'s Rank`)
      .setThumbnail(t.user.displayAvatarURL({dynamic:true}))
      .addFields(
        {name:'🏆 Rank',    value:`**#${rank}**`,                               inline:true},
        {name:'📊 Level',   value:`**${data.level}**`,                          inline:true},
        {name:'💬 Messages',value:`**${data.messages}**`,                       inline:true},
        {name:'✨ XP',      value:`**${data.xp}** / **${nextXp}** (${pct}%)\n\`${bar}\``},
      )
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
