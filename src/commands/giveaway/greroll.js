const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'greroll', adminOnly:true,
  async execute(message, args) {
    const msgId = args[0];
    if (!msgId) return message.reply({embeds:[err('Provide the giveaway message ID.')]});
    const gw = db.prepare('SELECT * FROM giveaways WHERE message_id=? AND guild_id=?').get(msgId, message.guild.id);
    if (!gw) return message.reply({embeds:[err('Giveaway not found.')]});
    const entries = JSON.parse(gw.entries||'[]');
    if (!entries.length) return message.reply({embeds:[err('No entries to reroll.')]});
    const winners = [...entries].sort(()=>Math.random()-0.5).slice(0, Math.min(gw.winners, entries.length));
    message.channel.send(`🎊 New winner(s): ${winners.map(id=>`<@${id}>`).join(', ')}! Congratulations!`);
    message.reply({embeds:[ok('Rerolled!')]});
  }
};
