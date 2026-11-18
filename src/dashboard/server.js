require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const { db, getGuild, getProt, getLogs, getTicketCfg, getLvlCfg, getActivePlus } = require('../database/db');
const config = require('../../config/config');

const app = express();
let botClient = null;
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

// Normalise DASHBOARD_URL: add http:// if missing, drop trailing slashes
let BASE_URL = (process.env.DASHBOARD_URL || `http://localhost:${process.env.DASHBOARD_PORT || 3000}`).trim().replace(/\/+$/, '');
if (!/^https?:\/\//i.test(BASE_URL)) BASE_URL = 'http://' + BASE_URL;
const CALLBACK_URL = `${BASE_URL}/auth/callback`;
console.log('[Dashboard] OAuth redirect URI (add this EXACTLY in Discord Developer Portal → OAuth2 → Redirects):\n  ' + CALLBACK_URL);

const isProd = BASE_URL.startsWith('https');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.startsWith('change_this'))
  console.warn('[Dashboard] ⚠ Set a strong SESSION_SECRET in .env');
if (isProd) app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 604800000, httpOnly: true, sameSite: 'lax', secure: isProd }
}));

passport.use(new Strategy({
  clientID:     process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL:  CALLBACK_URL,
  scope: ['identify','guilds'],
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
app.use(passport.initialize());
app.use(passport.session());

// ── Auth middleware ────────────────────────────────────────
const ADMIN = 0x8n;
const canAdmin = g => g && (g.owner || (BigInt(String(g.permissions || 0)) & ADMIN) === ADMIN);
const auth = (req,res,next) => req.user ? next() : res.redirect('/auth/login');
const apiAuth = (req,res,next) => req.user ? next() : res.status(401).json({ok:false,error:'not logged in'});

// user must be Administrator in :guildId AND the bot must be in that guild
function manage(isApi) {
  return (req, res, next) => {
    const g = (req.user.guilds || []).find(x => x.id === req.params.guildId);
    const inBot = botClient?.guilds.cache.has(req.params.guildId);
    if (!canAdmin(g) || !inBot) {
      return isApi ? res.status(403).json({ok:false,error:'forbidden'}) : res.redirect('/dashboard');
    }
    req.guildInfo = g;
    next();
  };
}

// ── Routes ─────────────────────────────────────────────────
app.get('/', (req,res) => res.render('index', { user:req.user }));

app.get('/auth/login',    passport.authenticate('discord'));
app.get('/auth/callback', passport.authenticate('discord',{ failureRedirect:'/' }),
  (req,res) => res.redirect('/dashboard'));
app.get('/auth/logout', (req,res) => { req.logout(()=>res.redirect('/')); });

app.get('/dashboard', auth, (req,res) => {
  const guilds = (req.user.guilds||[]).filter(g => canAdmin(g) && botClient?.guilds.cache.has(g.id));
  res.render('dashboard', { user:req.user, guilds });
});

app.get('/dashboard/:guildId', auth, manage(false), (req,res) => {
  const { guildId } = req.params;
  const guild = req.guildInfo;
  const g    = getGuild(guildId);
  const prot = getProt(guildId);
  const logs = getLogs(guildId);
  const tick = getTicketCfg(guildId);
  const lvl  = getLvlCfg(guildId);
  const pl   = getActivePlus(guildId);
  res.render('server', { user:req.user, guild, g, prot, logs, tick, lvl, pl });
});

// ── API helpers ────────────────────────────────────────────
const bool  = v => (v === true || v === 1 || v === '1' || v === 'on' || v === 'true') ? 1 : 0;
const num   = (v, d, min, max) => { const n = parseInt(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const chan  = (guildId, v) => {
  if (!v) return null;
  const ch = botClient.guilds.cache.get(guildId)?.channels.cache.get(String(v));
  return ch ? ch.id : null;           // only accept channels that really belong to this guild
};

// ── API: save settings ─────────────────────────────────────
app.post('/api/:guildId/general', apiAuth, manage(true), (req,res) => {
  const { guildId } = req.params;
  getGuild(guildId);
  const prefix = String(req.body.prefix || '#').trim().slice(0, 5) || '#';
  const colorRaw = String(req.body.embed_color || '7C3AED').replace('#','');
  const color = /^[0-9a-fA-F]{6}$/.test(colorRaw) ? colorRaw : '7C3AED';
  db.prepare('UPDATE guild_settings SET prefix=?,embed_color=? WHERE guild_id=?').run(prefix, color, guildId);
  res.json({ok:true});
});

app.post('/api/:guildId/protection', apiAuth, manage(true), (req,res) => {
  const { guildId } = req.params;
  const b = req.body;
  const punishment = ['ban','kick','mute'].includes(b.punishment) ? b.punishment : 'mute';
  getProt(guildId);
  db.prepare(`UPDATE protection SET antispam=?,antilinks=?,antibots=?,antinuke=?,punishment=?,antispam_action=?,antispam_limit=?,antispam_time=? WHERE guild_id=?`)
    .run(bool(b.antispam),bool(b.antilinks),bool(b.antibots),bool(b.antinuke),punishment,punishment,
         num(b.antispam_limit,5,2,50), num(b.antispam_time,5,1,120), guildId);
  res.json({ok:true});
});

app.post('/api/:guildId/logs', apiAuth, manage(true), (req,res) => {
  const { guildId } = req.params;
  const b = req.body;
  getLogs(guildId);
  db.prepare(`UPDATE log_settings SET messages_enabled=?,messages_channel=?,moderation_enabled=?,moderation_channel=?,joins_enabled=?,joins_channel=? WHERE guild_id=?`)
    .run(bool(b.messages_enabled),chan(guildId,b.messages_channel),
         bool(b.moderation_enabled),chan(guildId,b.moderation_channel),
         bool(b.joins_enabled),chan(guildId,b.joins_channel),guildId);
  res.json({ok:true});
});

function start(client) {
  botClient = client;
  const PORT = process.env.DASHBOARD_PORT || 3000;
  app.listen(PORT, () => console.log(`[Dashboard] http://localhost:${PORT}`));
}

module.exports = { app, start };
