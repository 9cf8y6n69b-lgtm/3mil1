const { EmbedBuilder } = require('discord.js');
const config = require('../../../config/config');
module.exports = {
  name:'userinfo', aliases:['ui','whois'],
  async execute(message, args, client) {
    const t = message.mentions.members.first() || message.member;
    const u = t.user;
    const roles = t.roles.cache.filter(r=>r.id!==message.guild.id).map(r=>`<@&${r.id}>`).join(', ')||'None';
    message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED')
      .setTitle(`👤 ${u.tag}`)
      .setThumbnail(u.displayAvatarURL({dynamic:true}))
      .addFields(
        {name:'ID',           value:`\`${u.id}\``,                                    inline:true},
        {name:'Nickname',     value:t.nickname||'None',                               inline:true},
        {name:'Bot',          value:u.bot?'Yes':'No',                                 inline:true},
        {name:'Joined Server',value:`<t:${Math.floor(t.joinedTimestamp/1000)}:R>`,    inline:true},
        {name:'Account Created',value:`<t:${Math.floor(u.createdTimestamp/1000)}:R>`, inline:true},
        {name:`Roles (${t.roles.cache.size-1})`, value:roles.slice(0,1000)},
      )
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
