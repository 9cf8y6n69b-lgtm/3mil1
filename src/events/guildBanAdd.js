const { trackAction } = require('../utils/antinuke');
module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) { trackAction(ban.guild, 'ban', ban.user.id, client); }
};
