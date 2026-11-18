const { ok, err } = require('../../utils/embed');
const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const config = require('../../../config/config');
module.exports = { name:'whitelist', adminOnly:true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const gid = message.guild.id;
    if (sub === 'add') {
      const t = message.mentions.members.first();
      if (!t) return message.reply({embeds:[err('Mention a member.')]});
      db.prepare('INSERT OR IGNORE INTO protection_whitelist (guild_id,user_id,added_by) VALUES (?,?,?)').run(gid, t.id, message.author.id);
      return message.reply({embeds:[ok(`**${t.user.tag}** added to the protection whitelist.`)]});
    }
    if (sub === 'remove') {
      const t = message.mentions.members.first();
      if (!t) return message.reply({embeds:[err('Mention a member.')]});
      db.prepare('DELETE FROM protection_whitelist WHERE guild_id=? AND user_id=?').run(gid, t.id);
      return message.reply({embeds:[ok(`**${t.user.tag}** removed from the whitelist.`)]});
    }
    if (sub === 'list') {
      const list = db.prepare('SELECT * FROM protection_whitelist WHERE guild_id=?').all(gid);
      if (!list.length) return message.reply({embeds:[err('Whitelist is empty.')]});
      const lines = list.map((r,i) => `**${i+1}.** <@${r.user_id}> — added by <@${r.added_by}>`);
      return message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED')
        .setTitle('🛡️ Protection Whitelist')
        .setDescription(lines.join('\n'))
        .setFooter({text:config.footer}).setTimestamp()]});
    }
    message.reply({embeds:[err('Usage: `#whitelist add @user` | `#whitelist remove @user` | `#whitelist list`')]});
  }
};
