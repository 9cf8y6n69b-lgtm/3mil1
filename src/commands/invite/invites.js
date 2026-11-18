const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const { err } = require('../../utils/embed');
const config = require('../../../config/config');
module.exports = { name:'invites',
  async execute(message, args) {
    const t = message.mentions.members.first() || message.member;
    const row = db.prepare('SELECT * FROM invites WHERE guild_id=? AND user_id=?').get(message.guild.id, t.id);
    const total = row?.total||0, left = row?.left_count||0, fake = row?.fake||0;
    const real  = total - left - fake;
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED')
      .setTitle(`🔗 ${t.user.username}'s Invites`)
      .setThumbnail(t.user.displayAvatarURL({dynamic:true}))
      .addFields(
        {name:'Total',  value:`**${total}**`,     inline:true},
        {name:'Real',   value:`**${real}**`,       inline:true},
        {name:'Left',   value:`**${left}**`,       inline:true},
        {name:'Fake',   value:`**${fake}**`,       inline:true},
      ).setFooter({text:config.footer}).setTimestamp()]});
  }
};
