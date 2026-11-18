# 💎 DealerBot v1.0

> Multi-server Discord bot with Plus subscription system  
> **Dev:** `Youssef`

---

## ⚡ Quick Start

```bash
npm install
cp .env.example .env
# Fill in your .env then:
npm start
```

---

## ⚙️ .env Setup

```env
TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
CLIENT_SECRET=your_bot_client_secret
OWNER_ID=your_discord_id
PREFIX=#
DASHBOARD_PORT=3000
DASHBOARD_URL=http://localhost:3000
SESSION_SECRET=random_string_here
```

---

## 📁 Project Structure

```
dealerbot/
├── src/
│   ├── commands/
│   │   ├── admin/        ← ban kick mute warn clear lock...
│   │   ├── public/       ← help ping avatar userinfo serverinfo
│   │   ├── level/        ← rank top setlevel resetxp xpsettings
│   │   ├── greet/        ← setwelcome setwelcomemsg setleave...
│   │   ├── automation/   ← setlog log
│   │   ├── giveaway/     ← gstart gend greroll gpause gresume glist
│   │   ├── protection/   ← antispam antilinks antibots antinuke...
│   │   ├── invite/       ← invites inviteleaderboard resetinvites
│   │   ├── ticket/       ← ticket (setup/open/close/add/remove)
│   │   └── plus/         ← vip activateplus
│   ├── events/           ← ready messageCreate guildMemberAdd...
│   ├── handlers/         ← commandHandler eventHandler
│   ├── database/         ← db.js (SQLite)
│   ├── utils/            ← embed.js helpers.js
│   ├── dashboard/        ← Express + EJS dashboard
│   └── index.js
├── config/config.js
├── data/dealer.db        ← auto-created
└── .env
```

---

## 🛠️ All Commands

### 🔨 Admin (prefix: #)
| Command | Description |
|---------|-------------|
| `#ban @user [reason]` | Ban a member |
| `#unban <id>` | Unban |
| `#kick @user [reason]` | Kick |
| `#mute @user [time] [reason]` | Mute (timeout) |
| `#unmute @user` | Unmute |
| `#timeout @user <time>` | Timeout |
| `#untimeout @user` | Remove timeout |
| `#warn @user [reason]` | Warn |
| `#warnings @user` | View warnings |
| `#clearwarns @user` | Clear warnings |
| `#clear <n>` | Delete messages |
| `#lock [#channel]` | Lock channel |
| `#unlock [#channel]` | Unlock channel |
| `#slowmode <time>` | Set slowmode |
| `#setprefix <p>` | Change prefix |
| `#setmodrole @role` | Set mod role |
| `#setadminrole @role` | Set admin role |
| `#setcolor <hex>` | Embed color |
| `#autorole @role` | Auto-role on join |

### 👥 Public
| Command | Description |
|---------|-------------|
| `#help` | Command menu with dropdown |
| `#ping` | Bot latency |
| `#avatar [@user]` | View avatar |
| `#userinfo [@user]` | User info |
| `#serverinfo` | Server info |

### ✨ Level System
| Command | Description |
|---------|-------------|
| `#rank [@user]` | View rank & XP |
| `#top` | XP leaderboard |
| `#setlevel @user <n>` | Set level (admin) |
| `#resetxp @user` | Reset XP (admin) |
| `#xpsettings` | Configure XP system |
| `#levelupchannel #ch` | Level-up channel |

### 🌟 Greet
| Command | Description |
|---------|-------------|
| `#setwelcome #channel` | Welcome channel |
| `#setwelcomemsg <msg>` | Welcome message |
| `#setleave #channel` | Leave channel |
| `#setleavemsg <msg>` | Leave message |
| `#testwelcome` | Test welcome |
| `#testleave` | Test leave |

