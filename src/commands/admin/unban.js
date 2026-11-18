const { ok, err } = require('../../utils/embed');
module.exports = {
  name:'unban', adminOnly:true,
  async execute(message, args) {
    const id = args[0];
    if (!id) return message.reply({embeds:[err('Provide a user ID.')]});
    try {
      const user = await message.client.users.fetch(id);
      await message.guild.bans.remove(id);
      message.reply({embeds:[ok(`**${user.tag}** has been unbanned.`)]});
    } catch {
      message.reply({embeds:[err('Could not unban. User may not be banned or invalid ID.')]});
    }
  }
};
