const fs   = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const chalk = require('chalk');

module.exports = client => {
  client.commands = new Collection();
  client.aliases  = new Collection();
  client.cooldowns= new Collection();
  let n = 0;
  const dir = path.join(__dirname, '../commands');
  for (const folder of fs.readdirSync(dir)) {
    const fp = path.join(dir, folder);
    if (!fs.statSync(fp).isDirectory()) continue;
    for (const file of fs.readdirSync(fp).filter(f=>f.endsWith('.js'))) {
      const cmd = require(path.join(fp, file));
      if (!cmd?.name || !cmd?.execute) continue;
      client.commands.set(cmd.name, cmd);
      cmd.aliases?.forEach(a => client.aliases.set(a, cmd.name));
      n++;
    }
  }
  console.log(chalk.green(`  ✓ ${n} commands loaded`));
};
