const { EmbedBuilder } = require('discord.js');
const { getProt } = require('../../database/db');
const config = require('../../../config/config');
const toggle = v => v ? '🟢 On' : '🔴 Off';
module.exports = { name:'protection',
  async execute(message) {
    const p = getProt(message.guild.id);
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED').setTitle('🛡️ Protection Settings')
      .addFields(
        {name:'🚫 Antispam',   value:`${toggle(p.antispam)}\nLimit: ${p.antispam_limit}/${p.antispam_time}s\nAction: **${p.antispam_action}**`,    inline:true},
        {name:'🔗 Anti-Links', value:`${toggle(p.antilinks)}\nAction: **${p.antilinks_action}**`,                                                    inline:true},
        {name:'🤖 Anti-Bots',  value:`${toggle(p.antibots)}\nAction: **${p.antibots_action}**`,                                                      inline:true},
        {name:'💣 Anti-Nuke',  value:`${toggle(p.antinuke)}\nBan limit: **${p.antinuke_ban_limit}**\nAction: **${p.antinuke_action}**`,              inline:true},
        {name:'⚖️ Punishment', value:`**${p.punishment}**`, inline:true},
      )
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
