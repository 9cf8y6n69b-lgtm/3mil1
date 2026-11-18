const { getGuild } = require('../database/db');
const chalk = require('chalk');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    getGuild(guild.id);
    require('../utils/invites').cacheGuild(guild);
    console.log(chalk.green(`[+] ${guild.name} (${guild.memberCount} members)`));
    try {
      const owner = await guild.fetchOwner();
      await owner.send(`👋 Thanks for adding **DealerBot** to **${guild.name}**!\n\nUse \`#help\` to get started.\n\n> Dev: **Youssef**`).catch(()=>{});
    } catch {}
  }
};
