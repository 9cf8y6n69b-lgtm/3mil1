const { ok, err } = require('../../utils/embed');
const { parseTime, formatTime } = require('../../utils/helpers');
const { _modLog } = require('./_modlog');

module.exports = {
  name:'timeout', aliases:['to'], modOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    const ms = parseTime(args[1]);
    if (!ms) return message.reply({embeds:[err('Provide a valid duration. Example: `1h`, `30m`')]});
    const reason = args.slice(2).join(' ') || 'No reason provided';
    try {
      await t.timeout(ms, reason);
      message.reply({embeds:[ok(`**${t.user.tag}** timed out for **${formatTime(ms)}**.`)]});
      _modLog(message.guild, '⏱️ Timeout', t.user, message.author, reason);
    } catch {
      message.reply({embeds:[err('Failed to timeout.')]});
    }
  }
};
