const { EmbedBuilder } = require('discord.js');
const { ok, err, plus } = require('../../utils/embed');
const { db, getActivePlus, nextSubNumber } = require('../../database/db');
const config = require('../../../config/config');

module.exports = { name:'vip', aliases:['plus'],
  async execute(message, args, client) {
    const gid = message.guild.id;
    const sub = args[0]?.toLowerCase();

    // ── #vip (no args) — show info ─────────────────────────
    if (!sub) {
      const pl = getActivePlus(gid);
      if (!pl) {
        return message.reply({embeds:[new EmbedBuilder().setColor('#A855F7')
          .setTitle('💎 Plus Subscription')
          .setDescription('This server does not have an active Plus subscription.\n\nContact the bot owner to activate Plus.')
          .setFooter({text:config.footer}).setTimestamp()]});
      }
      const expiryText = pl.is_lifetime || pl.is_partnered
        ? 'Lifetime / Partnered'
        : `<t:${pl.expires_at}:F>`;
      return message.reply({embeds:[new EmbedBuilder().setColor('#A855F7')
        .setTitle('💎 Plus Subscription Information')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          {name:'📋 Plus Number',    value:`#${pl.sub_number}`,                      inline:true},
          {name:'👤 Registered for', value:`<@${pl.user_id}>`,                       inline:true},
          {name:'⏳ Plus ends in',   value:pl.is_partnered?'Partnered':pl.is_lifetime?'Lifetime':`<t:${pl.expires_at}:R>`, inline:true},
          {name:'📅 Expiration Date',value:expiryText,                               inline:true},
          {name:'🌐 Server ID',      value:`${gid}`,                                 inline:false},
        )
        .setFooter({text:config.footer}).setTimestamp()]});
    }

    // ── All below require active Plus ──────────────────────
    const pl = getActivePlus(gid);
    if (!pl && !['transfer'].includes(sub))
      return message.reply({embeds:[err('This server does not have an active **Plus** subscription.')]});

    // changing settings requires Administrator (or the bot owner / subscription owner)
    if (sub !== 'transfer' && !message.member.permissions.has('Administrator')
        && message.author.id !== config.ownerID && message.author.id !== pl?.user_id)
      return message.reply({embeds:[err('You need **Administrator** permission.')]});

    // ── #vip name <nickname> ───────────────────────────────
    if (sub === 'name') {
      const name = args.slice(1).join(' ');
      if (!name) return message.reply({embeds:[err('Provide a nickname.')]});
      try {
        await message.guild.members.me.setNickname(name);
        db.prepare('UPDATE plus_subscriptions SET bot_nickname=? WHERE id=?').run(name, pl.id);
        return message.reply({embeds:[ok(`Bot nickname changed to **${name}**.`)]});
      } catch { return message.reply({embeds:[err('Failed. Make sure I have permission to change my nickname.')]}); }
    }

    // ── #vip avatar (attach image) ─────────────────────────
    if (sub === 'avatar') {
      const attachment = message.attachments.first();
      if (!attachment) return message.reply({embeds:[err('Attach an image with this command.')]});
      try {
        await client.user.setAvatar(attachment.url);
        db.prepare('UPDATE plus_subscriptions SET bot_avatar=? WHERE id=?').run(attachment.url, pl.id);
        return message.reply({embeds:[ok('Bot avatar updated!')]});
      } catch { return message.reply({embeds:[err('Failed to update avatar. Try a smaller image (PNG/JPG, < 8MB).')]}); }
    }

    // ── #vip banner (attach image) ─────────────────────────
    if (sub === 'banner') {
      const attachment = message.attachments.first();
      if (!attachment) return message.reply({embeds:[err('Attach an image with this command.')]});
      try {
        await client.user.setBanner(attachment.url);
        db.prepare('UPDATE plus_subscriptions SET bot_banner=? WHERE id=?').run(attachment.url, pl.id);
        return message.reply({embeds:[ok('Bot banner updated!')]});
      } catch { return message.reply({embeds:[err('Failed. Banner requires Discord Nitro on the bot account.')]}); }
    }

    // ── #vip bio <text> ────────────────────────────────────
    if (sub === 'bio') {
      const text = args.slice(1).join(' ');
      if (!text) return message.reply({embeds:[err('Provide a bio text.')]});
      db.prepare('UPDATE plus_subscriptions SET bot_bio=? WHERE id=?').run(text, pl.id);
      return message.reply({embeds:[ok(`Bot bio saved: *${text}*`)]});
    }

    // ── #vip reset ─────────────────────────────────────────
    if (sub === 'reset') {
      try {
        await message.guild.members.me.setNickname(null);
      } catch {}
      db.prepare('UPDATE plus_subscriptions SET bot_nickname=NULL,bot_avatar=NULL,bot_banner=NULL,bot_bio=NULL WHERE id=?').run(pl.id);
      return message.reply({embeds:[ok('All per-server Plus settings have been reset.')]});
    }

    // ── #vip transfer user <id> | server <id> ─────────────
    if (sub === 'transfer') {
      if (!pl) return message.reply({embeds:[err('No active Plus subscription to transfer.')]});
      const type = args[1]?.toLowerCase();
      const targetId = args[2];
      if (!['user','server'].includes(type) || !targetId)
        return message.reply({embeds:[err('Usage: `#vip transfer user <userID>` or `#vip transfer server <serverID>`')]});
      if (message.author.id !== pl.user_id && message.author.id !== config.ownerID)
        return message.reply({embeds:[err('Only the subscription owner can transfer it.')]});
      if (type === 'user') {
        db.prepare('UPDATE plus_subscriptions SET user_id=? WHERE id=?').run(targetId, pl.id);
        return message.reply({embeds:[ok(`Subscription transferred to user \`${targetId}\`.`)]});
      }
      if (type === 'server') {
        db.prepare('UPDATE plus_subscriptions SET guild_id=? WHERE id=?').run(targetId, pl.id);
        return message.reply({embeds:[ok(`Subscription moved to server \`${targetId}\`.`)]});
      }
    }

    message.reply({embeds:[err('Usage: `#vip` | `#vip name <n>` | `#vip avatar` | `#vip banner` | `#vip bio <text>` | `#vip reset` | `#vip transfer user/server <id>`')]});
  }
};
