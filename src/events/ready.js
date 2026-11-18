const { ActivityType } = require('discord.js');
const chalk = require('chalk');
const config = require('../../config/config');

module.exports = {
  name: 'ready', once: true,
  execute(client) {
    console.log(chalk.bold.magenta(`
  ╔══════════════════════════════════════╗
  ║  🤖  ${(client.user.tag).padEnd(28)}  ║
  ║  🌐  ${(client.guilds.cache.size+' servers').padEnd(28)}  ║
  ║  💎  Plus System Active              ║
  ║  Dev: Youssef                 ║
  ╚══════════════════════════════════════╝`));

    let i=0;
    const s=[
      {name:`${config.prefix}help | DealerBot`, type:ActivityType.Watching},
      {name:`${client.guilds.cache.size} servers`, type:ActivityType.Watching},
      {name:`${config.prefix}help`, type:ActivityType.Listening},
    ];
    const tick=()=>{ client.user.setPresence({activities:[s[i%s.length]],status:'online'}); i++; };
    tick(); setInterval(tick, 20000);

    // Cache invites for invite tracking
    client.guilds.cache.forEach(g => require('../utils/invites').cacheGuild(g));

    // Giveaway ticker
    setInterval(()=>checkGiveaways(client), 10000);
  }
};

async function checkGiveaways(client) {
  const { db } = require('../database/db');
  const now = Math.floor(Date.now()/1000);
  const ended = db.prepare(`SELECT * FROM giveaways WHERE ended=0 AND paused=0 AND end_time<=?`).all(now);
  for (const gw of ended) {
    try {
      const guild   = client.guilds.cache.get(gw.guild_id); if (!guild) continue;
      const channel = guild.channels.cache.get(gw.channel_id); if (!channel) continue;
      const msg     = await channel.messages.fetch(gw.message_id).catch(()=>null);
      if (!msg) { db.prepare('UPDATE giveaways SET ended=1 WHERE id=?').run(gw.id); continue; }

      const entries = JSON.parse(gw.entries||'[]');
      db.prepare('UPDATE giveaways SET ended=1 WHERE id=?').run(gw.id);

      if (!entries.length) {
        msg.edit({ content:'🎉 **GIVEAWAY ENDED**', embeds:[{color:0x7C3AED,title:`🎉 ${gw.prize}`,description:'No valid entries. No winner!',footer:{text:'DealerBot • Dev: Youssef'}}]}).catch(()=>{});
        continue;
      }

      const shuffled = [...entries].sort(()=>Math.random()-0.5);
      const winners  = shuffled.slice(0, Math.min(gw.winners, shuffled.length));
      const wMentions= winners.map(id=>`<@${id}>`).join(', ');

      msg.edit({ content:`🎉 **GIVEAWAY ENDED**`, embeds:[{color:0x22C55E,title:`🎉 ${gw.prize}`,description:`**Winner(s):** ${wMentions}\n**Hosted by:** <@${gw.host_id}>\n**Entries:** ${entries.length}`,footer:{text:'DealerBot • Dev: Youssef'}}]}).catch(()=>{});
      channel.send(`🎊 Congratulations ${wMentions}! You won **${gw.prize}**!`).catch(()=>{});
    } catch {}
  }
}
