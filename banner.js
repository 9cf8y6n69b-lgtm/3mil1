let CV = null;
try {
  CV = require('@napi-rs/canvas');
  try {
    CV.GlobalFonts.registerFromPath(require.resolve('@fontsource/cairo/files/cairo-arabic-700-normal.woff'), 'CairoAr');
    CV.GlobalFonts.registerFromPath(require.resolve('@fontsource/cairo/files/cairo-latin-700-normal.woff'), 'CairoLat');
  } catch (e) { console.log('الخط العربي مش متسجل:', e.message); }
} catch (e) { console.log('مكتبة الصور مش متثبتة — البنرات هتتعطل:', e.message); }

const fs = require('fs'), path = require('path');
const ASSETS = path.join(__dirname, 'assets');
const _cache = {};
// يقرأ صورة الهوية من مجلد assets مرة واحدة ويحتفظ بها في الذاكرة
function asset(name) {
  if (!(name in _cache)) { try { _cache[name] = fs.readFileSync(path.join(ASSETS, name)); } catch { _cache[name] = null; } }
  return _cache[name];
}

// ─────────────── تصميم البنر (قابل للتعديل كله من الداشبورد) ───────────────
// الإحداثيات بالبكسل على اللوحة. الإطار الافتراضي (assets/frame.png) مقاسه 1540x740 والدايرة في (649, 323)
const F = s => `700 ${s}px CairoAr, CairoLat, sans-serif`;
const DEFAULT_DESIGN = {
  bg: '#ffffff', frame: 'default',                       // frame: default | custom | none
  avatar: { x: 649, y: 323.5, r: 269, shape: 'circle', radius: 60 },   // shape: circle | rounded | square
  ring: { on: false, color: '#c9ced6', width: 10 },
  title: { on: true, x: 1500, y: 85, size: 62, color: '#0d0d0f', align: 'right', maxW: 540 },
  name: { on: true, x: 1500, y: 165, size: 44, color: '#2b2d31', align: 'right', maxW: 540 },
  line: { on: true, x: 1500, y: 228, size: 28, color: '#6b7280', align: 'right', maxW: 540 },
  stars: { x: 1465, y: 225, size: 26, gap: 62, on: '#f5b800', off: '#9aa0a8' }
};
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => { const o = { ...a }; for (const k in (b || {})) o[k] = isObj(a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k] ?? a[k]; return o; };
const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const col = (v, d) => (/^#[0-9a-f]{3,8}$/i.test(String(v)) ? v : d);
// ينضف التصميم القادم من الداشبورد (أرقام ضمن حدود، ألوان صحيحة، قيم مسموحة بس)
function cleanDesign(raw) {
  const d = merge(DEFAULT_DESIGN, isObj(raw) ? raw : {}), D = DEFAULT_DESIGN;
  d.bg = col(d.bg, D.bg); d.frame = ['default', 'custom', 'none'].includes(d.frame) ? d.frame : 'default';
  d.avatar = { x: num(d.avatar.x, D.avatar.x, 0, 4000), y: num(d.avatar.y, D.avatar.y, 0, 4000), r: num(d.avatar.r, D.avatar.r, 20, 1500), radius: num(d.avatar.radius, 60, 0, 800), shape: ['circle', 'rounded', 'square'].includes(d.avatar.shape) ? d.avatar.shape : 'circle' };
  d.ring = { on: !!d.ring.on, color: col(d.ring.color, D.ring.color), width: num(d.ring.width, 10, 1, 60) };
  for (const k of ['title', 'name', 'line']) d[k] = { on: d[k].on !== false, x: num(d[k].x, D[k].x, 0, 4000), y: num(d[k].y, D[k].y, 0, 4000), size: num(d[k].size, D[k].size, 8, 240), color: col(d[k].color, D[k].color), align: ['left', 'center', 'right'].includes(d[k].align) ? d[k].align : 'right', maxW: num(d[k].maxW, D[k].maxW, 40, 4000) };
  d.stars = { x: num(d.stars.x, D.stars.x, 0, 4000), y: num(d.stars.y, D.stars.y, 0, 4000), size: num(d.stars.size, 26, 6, 120), gap: num(d.stars.gap, 62, 10, 300), on: col(d.stars.on, D.stars.on), off: col(d.stars.off, D.stars.off) };
  return d;
}
const available = () => !!CV;

async function loadAvatar(src) {
  try {
    const buf = Buffer.isBuffer(src) ? src : Buffer.from(await (await fetch(src)).arrayBuffer());
    return await CV.loadImage(buf);
  } catch { return null; }
}
function star(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? R * 0.45 : R, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}
function shapePath(ctx, av) {
  const { x, y, r, shape, radius } = av;
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (ctx.roundRect) ctx.roundRect(x - r, y - r, r * 2, r * 2, shape === 'square' ? 0 : Math.min(radius, r));
  else ctx.rect(x - r, y - r, r * 2, r * 2);
}
let _frame = null;
async function frameImage(d, frameBuf) {
  if (d.frame === 'none') return null;
  if (d.frame === 'custom' && frameBuf) { try { return await CV.loadImage(frameBuf); } catch { return null; } }
  const b = asset('frame.png');
  if (!b) return null;
  try { return _frame ||= await CV.loadImage(b); } catch { return null; }
}
async function base(avatar, design, frameBuf) {
  const d = cleanDesign(design), fr = await frameImage(d, frameBuf);
  let W = 1540, H = 740;
  if (fr && d.frame === 'custom') { const k = Math.min(1, 1600 / fr.width); W = Math.round(fr.width * k); H = Math.round(fr.height * k); }
  const c = CV.createCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = d.bg; ctx.fillRect(0, 0, W, H);
  if (fr) ctx.drawImage(fr, 0, 0, W, H);
  if (d.ring.on) { ctx.save(); shapePath(ctx, d.avatar); ctx.lineWidth = d.ring.width * 2; ctx.strokeStyle = d.ring.color; ctx.stroke(); ctx.restore(); }
  // داخل الإطار الافتراضي أبيض غير شفاف، فالصورة الشخصية تنرسم فوقه داخل الشكل المختار
  ctx.save(); shapePath(ctx, d.avatar); ctx.clip();
  const A = d.avatar, img = await loadAvatar(avatar);
  if (img) ctx.drawImage(img, A.x - A.r, A.y - A.r, A.r * 2, A.r * 2); else { ctx.fillStyle = '#d9dce1'; ctx.fillRect(A.x - A.r, A.y - A.r, A.r * 2, A.r * 2); }
  ctx.restore();
  ctx.direction = 'rtl'; ctx.textBaseline = 'middle';
  return { c, ctx, d };
}
function put(ctx, t, o) {
  if (!o.on || !t) return;
  ctx.save(); ctx.font = F(o.size); ctx.fillStyle = o.color; ctx.textAlign = o.align;
  ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 6;
  ctx.fillText(t, o.x, o.y, o.maxW); ctx.restore();
}
async function welcomeBanner({ title, name, avatar, line, design, frameBuf }) {
  if (!CV) return null;
  const { c, ctx, d } = await base(avatar, design, frameBuf);
  put(ctx, title || 'أهلاً بيك', d.title); put(ctx, name, d.name); put(ctx, line || '', d.line);
  return c.toBuffer('image/png');
}
async function feedbackBanner({ name, avatar, stars, thanks, design, frameBuf }) {
  if (!CV) return null;
  const { c, ctx, d } = await base(avatar, design, frameBuf);
  put(ctx, thanks || 'شكرًا لتقييمك!', d.title); put(ctx, name, d.name);
  for (let i = 0; i < 5; i++) {
    const cx = d.stars.x - i * d.stars.gap, on = i < stars;
    ctx.save(); star(ctx, cx, d.stars.y, d.stars.size);
    if (on) { ctx.shadowColor = 'rgba(255,190,40,0.7)'; ctx.shadowBlur = 14; ctx.fillStyle = d.stars.on; ctx.fill(); }
    else { ctx.strokeStyle = d.stars.off; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }
  return c.toBuffer('image/png');
}

const ICONS = ['ico_play', 'ico_pause', 'ico_skip', 'ico_stop', 'ico_loop', 'ico_loop1', 'ico_vdn', 'ico_vup', 'ico_star'];
function icon(name) {
  if (!CV || !ICONS.includes(name)) return null;
  const c = CV.createCanvas(128, 128), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  const rr = (a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); x.fill(); };
  const poly = p => { x.beginPath(); p.forEach(([a, b], i) => x[i ? 'lineTo' : 'moveTo'](a, b)); x.closePath(); x.fill(); x.lineWidth = 8; x.stroke(); };
  if (name === 'ico_pause') { rr(28, 22, 28, 84, 9); rr(72, 22, 28, 84, 9); }
  else if (name === 'ico_play') poly([[38, 22], [102, 64], [38, 106]]);
  else if (name === 'ico_skip') { poly([[24, 26], [84, 64], [24, 102]]); rr(92, 24, 18, 80, 7); }
  else if (name === 'ico_stop') rr(24, 24, 80, 80, 16);
  else if (name === 'ico_loop' || name === 'ico_loop1') {
    x.lineWidth = 12;
    x.beginPath(); x.moveTo(26, 72); x.lineTo(26, 58); x.quadraticCurveTo(26, 40, 44, 40); x.lineTo(84, 40); x.stroke(); poly([[82, 20], [112, 40], [82, 60]]);
    x.beginPath(); x.moveTo(102, 56); x.lineTo(102, 70); x.quadraticCurveTo(102, 88, 84, 88); x.lineTo(44, 88); x.stroke(); poly([[46, 68], [16, 88], [46, 108]]);
    if (name === 'ico_loop1') { x.font = '700 40px CairoLat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1', 64, 66); }
  } else if (name === 'ico_vdn' || name === 'ico_vup') {
    poly([[18, 48], [40, 48], [66, 24], [66, 104], [40, 80], [18, 80]]);
    x.lineWidth = 10; x.beginPath(); x.arc(66, 64, 24, -0.7, 0.7); x.stroke();
    if (name === 'ico_vup') { x.beginPath(); x.arc(66, 64, 44, -0.7, 0.7); x.stroke(); }
  } else if (name === 'ico_star') {
    x.save(); star(x, 64, 66, 54); x.shadowColor = 'rgba(255,213,74,.9)'; x.shadowBlur = 10; x.fillStyle = '#ffd54a'; x.fill(); x.restore();
  }
  return c.toBuffer('image/png');
}
module.exports = { available, welcomeBanner, feedbackBanner, icon, ICONS, asset, cleanDesign, DEFAULT_DESIGN };
