const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const config = require('../../../config/config');
module.exports = { name:'inviteleaderboard', aliases:['invitetop','itleaderboard'],
  async execute(message) {
    const top = db.prepare('SELECT * FROM invites WHERE guild_id=? ORDER BY total DESC LIMIT 10').all(message.guild.id);
    if (!top.length) return message.reply({embeds:[{color:0x7C3AED,description:'No invite data yet.'}]});
    const medals = ['🥇','🥈','🥉'];
    const lines = await Promise.all(top.map(async(r,i)=>{
      let name; try { name=(await message.client.users.fetch(r.user_id)).username; } catch { name=`User#${r.user_id.slice(-4)}`; }
      return `${medals[i]||`**${i+1}.**`} **${name}** — ${r.total} invites`;
    }));
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED').setTitle('🔗 Invite Leaderboard')
      .setDescription(lines.join('\n')).setFooter({text:config.footer}).setTimestamp()]});
  }
};
