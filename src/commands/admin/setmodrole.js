const { ok, err } = require('../../utils/embed');
const { db } = require('../../database/db');
module.exports = {
  name:'setmodrole', adminOnly:true,
  async execute(message, args) {
    const role = message.mentions.roles.first();
    if (!role) return message.reply({embeds:[err('Mention a role.')]});
    db.prepare('UPDATE guild_settings SET mod_role=? WHERE guild_id=?').run(role.id, message.guild.id);
    message.reply({embeds:[ok(`Mod role set to ${role}.`)]});
  }
};
