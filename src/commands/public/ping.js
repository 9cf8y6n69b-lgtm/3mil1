const { EmbedBuilder } = require('discord.js');
const config = require('../../../config/config');

module.exports = {
  name:'ping',
  async execute(message, args, client) {
    const m = await message.reply('🏓 Pinging...');
    m.edit({content:null, embeds:[new EmbedBuilder().setColor('#7C3AED').setTitle('🏓 Pong!')
      .addFields(
        {name:'Bot Latency', value:`**${m.createdTimestamp-message.createdTimestamp}ms**`, inline:true},
        {name:'API Latency', value:`**${Math.round(client.ws.ping)}ms**`, inline:true},
      ).setFooter({text:config.footer}).setTimestamp()]});
  }
};
