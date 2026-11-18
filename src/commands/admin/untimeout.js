const { ok, err } = require('../../utils/embed');
const { _modLog } = require('./_modlog');
module.exports = {
  name:'untimeout', aliases:['uto'], modOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    try {
      await t.timeout(null);
      message.reply({embeds:[ok(`**${t.user.tag}**'s timeout has been removed.`)]});
      _modLog(message.guild, '✅ Untimeout', t.user, message.author, 'Timeout removed');
    } catch { message.reply({embeds:[err('Failed.')]}); }
  }
};
