const { DatabaseSync } = require('node:sqlite'); // built into Node 22+, no native build needed
const path = require('path');
const fs   = require('fs');

const dir = path.join(__dirname, '../../data');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(path.join(dir, 'dealer.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id        TEXT PRIMARY KEY,
    prefix          TEXT    DEFAULT '#',
    mod_role        TEXT,
    admin_role      TEXT,
    log_channel     TEXT,
    welcome_channel TEXT,
    welcome_msg     TEXT    DEFAULT 'Welcome {user} to **{server}**!',
    leave_channel   TEXT,
    leave_msg       TEXT    DEFAULT '**{username}** has left **{server}**.',
    embed_color     TEXT    DEFAULT '7C3AED',
    autorole        TEXT,
    created_at      INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS plus_subscriptions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    sub_number   INTEGER UNIQUE,
    guild_id     TEXT,
    user_id      TEXT NOT NULL,
    plan         TEXT    DEFAULT 'monthly',
    expires_at   INTEGER,
    is_lifetime  INTEGER DEFAULT 0,
    is_partnered INTEGER DEFAULT 0,
    is_active    INTEGER DEFAULT 1,
    bot_nickname TEXT,
    bot_avatar   TEXT,
    bot_banner   TEXT,
    bot_bio      TEXT,
    activated_by TEXT,
    created_at   INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT    NOT NULL,
    user_id    TEXT    NOT NULL,
    mod_id     TEXT    NOT NULL,
    reason     TEXT    DEFAULT 'No reason provided',
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS mutes (
    guild_id   TEXT    NOT NULL,
    user_id    TEXT    NOT NULL,
    mod_id     TEXT,
    reason     TEXT,
    expires_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS protection (
    guild_id              TEXT PRIMARY KEY,
    antispam              INTEGER DEFAULT 0,
    antispam_limit        INTEGER DEFAULT 5,
    antispam_time         INTEGER DEFAULT 5,
    antispam_action       TEXT    DEFAULT 'mute',
    antilinks             INTEGER DEFAULT 0,
    antilinks_action      TEXT    DEFAULT 'delete',
    antibots              INTEGER DEFAULT 0,
    antibots_action       TEXT    DEFAULT 'kick',
    antinuke              INTEGER DEFAULT 0,
    antinuke_ban_limit    INTEGER DEFAULT 3,
    antinuke_kick_limit   INTEGER DEFAULT 5,
    antinuke_action       TEXT    DEFAULT 'ban',
    punishment            TEXT    DEFAULT 'mute'
  );

  CREATE TABLE IF NOT EXISTS protection_whitelist (
    guild_id TEXT NOT NULL,
    user_id  TEXT NOT NULL,
    added_by TEXT,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS log_settings (
    guild_id           TEXT PRIMARY KEY,
    messages_channel   TEXT,
    messages_enabled   INTEGER DEFAULT 0,
    moderation_channel TEXT,
    moderation_enabled INTEGER DEFAULT 0,
    joins_channel      TEXT,
    joins_enabled      INTEGER DEFAULT 0,
    voice_channel      TEXT,
    voice_enabled      INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ticket_settings (
    guild_id        TEXT PRIMARY KEY,
    panel_channel   TEXT,
    panel_message   TEXT,
    ticket_category TEXT,
    support_role    TEXT,
    ticket_msg      TEXT    DEFAULT 'Welcome! A staff member will assist you shortly.',
    log_channel     TEXT,
    counter         INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT    NOT NULL,
    channel_id TEXT    NOT NULL UNIQUE,
    user_id    TEXT    NOT NULL,
    status     TEXT    DEFAULT 'open',
    created_at INTEGER DEFAULT (strftime('%s','now')),
    closed_at  INTEGER
  );

  CREATE TABLE IF NOT EXISTS giveaways (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT    NOT NULL,
    channel_id TEXT    NOT NULL,
    message_id TEXT,
    host_id    TEXT    NOT NULL,
    prize      TEXT    NOT NULL,
    winners    INTEGER DEFAULT 1,
    entries    TEXT    DEFAULT '[]',
    ended      INTEGER DEFAULT 0,
    paused     INTEGER DEFAULT 0,
    end_time   INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS levels (
    user_id  TEXT    NOT NULL,
    guild_id TEXT    NOT NULL,
    xp       INTEGER DEFAULT 0,
    level    INTEGER DEFAULT 0,
    messages INTEGER DEFAULT 0,
    last_xp  INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS level_settings (
    guild_id        TEXT PRIMARY KEY,
    enabled         INTEGER DEFAULT 1,
    xp_min          INTEGER DEFAULT 15,
    xp_max          INTEGER DEFAULT 40,
    xp_cooldown     INTEGER DEFAULT 60,
    levelup_channel TEXT,
    levelup_msg     TEXT DEFAULT 'GG {user}! You reached level **{level}**! 🎉'
  );

  CREATE TABLE IF NOT EXISTS invite_joins (
    guild_id   TEXT NOT NULL,
    member_id  TEXT NOT NULL,
    inviter_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS invites (
    guild_id   TEXT    NOT NULL,
    user_id    TEXT    NOT NULL,
    inviter_id TEXT,
    total      INTEGER DEFAULT 0,
    left_count INTEGER DEFAULT 0,
    fake       INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
`);

// ── helpers ───────────────────────────────────────────────
function getGuild(gid) {
  db.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(gid);
  return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(gid);
}
function getProt(gid) {
  db.prepare('INSERT OR IGNORE INTO protection (guild_id) VALUES (?)').run(gid);
  return db.prepare('SELECT * FROM protection WHERE guild_id = ?').get(gid);
}
function getLogs(gid) {
  db.prepare('INSERT OR IGNORE INTO log_settings (guild_id) VALUES (?)').run(gid);
  return db.prepare('SELECT * FROM log_settings WHERE guild_id = ?').get(gid);
}
function getTicketCfg(gid) {
  db.prepare('INSERT OR IGNORE INTO ticket_settings (guild_id) VALUES (?)').run(gid);
  return db.prepare('SELECT * FROM ticket_settings WHERE guild_id = ?').get(gid);
}
function getLvlCfg(gid) {
  db.prepare('INSERT OR IGNORE INTO level_settings (guild_id) VALUES (?)').run(gid);
  return db.prepare('SELECT * FROM level_settings WHERE guild_id = ?').get(gid);
}
function getLevel(uid, gid) {
  db.prepare('INSERT OR IGNORE INTO levels (user_id, guild_id) VALUES (?,?)').run(uid, gid);
  return db.prepare('SELECT * FROM levels WHERE user_id=? AND guild_id=?').get(uid, gid);
}
function xpForLevel(lvl) { return 100 * lvl * lvl + 100 * lvl; }
function getActivePlus(gid) {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`SELECT * FROM plus_subscriptions
    WHERE guild_id=? AND is_active=1
    AND (is_lifetime=1 OR is_partnered=1 OR expires_at>?)
    ORDER BY created_at DESC LIMIT 1`).get(gid, now);
}
function nextSubNumber() {
  const r = db.prepare('SELECT MAX(sub_number) as m FROM plus_subscriptions').get();
  return (r?.m || 1000) + 1;
}
function replacePlaceholders(str, map) {
  return Object.entries(map).reduce((a,[k,v]) => a.replace(new RegExp(`\\{${k}\\}`,'g'), v), str);
}

module.exports = { db, getGuild, getProt, getLogs, getTicketCfg, getLvlCfg, getLevel, xpForLevel, getActivePlus, nextSubNumber, replacePlaceholders };
