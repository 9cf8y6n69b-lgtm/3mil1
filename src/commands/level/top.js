const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const config = require('../../../config/config');
module.exports = { name:'top', aliases:['leaderboard','lb'],
  async execute(message) {
    const gid  = message.guild.id;
    const top  = db.prepare('SELECT * FROM levels WHERE guild_id=? ORDER BY xp DESC LIMIT 10').all(gid);
    if (!top.length) return message.reply({embeds:[{color:0x7C3AED,description:'No level data yet.'}]});
    const medals = ['🥇','🥈','🥉'];
    const lines = await Promise.all(top.map(async(r,i)=>{
      let name;
      try { name=(await message.client.users.fetch(r.user_id)).username; } catch { name=`User#${r.user_id.slice(-4)}`; }
      return `${medals[i]||`**${i+1}.**`} **${name}** — Level ${r.level} | ${r.xp} XP`;
    }));
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED').setTitle('✨ XP Leaderboard')
      .setDescription(lines.join('\n')).setThumbnail(message.guild.iconURL({dynamic:true}))
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
