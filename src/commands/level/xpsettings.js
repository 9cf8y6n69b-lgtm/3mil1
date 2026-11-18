const { EmbedBuilder } = require('discord.js');
const { ok, err } = require('../../utils/embed');
const { db, getLvlCfg } = require('../../database/db');
const config = require('../../../config/config');
module.exports = { name:'xpsettings', adminOnly:true,
  async execute(message, args) {
    const gid = message.guild.id;
    db.prepare('INSERT OR IGNORE INTO level_settings (guild_id) VALUES (?)').run(gid);
    // #xpsettings enable/disable OR #xpsettings min 15 OR #xpsettings max 40 OR #xpsettings cooldown 60
    const sub = args[0]?.toLowerCase();
    if (!sub) {
      const c = getLvlCfg(gid);
      return message.reply({embeds:[new EmbedBuilder().setColor('#7C3AED').setTitle('✨ XP Settings')
        .addFields(
          {name:'Status',    value:c.enabled?'🟢 Enabled':'🔴 Disabled', inline:true},
          {name:'XP Range',  value:`${c.xp_min}–${c.xp_max} per message`, inline:true},
          {name:'Cooldown',  value:`${c.xp_cooldown}s`, inline:true},
          {name:'Level-up Channel', value:c.levelup_channel?`<#${c.levelup_channel}>`:'Same channel', inline:true},
        ).setFooter({text:config.footer}).setTimestamp()]});
    }
    if (sub==='enable')   { db.prepare('UPDATE level_settings SET enabled=1 WHERE guild_id=?').run(gid); return message.reply({embeds:[ok('XP system enabled.')]}); }
    if (sub==='disable')  { db.prepare('UPDATE level_settings SET enabled=0 WHERE guild_id=?').run(gid); return message.reply({embeds:[ok('XP system disabled.')]}); }
    if (sub==='min')      { const v=parseInt(args[1]); if(isNaN(v)) return message.reply({embeds:[err('Provide a number.')]}); db.prepare('UPDATE level_settings SET xp_min=? WHERE guild_id=?').run(v,gid); return message.reply({embeds:[ok(`Min XP set to **${v}**.`)]}); }
    if (sub==='max')      { const v=parseInt(args[1]); if(isNaN(v)) return message.reply({embeds:[err('Provide a number.')]}); db.prepare('UPDATE level_settings SET xp_max=? WHERE guild_id=?').run(v,gid); return message.reply({embeds:[ok(`Max XP set to **${v}**.`)]}); }
    if (sub==='cooldown') { const v=parseInt(args[1]); if(isNaN(v)) return message.reply({embeds:[err('Provide seconds.')]}); db.prepare('UPDATE level_settings SET xp_cooldown=? WHERE guild_id=?').run(v,gid); return message.reply({embeds:[ok(`Cooldown set to **${v}s**.`)]}); }
    message.reply({embeds:[err('Options: `enable` `disable` `min <n>` `max <n>` `cooldown <s>`')]});
  }
};
