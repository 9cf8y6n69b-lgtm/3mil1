const { EmbedBuilder } = require('discord.js');
const config = require('../../../config/config');
module.exports = {
  name:'avatar', aliases:['av','pfp'],
  async execute(message, args, client) {
    const t = message.mentions.users.first() || message.author;
    const url = t.displayAvatarURL({dynamic:true,size:1024});
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED')
      .setTitle(`🖼️ ${t.username}'s Avatar`).setImage(url)
      .addFields({name:'Links', value:`[PNG](${t.displayAvatarURL({format:'png',size:1024})}) | [JPG](${t.displayAvatarURL({format:'jpg',size:1024})}) | [GIF](${t.displayAvatarURL({format:'gif',size:1024})})`})
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
