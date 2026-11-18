const { db, getTicketCfg } = require('../database/db');
const { ok, err } = require('../utils/embed');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Ticket open button ───────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_open') {
      await handleTicketOpen(interaction);
      return;
    }

    // ── Ticket close button ──────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      await handleTicketClose(interaction);
      return;
    }

    // ── Giveaway enter button ────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('giveaway_enter_')) {
      const gwId = interaction.customId.split('_')[2];
      const gw   = db.prepare('SELECT * FROM giveaways WHERE id=? AND ended=0 AND paused=0').get(gwId);
      if (!gw) return interaction.reply({content:'This giveaway has ended!', ephemeral:true});
      const entries = JSON.parse(gw.entries||'[]');
      if (entries.includes(interaction.user.id))
        return interaction.reply({content:'You already entered this giveaway!', ephemeral:true});
      entries.push(interaction.user.id);
      db.prepare('UPDATE giveaways SET entries=? WHERE id=?').run(JSON.stringify(entries), gwId);
      return interaction.reply({content:`✅ You entered the giveaway! Total entries: **${entries.length}**`, ephemeral:true});
    }

    // ── Select menu (help) ───────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
      // handled inside help command collector
    }
  }
};

async function handleTicketOpen(interaction) {
  const gid = interaction.guild.id;
  const cfg  = getTicketCfg(gid);
  const uid  = interaction.user.id;

  // check existing
  const existing = db.prepare(`SELECT * FROM tickets WHERE guild_id=? AND user_id=? AND status='open'`).get(gid, uid);
  if (existing) {
    const ch = interaction.guild.channels.cache.get(existing.channel_id);
    return interaction.reply({content:`You already have an open ticket: ${ch||'#ticket'}`, ephemeral:true});
  }

  try {
    const counter = (cfg?.counter||0)+1;
    db.prepare('UPDATE ticket_settings SET counter=? WHERE guild_id=?').run(counter, gid);

    const { PermissionFlagsBits } = require('discord.js');
    const channel = await interaction.guild.channels.create({
      name:`ticket-${counter.toString().padStart(4,'0')}`,
      parent: cfg?.ticket_category||null,
      permissionOverwrites:[
        {id:interaction.guild.id, deny:[PermissionFlagsBits.ViewChannel]},
        {id:uid,                  allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]},
        ...(cfg?.support_role ? [{id:cfg.support_role, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]}] : []),
      ],
    });

    db.prepare('INSERT INTO tickets (guild_id,channel_id,user_id) VALUES (?,?,?)').run(gid, channel.id, uid);

    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const config = require('../../config/config');
    const embed = new EmbedBuilder()
      .setColor('#7C3AED')
      .setTitle('🎟️ New Ticket')
      .setDescription(cfg?.ticket_msg||'Welcome! A staff member will assist you shortly.')
      .addFields({name:'User', value:`<@${uid}>`, inline:true})
      .setFooter({text:config.footer}).setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger)
    );
    await channel.send({content:`<@${uid}>`, embeds:[embed], components:[row]});
    interaction.reply({content:`✅ Ticket created: ${channel}`, ephemeral:true});
  } catch(e) {
    console.error('[ticket]', e);
    interaction.reply({content:'Failed to create ticket. Check my permissions.', ephemeral:true}).catch(()=>{});
  }
}

async function handleTicketClose(interaction) {
  const gid = interaction.guild.id;
  const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id=? AND status='open'`).get(interaction.channel.id);
  if (!ticket) return interaction.reply({content:'This is not an open ticket.', ephemeral:true});
  const cfg = getTicketCfg(gid);
  const mem = interaction.member;
  const allowed = ticket.user_id === interaction.user.id
    || mem.permissions.has('ManageChannels')
    || (cfg.support_role && mem.roles.cache.has(cfg.support_role));
  if (!allowed) return interaction.reply({content:'Only the ticket owner or staff can close this ticket.', ephemeral:true});

  db.prepare(`UPDATE tickets SET status='closed',closed_at=strftime('%s','now') WHERE channel_id=?`).run(interaction.channel.id);
  await interaction.reply({content:'🔒 Ticket closed. Channel will be deleted in 5 seconds.'});
  setTimeout(()=>interaction.channel.delete().catch(()=>{}), 5000);
}
