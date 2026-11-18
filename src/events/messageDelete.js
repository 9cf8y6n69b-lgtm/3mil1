const { EmbedBuilder } = require('discord.js');
const { getLogs } = require('../database/db');

module.exports = {
  name: 'messageDelete',
  async execute(msg, client) {
    if (msg.author?.bot || !msg.guild) return;
    const logs = getLogs(msg.guild.id);
    if (!logs?.messages_enabled || !logs?.messages_channel) return;
    const ch = msg.guild.channels.cache.get(logs.messages_channel);
    if (!ch) return;
    ch.send({embeds:[new EmbedBuilder().setColor('#F59E0B').setTitle('🗑️ Message Deleted')
      .addFields(
        {name:'Author',  value:`${msg.author?.tag||'?'} (${msg.author?.id})`, inline:true},
        {name:'Channel', value:`<#${msg.channel.id}>`, inline:true},
        {name:'Content', value:msg.content?.slice(0,1000)||'*No content*'},
      ).setTimestamp()]}).catch(()=>{});
  }
};
