const fs   = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = client => {
  let n = 0;
  const dir = path.join(__dirname, '../events');
  for (const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js'))) {
    const evt = require(path.join(dir, file));
    if (!evt?.name) continue;
    evt.once
      ? client.once(evt.name, (...a)=>evt.execute(...a, client))
      : client.on  (evt.name, (...a)=>evt.execute(...a, client));
    n++;
  }
  console.log(chalk.blue(`  ✓ ${n} events loaded`));
};
