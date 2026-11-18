const { ok, err } = require('../../utils/embed');
const { _modLog } = require('./_modlog');
module.exports = {
  name:'unmute', modOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    try {
      await t.timeout(null);
      message.reply({embeds:[ok(`**${t.user.tag}** has been unmuted.`)]});
      _modLog(message.guild, '🔊 Unmute', t.user, message.author, 'Unmuted');
    } catch {
      message.reply({embeds:[err('Failed to unmute.')]});
    }
  }
};
