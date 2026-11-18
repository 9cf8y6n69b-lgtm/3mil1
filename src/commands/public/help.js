const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../../config/config');

const CATS = {
  admin:      { label:'🔨 Admin Commands',      desc:'Displays Admin commands' },
  public:     { label:'👥 Public Commands',      desc:'Displays Public commands' },
  level:      { label:'✨ Level System',          desc:'Displays Level & XP commands' },
  greet:      { label:'🌟 Greet Commands',        desc:'Displays Greet commands' },
  automation: { label:'⚙️ Automation System',    desc:'Displays Automation commands' },
  giveaway:   { label:'🎉 Giveaway Commands',     desc:'Displays Giveaway commands' },
  protection: { label:'🛡️ Protection Commands',   desc:'Displays Protection commands' },
  invite:     { label:'🔗 Invite System',          desc:'Displays Invite System commands' },
  ticket:     { label:'🎟️ Ticket System',         desc:'Displays Ticket System commands' },
  plus:       { label:'💎 Plus Commands',          desc:'Displays Plus subscription commands' },
};

const CMDS = {
  admin:[
    '`#ban @user [reason]` — Ban a member',
    '`#unban <id>` — Unban',
    '`#kick @user [reason]` — Kick',
    '`#mute @user [time] [reason]` — Mute',
    '`#unmute @user` — Unmute',
    '`#timeout @user <time>` — Timeout',
    '`#untimeout @user` — Remove timeout',
    '`#warn @user [reason]` — Warn',
    '`#warnings @user` — View warnings',
    '`#clearwarns @user` — Clear warnings',
    '`#clear <n>` — Delete messages',
    '`#lock [#channel]` — Lock channel',
    '`#unlock [#channel]` — Unlock channel',
    '`#slowmode <time>` — Set slowmode',
    '`#setprefix <prefix>` — Change prefix',
    '`#setmodrole @role` — Set mod role',
    '`#setadminrole @role` — Set admin role',
  ],
  public:[
    '`#help` — Show commands',
    '`#ping` — Bot latency',
    '`#avatar [@user]` — View avatar',
    '`#userinfo [@user]` — User info',
    '`#serverinfo` — Server info',
    '`#rank [@user]` — Your XP rank',
  ],
  level:[
    '`#rank [@user]` — View rank',
    '`#top` — XP leaderboard',
    '`#setlevel @user <n>` — Set level (admin)',
    '`#resetxp @user` — Reset XP (admin)',
    '`#xpsettings` — Configure XP (admin)',
    '`#levelupchannel #ch` — Set level-up channel',
  ],
  greet:[
    '`#setwelcome #channel` — Set welcome channel',
    '`#setwelcomemsg <msg>` — Set welcome message',
    '`#setleave #channel` — Set leave channel',
    '`#setleavemsg <msg>` — Set leave message',
    '`#testwelcome` — Test welcome message',
    '`#testleave` — Test leave message',
  ],
  automation:[
    '`#setlog #channel` — Set log channel',
    '`#log messages on/off` — Message logs',
    '`#log moderation on/off` — Mod logs',
    '`#log joins on/off` — Join/leave logs',
    '`#log voice on/off` — Voice logs',
    '`#autorole @role` — Auto-role on join',
    '`#setcolor <hex>` — Set embed color',
  ],
  giveaway:[
    '`#gstart <time> <winners> <prize>` — Start giveaway',
    '`#gend <msgID>` — End early',
    '`#greroll <msgID>` — Reroll winner',
    '`#gpause <msgID>` — Pause',
    '`#gresume <msgID>` — Resume',
    '`#glist` — Active giveaways',
  ],
  protection:[
    '`#antispam on/off` — Toggle antispam',
    '`#antilinks on/off` — Toggle anti-links',
    '`#antibots on/off` — Toggle antibots',
    '`#antinuke on/off` — Toggle antinuke',
    '`#punishment <ban/kick/mute>` — Set punishment',
    '`#limit spam <n>/<time>` — Spam limit',
    '`#whitelist add @user` — Whitelist user',
    '`#whitelist remove @user` — Remove whitelist',
    '`#whitelist list` — View whitelist',
    '`#protection` — View settings',
  ],
  invite:[
    '`#invites [@user]` — View invites',
    '`#inviteleaderboard` — Top inviters',
    '`#resetinvites [@user]` — Reset invites (admin)',
  ],
  ticket:[
    '`#ticket setup` — Setup ticket panel',
    '`#ticket open` — Open ticket',
    '`#ticket close` — Close ticket',
    '`#ticket delete` — Delete ticket',
    '`#ticket add @user` — Add to ticket',
    '`#ticket remove @user` — Remove from ticket',
    '`#ticket setsupport @role` — Support role',
  ],
  plus:[
    '`#vip` — View subscription info',
    '`#vip name <n>` — Change bot nickname',
    '`#vip avatar` — Change bot avatar (attach image)',
    '`#vip banner` — Change bot banner (attach image)',
    '`#vip bio <text>` — Change bot bio',
    '`#vip reset` — Reset server settings',
    '`#vip transfer user <id>` — Transfer to user',
    '`#vip transfer server <id>` — Move to server',
    '`#activateplus <serverID>` — Activate Plus (owner)',
  ],
};

module.exports = {
  name:'help', aliases:['h','commands'],
  async execute(message, args, client) {
    if (args[0] && CMDS[args[0].toLowerCase()]) {
      const k = args[0].toLowerCase();
      return message.reply({embeds:[new EmbedBuilder()
        .setColor('#7C3AED')
        .setTitle(`${CATS[k].label}`)
        .setDescription(CMDS[k].join('\n'))
        .setFooter({text:config.footer}).setTimestamp()]});
    }

    const embed = new EmbedBuilder()
      .setColor('#7C3AED')
      .setAuthor({name:'DealerBot', iconURL:client.user.displayAvatarURL()})
      .setTitle('Bot Commands')
      .setDescription('**Categories:**\n'+Object.values(CATS).map(c=>`• ${c.label}`).join('\n'))
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({text:config.footer}).setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Choose a category to view its commands')
      .addOptions(Object.entries(CATS).map(([v,{label,desc}])=>({
        label: label.replace(/^[^\w]+/,'').trim(),
        description: desc, value: v,
      })));

    const row = new ActionRowBuilder().addComponents(menu);
    const msg = await message.reply({embeds:[embed], components:[row]});

    const col = msg.createMessageComponentCollector({time:60000});
    col.on('collect', async i=>{
      if (i.user.id!==message.author.id) return i.reply({content:'Not your menu!',ephemeral:true});
      const k=i.values[0];
      await i.update({embeds:[new EmbedBuilder()
        .setColor('#7C3AED')
        .setTitle(CATS[k].label)
        .setDescription(CMDS[k].join('\n'))
        .setFooter({text:config.footer}).setTimestamp()], components:[row]});
    });
    col.on('end',()=>msg.edit({components:[]}).catch(()=>{}));
  }
};
