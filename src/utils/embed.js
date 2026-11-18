const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

const E = (color, desc) => new EmbedBuilder().setColor(color).setDescription(desc).setFooter({ text: config.footer }).setTimestamp();

module.exports = {
  ok:   d => E(config.colors.success, `✅ ${d}`),
  err:  d => E(config.colors.error,   `❌ ${d}`),
  warn: d => E(config.colors.warning, `⚠️ ${d}`),
  info: (t, d, c) => new EmbedBuilder().setColor(c || config.colors.main).setTitle(t).setDescription(d).setFooter({ text: config.footer }).setTimestamp(),
  plus: (t, d) => new EmbedBuilder().setColor(config.colors.plus).setTitle(t).setDescription(d).setFooter({ text: config.footer }).setTimestamp(),
  base: (c) => new EmbedBuilder().setColor(c || config.colors.main).setFooter({ text: config.footer }).setTimestamp(),
};
