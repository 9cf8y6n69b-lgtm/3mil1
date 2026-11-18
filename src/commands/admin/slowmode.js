const { ok, err } = require('../../utils/embed');
const { parseTime } = require('../../utils/helpers');
module.exports = {
  name:'slowmode', modOnly:true,
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    const arg = args.find(a=>!a.startsWith('<'));
    if (!arg) return message.reply({embeds:[err('Provide a time. Example: `5s`, `1m`, `0` to disable')]});
    const ms = arg === '0' ? 0 : parseTime(arg);
    if (ms === null) return message.reply({embeds:[err('Invalid time.')]});
    const secs = Math.min(Math.floor(ms/1000), 21600);
    await ch.setRateLimitPerUser(secs);
    message.reply({embeds:[ok(secs===0 ? `Slowmode disabled in **${ch.name}**.` : `Slowmode set to **${secs}s** in **${ch.name}**.`)]});
  }
};
