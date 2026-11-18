const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');

module.exports = { name:'gend', adminOnly:true,
  async execute(message, args) {
    const msgId = args[0];
    if (!msgId) return message.reply({embeds:[err('Provide the giveaway message ID.')]});
    const gw = db.prepare('SELECT * FROM giveaways WHERE message_id=? AND guild_id=? AND ended=0').get(msgId, message.guild.id);
    if (!gw) return message.reply({embeds:[err('Giveaway not found or already ended.')]});
    // force end by setting end_time to now
    db.prepare('UPDATE giveaways SET end_time=? WHERE id=?').run(Math.floor(Date.now()/1000)-1, gw.id);
    message.reply({embeds:[ok('Giveaway will end within a few seconds.')]});
  }
};
