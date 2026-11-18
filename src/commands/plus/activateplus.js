const { EmbedBuilder } = require('discord.js');
const { ok, err } = require('../../utils/embed');
const { db, nextSubNumber } = require('../../database/db');
const config = require('../../../config/config');

module.exports = { name:'activateplus', ownerOnly:true,
  async execute(message, args, client) {
    if (message.author.id !== config.ownerID)
      return message.reply({embeds:[err('This command is for the bot owner only.')]});

    // Usage: #activateplus <serverID> <userID> [plan: monthly|yearly|lifetime|partnered] [days]
    const guildId = args[0];
    const userId  = args[1] || message.author.id;
    const plan    = args[2]?.toLowerCase() || 'monthly';
    const days    = parseInt(args[3]) || 30;

    if (!guildId) return message.reply({embeds:[err('Usage: `#activateplus <serverID> [userID] [plan] [days]`')]});

    const subNum    = nextSubNumber();
    const isLife    = plan === 'lifetime' ? 1 : 0;
    const isPartner = plan === 'partnered' ? 1 : 0;
    const expiresAt = (isLife || isPartner) ? null : Math.floor(Date.now()/1000) + days*86400;

    // deactivate old subs for this guild
    db.prepare('UPDATE plus_subscriptions SET is_active=0 WHERE guild_id=?').run(guildId);

    db.prepare(`INSERT INTO plus_subscriptions
      (sub_number,guild_id,user_id,plan,expires_at,is_lifetime,is_partnered,is_active,activated_by)
      VALUES (?,?,?,?,?,?,?,1,?)`)
      .run(subNum, guildId, userId, plan, expiresAt, isLife, isPartner, message.author.id);

    const expiryText = (isLife||isPartner) ? 'Lifetime / Partnered' : `<t:${expiresAt}:F>`;

    // try to notify guild owner
    try {
      const guild = await client.guilds.fetch(guildId).catch(()=>null);
      if (guild) {
        const owner = await guild.fetchOwner().catch(()=>null);
        if (owner) await owner.send(`💎 **Plus Activated!**\n\nYour server **${guild.name}** now has **Plus** activated!\nPlan: **${plan}** | Expires: ${expiryText}\n\nUse \`#vip\` to manage your subscription.\n\n> Dev: Youssef`).catch(()=>{});
      }
    } catch {}

    message.reply({embeds:[new EmbedBuilder().setColor('#A855F7')
      .setTitle('💎 Plus Activated!')
      .addFields(
        {name:'📋 Sub Number',   value:`#${subNum}`,   inline:true},
        {name:'🌐 Server ID',    value:guildId,         inline:true},
        {name:'👤 User ID',      value:`<@${userId}>`,  inline:true},
        {name:'📦 Plan',         value:plan,             inline:true},
        {name:'📅 Expires',      value:expiryText,       inline:true},
      )
      .setFooter({text:config.footer}).setTimestamp()]});
  }
};
