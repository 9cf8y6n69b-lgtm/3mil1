const { EmbedBuilder } = require('discord.js');
const { getGuild, getLogs, getProt, replacePlaceholders } = require('../database/db');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const gid = member.guild.id;
    const g   = getGuild(gid);

    // invite tracking
    if (!member.user.bot) {
      const inv = require('../utils/invites');
      inv.findUsedInvite(member.guild).then(id => inv.recordJoin(member, id)).catch(()=>{});
    }

    // auto-role
    if (g?.autorole) {
      try { await member.roles.add(g.autorole); } catch {}
    }

    // welcome
    if (g?.welcome_channel) {
      const ch = member.guild.channels.cache.get(g.welcome_channel);
      if (ch) {
        const text = replacePlaceholders(g.welcome_msg||'Welcome {user}!', {
          user:`<@${member.id}>`, username:member.user.username,
          server:member.guild.name, membercount:member.guild.memberCount,
        });
        const embed = new EmbedBuilder()
          .setColor('#'+( g.embed_color||'7C3AED'))
          .setTitle('👋 Welcome!')
          .setDescription(text)
          .setThumbnail(member.user.displayAvatarURL({dynamic:true}))
          .setFooter({text:'DealerBot • Dev: Youssef'})
          .setTimestamp();
        ch.send({embeds:[embed]}).catch(()=>{});
      }
    }

    // join log
    const logs = getLogs(gid);
    if (logs?.joins_enabled && logs?.joins_channel) {
      const ch = member.guild.channels.cache.get(logs.joins_channel);
      if (ch) {
        const e = new EmbedBuilder().setColor('#22C55E').setTitle('📥 Member Joined')
          .setDescription(`${member.user.tag}\n\`${member.id}\``)
          .addFields({name:'Account Age', value:`<t:${Math.floor(member.user.createdTimestamp/1000)}:R>`})
          .setThumbnail(member.user.displayAvatarURL({dynamic:true})).setTimestamp();
        ch.send({embeds:[e]}).catch(()=>{});
      }
    }

    // antibots
    if (member.user.bot) {
      const prot = getProt(gid);
      if (prot?.antibots) {
        try {
          if (prot.antibots_action==='ban') await member.ban({reason:'AutoMod: Antibots'});
          else await member.kick('AutoMod: Antibots');
        } catch {}
      }
    }
  }
};