### ⚙️ Automation
| Command | Description |
|---------|-------------|
| `#setlog #channel` | Set all logs to one channel |
| `#log messages on/off #ch` | Message logs |
| `#log moderation on/off #ch` | Moderation logs |
| `#log joins on/off #ch` | Join/leave logs |

### 🎉 Giveaway
| Command | Description |
|---------|-------------|
| `#gstart <time> <winners> <prize>` | Start giveaway |
| `#gend <msgID>` | End early |
| `#greroll <msgID>` | Reroll winner |
| `#gpause <msgID>` | Pause |
| `#gresume <msgID>` | Resume |
| `#glist` | Active giveaways |

### 🛡️ Protection
| Command | Description |
|---------|-------------|
| `#antispam on/off` | Toggle antispam |
| `#antilinks on/off` | Toggle anti-links |
| `#antibots on/off` | Toggle antibots |
| `#antinuke on/off` | Toggle antinuke |
| `#punishment <ban/kick/mute>` | Default punishment |
| `#limit spam 5/10s` | Spam limit |
| `#whitelist add/remove/list` | Whitelist users |
| `#protection` | View all settings |

### 🔗 Invite
| Command | Description |
|---------|-------------|
| `#invites [@user]` | View invites |
| `#inviteleaderboard` | Top inviters |
| `#resetinvites [@user]` | Reset invites |

### 🎟️ Ticket
| Command | Description |
|---------|-------------|
| `#ticket setup` | Setup panel |
| `#ticket open` | Open ticket |
| `#ticket close` | Close ticket |
| `#ticket delete` | Delete ticket |
| `#ticket add @user` | Add to ticket |
| `#ticket remove @user` | Remove from ticket |
| `#ticket setsupport @role` | Support role |

### 💎 Plus (VIP)
| Command | Description |
|---------|-------------|
| `#vip` | View subscription info |
| `#vip name <nickname>` | Change bot nickname |
| `#vip avatar` | Change bot avatar (attach image) |
| `#vip banner` | Change bot banner (attach image) |
| `#vip bio <text>` | Set bot bio |
| `#vip reset` | Reset all Plus settings |
| `#vip transfer user <id>` | Transfer to user |
| `#vip transfer server <id>` | Move to server |
| `#activateplus <serverID> [userID] [plan] [days]` | Activate Plus (owner only) |

---

## 💎 Plus System

The Plus system lets server owners pay for a subscription that enables:
- Changing the bot's nickname per-server (`#vip name`)
- Changing the bot's avatar (`#vip avatar`)
- Changing the bot's banner (`#vip banner`)
- Setting a bot bio (`#vip bio`)

### Activate Plus (bot owner only):
```
#activateplus <serverID> <userID> monthly 30
#activateplus <serverID> <userID> yearly 365
#activateplus <serverID> <userID> lifetime
#activateplus <serverID> <userID> partnered
```

---

## 🌐 Dashboard

Start the dashboard separately:
```bash
node src/dashboard/server.js
```
Visit `http://localhost:3000` and login with Discord.

---

## 🌐 Multi-Server

Every server has **completely separate settings** stored in SQLite:
- Prefix, roles, colors
- Protection config
- Log channels
- Welcome/leave messages
- Level system
- Plus subscriptions

---

> **Dev:** `Youssef`

---

## 🔧 Changelog (v1.1)
- Dashboard now starts with the bot, restricted to server Administrators, with validated inputs
- Fixed tickets (SQL quoting) and locked ticket subcommands to ticket owner / staff
- Anti-Nuke now works (mass ban / kick detection via audit log): `#antinuke on|off|ban|kick|mute`, `#limit ban 3/10s`, `#limit kick 5/10s`
- Anti-links action: `#antilinks delete|mute|kick|ban`
- Invite tracking implemented (invites, left, fake)
- `#vip` settings require Administrator
- Bot needs: **Manage Server** (invites), **View Audit Log** (anti-nuke), **Moderate Members**, **Ban/Kick Members**

> **Dev:** Youssef
