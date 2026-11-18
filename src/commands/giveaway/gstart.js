const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
const { parseTime, formatTime } = require('../../utils/helpers');
const config = require('../../../config/config');

module.exports = { name:'gstart', adminOnly:true,
  async execute(message, args) {
    // Usage: #gstart 1h 1 Nitro Classic
    if (args.length < 3) return message.reply({embeds:[err('Usage: `#gstart <time> <winners> <prize>`\nExample: `#gstart 1h 2 Discord Nitro`')]});
    const ms = parseTime(args[0]);
    if (!ms || ms < 10000) return message.reply({embeds:[err('Invalid time. Minimum 10 seconds.')]});
    const winners = parseInt(args[1]);
    if (isNaN(winners) || winners < 1) return message.reply({embeds:[err('Winners must be a positive number.')]});
    const prize = args.slice(2).join(' ');
    const endTime = Math.floor((Date.now() + ms) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#7C3AED')
      .setTitle(`🎉 GIVEAWAY — ${prize}`)
      .setDescription(`Click the button below to enter!\n\n🏆 **Winners:** ${winners}\n⏰ **Ends:** <t:${endTime}:R>\n🎟️ **Hosted by:** <@${message.author.id}>`)
      .setFooter({text:`DealerBot • Dev: Youssef • Ends`})
      .setTimestamp(new Date(endTime * 1000));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('giveaway_enter_PLACEHOLDER').setLabel('🎉 Enter Giveaway').setStyle(ButtonStyle.Primary)
    );

    const gwMsg = await message.channel.send({embeds:[embed], components:[row]});

    const result = db.prepare('INSERT INTO giveaways (guild_id,channel_id,message_id,host_id,prize,winners,end_time) VALUES (?,?,?,?,?,?,?)')
      .run(message.guild.id, message.channel.id, gwMsg.id, message.author.id, prize, winners, endTime);

    // update button with real ID
    const gwId = result.lastInsertRowid;
    const newRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`giveaway_enter_${gwId}`).setLabel('🎉 Enter Giveaway').setStyle(ButtonStyle.Primary)
    );
    await gwMsg.edit({components:[newRow]});

    message.reply({embeds:[ok(`Giveaway started in ${message.channel}! Ends in **${formatTime(ms)}**.`)]}).then(m=>setTimeout(()=>m.delete().catch(()=>{}),5000));
  }
};
