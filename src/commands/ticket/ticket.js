const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { ok, err } = require('../../utils/embed');
const { db, getTicketCfg } = require('../../database/db');
const config = require('../../../config/config');

module.exports = { name:'ticket',
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const gid  = message.guild.id;

    // ── setup ──────────────────────────────────────────────
    if (sub === 'setup') {
      if (!message.member.permissions.has('Administrator'))
        return message.reply({embeds:[err('Administrator only.')]});
      const cfg = getTicketCfg(gid);
      const ch  = message.mentions.channels.first() || message.channel;

      const embed = new EmbedBuilder()
        .setColor('#7C3AED')
        .setTitle('🎟️ Support Tickets')
        .setDescription('Click the button below to open a support ticket.\nOur staff will assist you shortly.')
        .setFooter({text:'DealerBot • Dev: Youssef'});

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_open').setLabel('📩 Open Ticket').setStyle(ButtonStyle.Primary)
      );

      const panelMsg = await ch.send({embeds:[embed], components:[row]});
      db.prepare('UPDATE ticket_settings SET panel_channel=?,panel_message=? WHERE guild_id=?').run(ch.id, panelMsg.id, gid);
      return message.reply({embeds:[ok(`Ticket panel set up in ${ch}.`)]});
    }

    // ── setsupport ─────────────────────────────────────────
    if (sub === 'setsupport') {
      if (!message.member.permissions.has('Administrator'))
        return message.reply({embeds:[err('Administrator only.')]});
      const role = message.mentions.roles.first();
      if (!role) return message.reply({embeds:[err('Mention a role.')]});
      db.prepare('UPDATE ticket_settings SET support_role=? WHERE guild_id=?').run(role.id, gid);
      return message.reply({embeds:[ok(`Support role set to ${role}.`)]});
    }

    // staff check for ticket-channel subcommands
    const cfgT = getTicketCfg(gid);
    const isStaff = message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      || (cfgT.support_role && message.member.roles.cache.has(cfgT.support_role));
    const thisTicket = db.prepare('SELECT * FROM tickets WHERE channel_id=?').get(message.channel.id);
    if (['close','delete','add','remove'].includes(sub)) {
      if (!thisTicket) return message.reply({embeds:[err('This command only works inside a ticket channel.')]});
      const isOwner = thisTicket.user_id === message.author.id;
      if (sub === 'close' ? !(isStaff || isOwner) : !isStaff)
        return message.reply({embeds:[err('You are not allowed to do that.')]});
    }

    // ── close ──────────────────────────────────────────────
    if (sub === 'close') {
      const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id=? AND status='open'`).get(message.channel.id);
      if (!ticket) return message.reply({embeds:[err('This is not an open ticket channel.')]});
      db.prepare(`UPDATE tickets SET status='closed',closed_at=strftime('%s','now') WHERE channel_id=?`).run(message.channel.id);
      await message.reply({embeds:[ok('Ticket closed. Channel deletes in 5 seconds.')]});
      setTimeout(()=>message.channel.delete().catch(()=>{}), 5000);
      return;
    }

    // ── delete ─────────────────────────────────────────────
    if (sub === 'delete') {
      const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id=?').get(message.channel.id);
      if (!ticket) return message.reply({embeds:[err('This is not a ticket channel.')]});
      db.prepare('DELETE FROM tickets WHERE channel_id=?').run(message.channel.id);
      await message.channel.delete().catch(()=>{});
      return;
    }

    // ── add ────────────────────────────────────────────────
    if (sub === 'add') {
      const t = message.mentions.members.first();
      if (!t) return message.reply({embeds:[err('Mention a member.')]});
      await message.channel.permissionOverwrites.edit(t.id, {ViewChannel:true, SendMessages:true});
      return message.reply({embeds:[ok(`Added ${t} to this ticket.`)]});
    }

    // ── remove ─────────────────────────────────────────────
    if (sub === 'remove') {
      const t = message.mentions.members.first();
      if (!t) return message.reply({embeds:[err('Mention a member.')]});
      await message.channel.permissionOverwrites.edit(t.id, {ViewChannel:false});
      return message.reply({embeds:[ok(`Removed ${t} from this ticket.`)]});
    }

    // ── open (manual) ──────────────────────────────────────
    if (sub === 'open') {
      const cfg  = getTicketCfg(gid);
      const uid  = message.author.id;
      const existing = db.prepare(`SELECT * FROM tickets WHERE guild_id=? AND user_id=? AND status='open'`).get(gid, uid);
      if (existing) {
        const ch = message.guild.channels.cache.get(existing.channel_id);
        return message.reply({embeds:[err(`You already have an open ticket: ${ch||'#ticket'}`)]});
      }
      try {
        const counter = (cfg?.counter||0)+1;
        db.prepare('UPDATE ticket_settings SET counter=? WHERE guild_id=?').run(counter, gid);
        const channel = await message.guild.channels.create({
          name:`ticket-${counter.toString().padStart(4,'0')}`,
          parent:cfg?.ticket_category||null,
          permissionOverwrites:[
            {id:message.guild.id, deny:[PermissionFlagsBits.ViewChannel]},
            {id:uid,              allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]},
            ...(cfg?.support_role?[{id:cfg.support_role, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]}]:[]),
          ],
        });
        db.prepare('INSERT INTO tickets (guild_id,channel_id,user_id) VALUES (?,?,?)').run(gid, channel.id, uid);
        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
        );
        await channel.send({content:`<@${uid}>`, embeds:[new EmbedBuilder().setColor('#7C3AED')
          .setTitle('🎟️ Ticket Opened')
          .setDescription(cfg?.ticket_msg||'Welcome! Staff will assist you shortly.')
          .addFields({name:'User', value:`<@${uid}>`, inline:true})
          .setFooter({text:config.footer}).setTimestamp()], components:[closeRow]});
        message.reply({embeds:[ok(`Ticket created: ${channel}`)]});
      } catch {
        message.reply({embeds:[err('Failed to create ticket. Check my permissions.')]});
      }
      return;
    }

    message.reply({embeds:[err('Usage: `#ticket setup | open | close | delete | add @user | remove @user | setsupport @role`')]});
  }
};
