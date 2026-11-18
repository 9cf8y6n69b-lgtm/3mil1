const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = { name:'gresume', adminOnly:true,
  async execute(message, args) {
    const msgId = args[0];
    if (!msgId) return message.reply({embeds:[err('Provide the giveaway message ID.')]});
    const gw = db.prepare('SELECT * FROM giveaways WHERE message_id=? AND guild_id=? AND ended=0 AND paused=1').get(msgId, message.guild.id);
    if (!gw) return message.reply({embeds:[err('Paused giveaway not found.')]});
    db.prepare('UPDATE giveaways SET paused=0 WHERE id=?').run(gw.id);
    message.reply({embeds:[ok('Giveaway resumed!')]});
  }
};
