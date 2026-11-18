require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const chalk = require('chalk');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

console.log(chalk.bold.magenta(`
╔══════════════════════════════════════════╗
║                                          ║
║   💎  D E A L E R   B O T  v1.0         ║
║                                          ║
║   Prefix  : ${(process.env.PREFIX||'#').padEnd(27)} ║
║   Dev     : Youssef                      ║
║                                          ║
╚══════════════════════════════════════════╝
`));

require('./handlers/commandHandler')(client);
require('./handlers/eventHandler')(client);

if (!process.env.TOKEN) {
  console.error(chalk.red('❌  TOKEN is missing from .env!'));
  process.exit(1);
}

client.login(process.env.TOKEN).then(() => {
  if (process.env.CLIENT_SECRET) require('./dashboard/server').start(client);
  else console.log(chalk.yellow('  ! CLIENT_SECRET missing — dashboard disabled'));
}).catch(e => {
  console.error(chalk.red('❌  Login failed:'), e.message);
  process.exit(1);
});

process.on('unhandledRejection', e => console.error('[UnhandledRejection]', e));
process.on('uncaughtException',  e => console.error('[UncaughtException]',  e));
