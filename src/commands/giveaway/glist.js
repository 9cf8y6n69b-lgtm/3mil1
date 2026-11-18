const { EmbedBuilder } = require('discord.js');
const { err } = require('../../utils/embed');
const { db } = require('../../database/db');
const config = require('../../../config/config');
module.exports = { name:'glist',
  async execute(message) {
    const gws = db.prepare('SELECT * FROM giveaways WHERE guild_id=? AND ended=0 ORDER BY end_time ASC').all(message.guild.id);
    if (!gws.length) return message.reply({embeds:[err('No active giveaways.')]});
    const lines = gws.map(g=>`🎉 **${g.prize}** — ${g.winners} winner(s) — ends <t:${g.end_time}:R> — [Jump](https://discord.com/channels/${g.guild_id}/${g.channel_id}/${g.message_id}) ${g.paused?'*(paused)*':''}`);
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED').setTitle(`🎉 Active Giveaways (${gws.length})`)
      .setDescription(lines.join('\n')).setFooter({text:config.footer}).setTimestamp()]});
  }
};
