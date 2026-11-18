const { ok, err } = require('../../utils/embed');
const { getLogs, db } = require('../../database/db');
const { EmbedBuilder } = require('discord.js');
const config = require('../../../config/config');

function modLog(guild, action, target, mod, reason) {
  const logs = getLogs(guild.id);
  if (!logs?.moderation_enabled || !logs?.moderation_channel) return;
  const ch = guild.channels.cache.get(logs.moderation_channel);
  if (!ch) return;
  ch.send({embeds:[new EmbedBuilder().setColor('#EF4444').setTitle(action)
    .addFields(
      {name:'User',  value:`${target.tag||target} (${target.id||'?'})`, inline:true},
      {name:'Mod',   value:`${mod.tag} (${mod.id})`,                    inline:true},
      {name:'Reason',value:reason},
    ).setFooter({text:config.footer}).setTimestamp()]}).catch(()=>{});
}

module.exports = { name:'_modlog_util', _modLog: modLog };
