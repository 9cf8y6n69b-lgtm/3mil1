const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setcolor', adminOnly:true,
  async execute(message, args) {
    const hex = args[0]?.replace('#','');
    if (!hex || !/^[0-9A-Fa-f]{6}$/.test(hex)) return message.reply({embeds:[err('Provide a valid hex color. Example: `#7C3AED`')]});
    db.prepare('UPDATE guild_settings SET embed_color=? WHERE guild_id=?').run(hex, message.guild.id);
    message.reply({embeds:[ok(`Embed color set to **#${hex}**.`)]});
  }
};
