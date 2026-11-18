const { ok, err } = require('../../utils/embed');
const { parseTime, formatTime } = require('../../utils/helpers');
const { _modLog } = require('./_modlog');
module.exports = {
  name:'mute', modOnly:true,
  async execute(message, args) {
    const t = message.mentions.members.first();
    if (!t) return message.reply({embeds:[err('Mention a valid member.')]});
    const timeArg = args[1];
    const ms = timeArg ? parseTime(timeArg) : 600000;
    if (!ms) return message.reply({embeds:[err('Invalid time format. Example: `10m`, `1h`')]});
    const reason = args.slice(timeArg?2:1).join(' ') || 'No reason provided';
    try {
      await t.timeout(ms, reason);
      message.reply({embeds:[ok(`**${t.user.tag}** muted for **${formatTime(ms)}**.\n📝 Reason: ${reason}`)]});
      _modLog(message.guild, '🔇 Mute', t.user, message.author, reason);
    } catch {
      message.reply({embeds:[err('Failed to mute. Check my permissions.')]});
    }
  }
};
