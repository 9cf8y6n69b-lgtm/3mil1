const { ok, err } = require('../../utils/embed');
const { _modLog } = require('./_modlog');
module.exports = {
  name:'kick', adminOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    if (!t.kickable) return message.reply({embeds:[err('I cannot kick this member.')]});
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await t.kick(reason);
    message.reply({embeds:[ok(`**${t.user.tag}** has been kicked.\n📝 Reason: ${reason}`)]});
    _modLog(message.guild, '👢 Kick', t.user, message.author, reason);
  }
};
