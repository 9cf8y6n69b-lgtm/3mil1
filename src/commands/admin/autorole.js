const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'autorole', adminOnly:true,
  async execute(message, args) {
    if (args[0] === 'off' || args[0] === 'disable') {
      db.prepare('UPDATE guild_settings SET autorole=NULL WHERE guild_id=?').run(message.guild.id);
      return message.reply({embeds:[ok('Auto-role disabled.')]});
    }
    const role = message.mentions.roles.first();
    if (!role) return message.reply({embeds:[err('Mention a role or type `off` to disable.')]});
    db.prepare('UPDATE guild_settings SET autorole=? WHERE guild_id=?').run(role.id, message.guild.id);
    message.reply({embeds:[ok(`Auto-role set to ${role}. New members will receive it on join.`)]});
  }
};
