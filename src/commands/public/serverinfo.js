const { EmbedBuilder } = require('discord.js');
const config = require('../../../config/config');
module.exports = {
  name:'serverinfo', aliases:['si','guildinfo'],
  async execute(message, args, client) {
    const g = message.guild;
    await g.fetch();
    const channels = g.channels.cache;
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED')
      .setTitle(`📊 ${g.name}`)
      .setThumbnail(g.iconURL({dynamic:true}))
      .addFields(
        {name:'ID',            value:`\`${g.id}\``,                                  inline:true},
        {name:'Owner',         value:`<@${g.ownerId}>`,                              inline:true},
        {name:'Members',       value:`**${g.memberCount}**`,                         inline:true},
        {name:'Text Channels', value:`**${channels.filter(c=>c.type===0).size}**`,   inline:true},
        {name:'Voice Channels',value:`**${channels.filter(c=>c.type===2).size}**`,   inline:true},
        {name:'Roles',         value:`**${g.roles.cache.size}**`,                    inline:true},
        {name:'Boost Level',   value:`**${g.premiumTier}** (${g.premiumSubscriptionCount} boosts)`, inline:true},
        {name:'Created',       value:`<t:${Math.floor(g.createdTimestamp/1000)}:R>`, inline:true},
        {name:'Verification',  value:`**${g.verificationLevel}**`,                  inline:true},
      )
      .setImage(g.bannerURL({size:1024})||null)
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
