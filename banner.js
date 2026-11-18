let CV = null;
try {
  CV = require('@napi-rs/canvas');
  try {
    CV.GlobalFonts.registerFromPath(require.resolve('@fontsource/cairo/files/cairo-arabic-700-normal.woff'), 'CairoAr');
    CV.GlobalFonts.registerFromPath(require.resolve('@fontsource/cairo/files/cairo-latin-700-normal.woff'), 'CairoLat');
  } catch (e) { console.log('الخط العربي مش متسجل:', e.message); }
} catch (e) { console.log('مكتبة الصور مش متثبتة — البنرات هتتعطل:', e.message); }

const W = 1000, H = 320, F = s => `700 ${s}px CairoAr, CairoLat, sans-serif`;
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
async function base(avatar) {
  const c = CV.createCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(830, 160, 10, 830, 160, 420);
  g.addColorStop(0, 'rgba(255,255,255,0.20)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(8, 8, W - 16, H - 16, 28); ctx.stroke();
  ctx.save(); ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 45;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(830, 160, 104, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(830, 160, 100, 0, Math.PI * 2); ctx.clip();
  const img = await loadAvatar(avatar);
  if (img) ctx.drawImage(img, 730, 60, 200, 200); else { ctx.fillStyle = '#222'; ctx.fillRect(730, 60, 200, 200); }
  ctx.restore();
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  return { c, ctx };
}
function glowText(ctx, t, x, y, size, color = '#fff', glow = 0) {
  ctx.save(); ctx.font = F(size); ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = glow; }
  ctx.fillText(t, x, y, 640); ctx.restore();
}
async function welcomeBanner({ title, name, avatar, line }) {
  if (!CV) return null;
  const { c, ctx } = await base(avatar);
  glowText(ctx, title || 'أهلاً بيك', 690, 95, 66, '#fff', 22);
  glowText(ctx, name, 690, 175, 44, '#e8e8e8');
  glowText(ctx, line || '', 690, 240, 28, '#9a9a9a');
  return c.toBuffer('image/png');
}
async function feedbackBanner({ name, avatar, stars, thanks }) {
  if (!CV) return null;
  const { c, ctx } = await base(avatar);
  glowText(ctx, thanks || 'شكرًا لتقييمك!', 690, 80, 56, '#fff', 22);
  glowText(ctx, name, 690, 145, 38, '#e8e8e8');
  for (let i = 0; i < 5; i++) {
    const cx = 666 - i * 58, on = i < stars;
    ctx.save();
    star(ctx, cx, 230, 24);
    if (on) { ctx.shadowColor = 'rgba(255,213,74,0.95)'; ctx.shadowBlur = 24; ctx.fillStyle = '#ffd54a'; ctx.fill(); }
    else { ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.stroke(); }
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
module.exports = { available, welcomeBanner, feedbackBanner, icon, ICONS };
