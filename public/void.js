/* إضافات الداشبورد: مصمم الترحيب/التقييم + التكت المتقدم + اللوقات + الفلاتر + الأوامر + الخبرة */
(() => {
const E = (tag, p = {}, ...kids) => { const el = document.createElement(tag); for (const k in p) { if (k === 'class') el.className = p[k]; else if (k === 'html') el.innerHTML = p[k]; else if (k.startsWith('on')) el[k] = p[k]; else if (p[k] !== undefined && p[k] !== null) el.setAttribute(k, p[k]); } kids.flat().forEach(c => el.append(c?.nodeType ? c : document.createTextNode(c ?? ''))); return el; };
const post = (p, b) => api(p, b || {});
const dl = (btn, fn, ok) => run(btn, fn, ok);
const btn = (txt, icon, fn, cls) => { const b = E('button', { class: 'btn', type: 'button', html: (icon ? ic(icon) : '') + '' }); b.append(txt); if (cls) b.style.cssText = cls; b.onclick = () => dl(b, fn); return b; };
const ghost = 'background:var(--s3);color:#fff';
const field = (label, input) => E('label', { class: 'f' }, E('span', {}, label), input);
const sel = (items, value, onch, empty) => { const s = E('select'); if (empty !== undefined) s.append(E('option', { value: '' }, empty)); items.forEach(x => s.append(E('option', { value: x.id }, x.name))); s.value = value || ''; s.onchange = () => onch(s.value); return s; };
const toggle = (on, onch) => { const i = E('input', { type: 'checkbox' }); i.checked = !!on; i.onchange = () => onch(i.checked); return E('label', { class: 'sw' }, i, E('i')); };
const row = (icon, title, sub, right) => E('div', { class: 'row' }, E('div', { class: 'tile', html: ic(icon) }), E('div', {}, title, sub ? E('small', {}, sub) : ''), right);
const readFile = f => new Promise((ok, no) => { if (!f) return no(new Error('اختار صورة')); if (f.size > 3 * 1024 * 1024) return no(new Error('الصورة أكبر من 3MB')); const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error('فشل قراءة الملف')); r.readAsDataURL(f); });
const pickFile = cb => { const i = E('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp' }); i.onchange = async () => { try { cb(await readFile(i.files[0])); } catch (e) { toast(e.message, true); } }; i.click(); };
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

let ST = null;
const state = async () => ST || (ST = await api('state'));
const chans = () => ST.text, roles = () => ST.roles, cats = () => ST.cats;

// ───────────────────────── CSS ─────────────────────────
document.head.append(E('style', {}, `
.dz{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:18px}@media(max-width:900px){.dz{grid-template-columns:1fr}}
.dz-prev{position:sticky;top:12px;align-self:start;background:#fff;border-radius:14px;overflow:hidden;border:1px solid var(--line);min-height:120px}
.dz-prev img{display:block;width:100%;height:auto;cursor:crosshair}.dz-prev small{display:block;padding:8px 12px;background:var(--s2);color:var(--mu);font-size:12px}
.grp{border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:10px 0;background:var(--s1)}.grp h4{margin:0 0 8px;font-size:14px}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.g3 label.f{margin:0}.g3 input,.g3 select{width:100%}
input[type=color]{height:42px;padding:3px;width:100%}input[type=range]{width:100%}
.chips2{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}.chips2 button{background:var(--s3);border:1px solid var(--line);color:#fff;border-radius:999px;padding:6px 12px;cursor:pointer}.chips2 button.on{background:#fff;color:#000}
.vrow{display:grid;grid-template-columns:44px 1fr 1fr 150px 44px;gap:8px;margin-bottom:8px;align-items:center}@media(max-width:700px){.vrow{grid-template-columns:44px 1fr 44px}.vrow>:nth-child(3),.vrow>:nth-child(4){grid-column:1/-1}}
.warn{background:#2a1010;border:1px solid #5a1f1f;color:#ffb4b4;border-radius:14px;padding:12px 16px;margin-bottom:18px;font-size:14px}
.lg{display:grid;grid-template-columns:1fr 220px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}
.cmdbox{border:1px solid var(--line);border-radius:12px;margin-bottom:8px;background:var(--s1)}.cmdbox>summary{cursor:pointer;padding:10px 14px;display:flex;gap:10px;align-items:center;list-style:none}.cmdbox>summary code{background:var(--s3);padding:2px 8px;border-radius:8px}.cmdbox>div{padding:10px 14px 14px;border-top:1px solid var(--line)}
.tag{font-size:11px;color:var(--mu);border:1px solid var(--line);border-radius:999px;padding:1px 8px}
`));

// ───────────────────────── مصمم البنر ─────────────────────────
const TXT = { title: 'العنوان', name: 'الاسم', line: 'السطر الصغير' };
async function designCard(kind, host) {
  const r = await api('design/' + kind); let D = r.design, hasFrame = r.hasFrame; const DEF = r.defaults;
  const img = E('img', { alt: '' }), note = E('small', {}, 'اضغط على المعاينة لنقل مركز الصورة الشخصية'), box = E('div', { class: 'dz-prev' }, img, note);
  let busy = false, again = false;
  const render = async () => {
    if (busy) { again = true; return; } busy = true;
    try {
      const res = await fetch('/api/preview/' + kind, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ design: D, sample: { stars: 4 } }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'فشلت المعاينة');
      const url = URL.createObjectURL(await res.blob()); const old = img.src; img.src = url; if (old.startsWith('blob:')) URL.revokeObjectURL(old);
    } catch (e) { note.textContent = e.message; }
    busy = false; if (again) { again = false; render(); }
  };
  const live = debounce(render, 300);
  const set = (path, v) => { const p = path.split('.'); let o = D; while (p.length > 1) o = o[p.shift()]; o[p[0]] = v; live(); };
  const get = path => path.split('.').reduce((o, k) => o?.[k], D);
  const num = (label, path, min, max, step = 1) => { const i = E('input', { type: 'number', min, max, step }); i.value = get(path); i.oninput = () => { if (i.value !== '') set(path, Number(i.value)); }; return field(label, i); };
  const colr = (label, path) => { const i = E('input', { type: 'color' }); i.value = get(path); i.oninput = () => set(path, i.value); return field(label, i); };
  const choose = (label, path, items) => { const s = E('select'); items.forEach(([v, n]) => s.append(E('option', { value: v }, n))); s.value = get(path); s.onchange = () => set(path, s.value); return field(label, s); };

  img.onclick = e => { const b = img.getBoundingClientRect(); const k = img.naturalWidth / b.width; set('avatar.x', Math.round((e.clientX - b.left) * k)); set('avatar.y', Math.round((e.clientY - b.top) * k)); sync(); };

  const frameSel = (() => { const s = E('select'); [['default', 'الإطار الافتراضي (Bloomy)'], ['custom', 'صورتي المرفوعة'], ['none', 'بدون إطار (لون فقط)']].forEach(([v, n]) => s.append(E('option', { value: v }, n))); s.value = D.frame; s.onchange = () => { if (s.value === 'custom' && !hasFrame) { toast('ارفع صورة أول', true); s.value = D.frame; return; } set('frame', s.value); }; return s; })();
  const controls = E('div', {});
  const groups = [];
  const g = (title, ...kids) => { const el = E('div', { class: 'grp' }, E('h4', {}, title), ...kids); controls.append(el); return el; };

  g('الخلفية والإطار', field('الإطار', frameSel), colr('لون الخلفية', 'bg'),
    E('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
      btn('رفع إطار مخصص', 'img', async () => { const data = await new Promise(ok => pickFile(ok)); await post('design/' + kind + '/frame', { data }); hasFrame = true; D.frame = 'custom'; frameSel.value = 'custom'; await render(); toast('انرفع الإطار'); }, ghost),
      btn('حذف المخصص', 'trash', async () => { await post('design/' + kind + '/frame', { clear: true }); hasFrame = false; D.frame = 'default'; frameSel.value = 'default'; await render(); }, ghost)));

  const av = g('الصورة الشخصية', E('div', { class: 'g3' }, choose('الشكل', 'avatar.shape', [['circle', 'دائرة'], ['rounded', 'مربع منحني'], ['square', 'مربع']]), num('الحجم (نص القطر)', 'avatar.r', 20, 1500), num('انحناء الزوايا', 'avatar.radius', 0, 800)),
    E('div', { class: 'g3' }, num('X', 'avatar.x', 0, 4000), num('Y', 'avatar.y', 0, 4000), E('div')),
    row('img', 'حلقة حول الصورة', 'مفيدة لو الإطار بدون دايرة', toggle(D.ring.on, v => set('ring.on', v))),
    E('div', { class: 'g3' }, colr('لون الحلقة', 'ring.color'), num('سماكتها', 'ring.width', 1, 60), E('div')));
  const sync = () => { av.querySelectorAll('input[type=number]').forEach(i => { /* يرجع القيم بعد الضغط على المعاينة */ }); [['avatar.x'], ['avatar.y']].forEach(([p]) => { const i = [...av.querySelectorAll('input[type=number]')].find(x => x.oninput && x.dataset.p === p); if (i) i.value = get(p); }); };
  av.querySelectorAll('input[type=number]').forEach((i, k) => { i.dataset.p = ['avatar.r', 'avatar.radius', 'avatar.x', 'avatar.y', 'ring.width'][k] || ''; });

  const blocks = kind === 'welcome' ? ['title', 'name', 'line'] : ['title', 'name'];
  blocks.forEach(k => g('نص: ' + TXT[k] + (kind === 'feedback' && k === 'title' ? ' (الشكر)' : ''),
    row('msg', 'إظهاره', '', toggle(D[k].on, v => set(k + '.on', v))),
    E('div', { class: 'g3' }, num('X', k + '.x', 0, 4000), num('Y', k + '.y', 0, 4000), num('الحجم', k + '.size', 8, 240)),
    E('div', { class: 'g3' }, colr('اللون', k + '.color'), choose('المحاذاة', k + '.align', [['right', 'يمين'], ['center', 'وسط'], ['left', 'يسار']]), num('أقصى عرض', k + '.maxW', 40, 4000))));
  if (kind === 'feedback') g('النجوم', E('div', { class: 'g3' }, num('X (أول نجمة)', 'stars.x', 0, 4000), num('Y', 'stars.y', 0, 4000), num('الحجم', 'stars.size', 6, 120)),
    E('div', { class: 'g3' }, num('المسافة', 'stars.gap', 10, 300), colr('لون المفعلة', 'stars.on'), colr('لون الفاضية', 'stars.off')));

  const actions = E('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:12px' },
    btn('حفظ التصميم', 'save', async () => { await post('design/' + kind, { design: D }); toast('انحفظ التصميم'); }),
    btn('رجوع للافتراضي', 'x', async () => { if (!confirm('ترجع التصميم للافتراضي وتحذف الإطار المخصص؟')) return; await post('design/' + kind + '/reset'); const n = await api('design/' + kind); D = n.design; hasFrame = false; host.querySelector('.dz-ctl').replaceChildren(); host.replaceChildren(); designCard(kind, host); }, ghost));
  const card = E('div', { class: 'card', style: 'margin-top:16px' }, E('h3', { html: ic('img') + 'تصميم البنر (الدايرة والنصوص والألوان)' }), E('div', { class: 'dz' }, E('div', { class: 'dz-ctl' }, controls, actions), box));
  host.replaceChildren(card); render();
}

// ───────────────────────── صفحات جديدة ─────────────────────────
const loaders = {};
const mkTab = (id, title, sub, icon, loader) => {
  tabs.push([id, title, icon]);
  const b = E('button', { html: ic(icon) + '<span>' + title + '</span>' }); b.dataset.t = id; b.onclick = () => show(id); $('#nav').append(b);
  const s = E('section', { id }, E('div', { class: 'head' }, E('div', { class: 'tile', html: ic(icon) }), E('div', {}, E('h1', {}, title), E('div', { class: 'sub' }, sub))), E('div', { class: 'body' }));
  $('main').append(s); loaders[id] = loader;
  return s.querySelector('.body');
};
const chipsPick = (list, chosen, onch) => { const set = new Set(chosen); const w = E('div', { class: 'chips2' }); list.forEach(x => { const b = E('button', { type: 'button', class: set.has(x.id) ? 'on' : '' }, x.name); b.onclick = () => { set.has(x.id) ? set.delete(x.id) : set.add(x.id); b.classList.toggle('on'); onch([...set]); }; w.append(b); }); return w; };

// ── التكت المتقدم
mkTab('vtickets', 'التكت المتقدم', 'طلب ← قبول/رفض ← تكت (استلام، تحويل، استدعاء، إغلاق) مع صور وأقسام', 'ticket', async function load() {
  const body = $('#vtickets .body'); await state();
  const r = await api('v/tickets'); const c = r.cfg; const hasImg = r.hasImg;
  const area = (k, label) => { const t = E('textarea', { style: 'min-height:70px' }); t.value = c[k] || ''; t.oninput = () => c[k] = t.value; return field(label, t); };
  const catsBox = E('div'); const drawCats = () => { catsBox.replaceChildren(); c.categories.forEach((x, k) => {
    const em = E('input', { type: 'text', placeholder: '😀', maxlength: 60 }); em.value = x.emoji || ''; em.oninput = () => x.emoji = em.value;
    const nm = E('input', { type: 'text', placeholder: 'اسم القسم' }); nm.value = x.name; nm.oninput = () => x.name = nm.value;
    const ds = E('input', { type: 'text', placeholder: 'وصف' }); ds.value = x.description || ''; ds.oninput = () => x.description = ds.value;
    const rl = sel(roles(), x.roleId, v => x.roleId = v || null, 'بدون رتبة خاصة');
    const del = E('button', { class: 'ib', type: 'button', html: ic('trash') }); del.onclick = () => { c.categories.splice(k, 1); drawCats(); };
    catsBox.append(E('div', { class: 'vrow' }, em, nm, ds, rl, del)); }); };
  drawCats();
  const imgCard = (kind, label) => E('div', { class: 'grp' }, E('h4', {}, label), E('div', { class: 'sub', style: 'margin-bottom:8px' }, hasImg[kind] ? 'صورة مخصصة مرفوعة' : 'الصورة الافتراضية (Bloomy)'),
    E('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, btn('رفع صورة', 'img', async () => { const data = await new Promise(ok => pickFile(ok)); await post('v/tickets/image', { kind, data }); hasImg[kind] = true; toast('انرفعت الصورة'); load(); }, ghost), btn('حذف المخصصة', 'trash', async () => { await post('v/tickets/image', { kind, clear: true }); hasImg[kind] = false; toast('رجعت للافتراضية'); load(); }, ghost)));
  const emo = E('pre', { class: 'sub', style: 'white-space:pre-wrap' });
  body.replaceChildren(
    E('div', { class: 'two' },
      E('div', { class: 'card' }, E('h3', { html: ic('panel') + 'الرومات والرتب' }),
        field('روم اللوحة', sel(chans(), c.panelChannelId, v => c.panelChannelId = v || null, 'غير محدد')),
        field('روم الطلبات (ريكوست)', sel(chans(), c.requestChannelId, v => c.requestChannelId = v || null, 'غير محدد')),
        field('كاتيغوري التكتات', sel(cats(), c.ticketCategoryId, v => c.ticketCategoryId = v || null, 'غير محدد')),
        E('div', { class: 'sub', style: 'margin:8px 0 2px' }, 'رتب الدعم (تقبل/ترفض وتشوف التكتات)'), chipsPick(roles(), c.reviewerRoleIds || [], v => c.reviewerRoleIds = v)),
      E('div', { class: 'card' }, E('h3', { html: ic('img') + 'الصور' }), imgCard('panel', 'صورة اللوحة'), imgCard('request', 'صورة الطلب'))),
    E('div', { class: 'card', style: 'margin-top:16px' }, E('h3', { html: ic('ticket') + 'الأقسام (حد أقصى 24)' }), catsBox,
      btn('إضافة قسم', 'plus', async () => { if (c.categories.length >= 24) throw new Error('وصلت الحد'); c.categories.push({ id: '', name: '', description: '', emoji: '', roleId: null }); drawCats(); }, ghost)),
    E('div', { class: 'card', style: 'margin-top:16px' }, E('h3', { html: ic('msg') + 'النصوص' }), E('div', { class: 'hint' }, 'المتغيرات: {user} {number} {category} {staff} {ticket} {admin} — اتركها فاضية للنص الافتراضي'),
      area('panelText', 'نص اللوحة'), area('requestText', 'نص الطلب'), area('ticketText', 'نص داخل التكت'), area('acceptedText', 'رسالة الخاص عند القبول'), area('pointText', 'رسالة الخاص عند النقطة')),
    E('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:16px' },
      btn('حفظ', 'save', async () => { await post('v/tickets', c); toast('انحفظت الإعدادات'); }),
      btn('إرسال اللوحة', 'send', async () => { await post('v/tickets', c); await post('v/tickets/send', { channelId: c.panelChannelId }); toast('انرسلت اللوحة'); }, ghost),
      btn('رفع إيموجيات التكت للسيرفر', 'plus', async () => { const rep = await post('v/emojis'); emo.textContent = `انضاف: ${rep.created.length} • موجود: ${rep.existed.length} • فشل: ${rep.failed.length}\n` + rep.failed.slice(0, 5).join('\n'); }, ghost)), emo);
});

// ── اللوقات
mkTab('vlogs', 'لوقات Void', 'لكل نوع لوق روم خاص (دخول/خروج/حذف/صوت/أوامر...) بكروت صور', 'logs', async function load() {
  const body = $('#vlogs .body'); await state(); const r = await api('v/logs');
  const all = sel(chans(), '', () => {}, 'اختار روم'); const list = E('div', { class: 'card', style: 'margin-top:16px' });
  r.types.forEach(t => list.append(E('div', { class: 'lg' }, E('div', {}, `${t.emoji} ${t.label}`), sel(chans(), r.map[t.key], async v => { try { await post('v/logs', { key: t.key, channelId: v || null }); toast('تم'); } catch (e) { toast(e.message, true); } }, '— غير مفعل —'))));
  body.replaceChildren(E('div', { class: 'card' }, E('h3', { html: ic('logs') + 'كل اللوقات في روم واحد' }), field('الروم', all), E('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, btn('تطبيق', 'check', async () => { await post('v/logs/all', { channelId: all.value }); toast('تم'); load(); }), btn('مسح كل الإعدادات', 'trash', async () => { if (confirm('تمسح كل إعدادات اللوقات؟')) { await post('v/logs/clear'); load(); } }, ghost)),
    E('div', { class: 'hint', style: 'margin-top:10px' }, 'لإنشاء رومات اللوق تلقائياً اكتب في ديسكورد: لوقات')), list);
});

// ── الفلاتر
mkTab('vfilters', 'الفلاتر', 'كلمات ممنوعة، سبام، دعوات، روابط — مع عقوبات تتدرج', 'shield', async function load() {
  const body = $('#vfilters .body'); await state(); const r = await api('v/filters'); const f = r.filters;
  const P = Object.entries(r.punish).map(([id, name]) => ({ id, name }));
  const lines = (v, onch, ph) => { const t = E('textarea', { style: 'min-height:90px', placeholder: ph }); t.value = (v || []).join('\n'); t.oninput = () => onch(t.value.split('\n').map(x => x.trim()).filter(Boolean)); return t; };
  const sw = (label, sub, k) => row('shield', label, sub, toggle(f[k].enabled, v => f[k].enabled = v));
  const num = (label, obj, k, min, max) => { const i = E('input', { type: 'number', min, max }); i.value = obj[k]; i.oninput = () => obj[k] = Number(i.value); return field(label, i); };
  body.replaceChildren(E('div', { class: 'two' },
    E('div', { class: 'card' }, E('h3', { html: ic('ban') + 'الكلمات الممنوعة' }), sw('تفعيل', 'العقوبة تتدرج مع التكرار', 'words'),
      E('div', { class: 'g3' }, ...[0, 1, 2].map(i => field('عقوبة ' + (i + 1), sel(P, f.words.punish[i], v => f.words.punish[i] = v)))), field('الكلمات (كلمة بكل سطر)', lines(f.words.list, v => f.words.list = v, 'كلمة'))),
    E('div', { class: 'card' }, E('h3', { html: ic('zap') + 'السبام' }), sw('تفعيل', 'رسائل متكررة بوقت قصير', 'spam'), field('العقوبة', sel(P, f.spam.punish, v => f.spam.punish = v)), E('div', { class: 'g3' }, num('عدد الرسائل', f.spam, 'count', 2, 10), num('خلال (ثواني)', f.spam, 'seconds', 5, 120), E('div')))),
    E('div', { class: 'two', style: 'margin-top:16px' },
      E('div', { class: 'card' }, E('h3', { html: ic('mail') + 'روابط الدعوات' }), sw('تفعيل', 'يمنع روابط سيرفرات ديسكورد', 'invites'), field('العقوبة', sel(P, f.invites.punish, v => f.invites.punish = v))),
      E('div', { class: 'card' }, E('h3', { html: ic('link') + 'الروابط' }), sw('تفعيل', 'يمنع أي رابط غير المسموح', 'links'), field('العقوبة', sel(P, f.links.punish, v => f.links.punish = v)), field('نطاقات مسموحة (نطاق بكل سطر)', lines(f.links.allow, v => f.links.allow = v, 'tenor.com')))),
    E('div', { class: 'card', style: 'margin-top:16px' }, E('h3', { html: ic('key') + 'رتب مستثناة' }), chipsPick(roles(), f.exemptRoles || [], v => f.exemptRoles = v)),
    E('div', { style: 'margin-top:16px' }, btn('حفظ', 'save', async () => { await post('v/filters', f); toast('انحفظت الفلاتر'); })));
});

// ── الأوامر والاختصارات
mkTab('vcmds', 'أوامر Void', 'تعطيل أي أمر، اختصارات، تحديد رتبة أو روم', 'term', async function load() {
  const body = $('#vcmds .body'); await state(); const r = await api('v/commands');
  const q = E('input', { type: 'text', placeholder: 'ابحث عن أمر...' }); const list = E('div');
  const draw = () => { list.replaceChildren(); r.commands.filter(c => !q.value || (c.name + c.desc + c.aliases.join(' ')).toLowerCase().includes(q.value.toLowerCase())).forEach(c => {
    const cfg = c.cfg, al = E('input', { type: 'text', placeholder: 'اختصارات مفصولة بفاصلة' }); al.value = (cfg.aliases || []).join(', ');
    const d = E('details', { class: 'cmdbox' }, E('summary', {}, E('code', {}, c.name), E('span', { class: 'tag' }, c.dir), cfg.disabled ? E('span', { class: 'tag' }, 'معطّل') : '', E('span', { class: 'sub' }, c.desc)),
      E('div', {}, row('x', 'تعطيل الأمر', '', toggle(cfg.disabled, v => cfg.disabled = v)), E('div', { class: 'sub' }, 'اختصارات مدمجة: ' + (c.aliases.join('، ') || '—')), field('اختصارات إضافية', al),
        field('رتبة مطلوبة', sel(roles(), cfg.roleId, v => cfg.roleId = v || null, 'للجميع')), field('روم محدد', sel(chans(), cfg.channelId, v => cfg.channelId = v || null, 'أي روم')),
        btn('حفظ', 'save', async () => { await post('v/command', { name: c.name, disabled: cfg.disabled, aliases: al.value.split(/[,،]/).map(x => x.trim()).filter(Boolean), roleId: cfg.roleId, channelId: cfg.channelId }); toast('انحفظ'); })));
    list.append(d); }); };
  q.oninput = draw; draw();
  const w = E('input', { type: 'text', placeholder: 'الكلمة (مثال: ب)' }), full = E('input', { type: 'text', placeholder: 'الأمر الكامل (مثال: ban)' }), sc = E('div');
  const drawSc = () => { sc.replaceChildren(); Object.entries(r.shortcuts).forEach(([k, v]) => { const x = E('button', { class: 'ib', type: 'button', html: ic('trash') }); x.onclick = () => dl(x, async () => { await post('v/shortcut', { word: k, remove: true }); delete r.shortcuts[k]; drawSc(); }); sc.append(E('div', { class: 'row' }, E('div', {}, E('code', {}, k), ' ← ', E('code', {}, v)), x)); }); if (!Object.keys(r.shortcuts).length) sc.append(E('div', { class: 'sub' }, 'ما فيه اختصارات')); }; drawSc();
  body.replaceChildren(E('div', { class: 'card' }, E('h3', { html: ic('zap') + 'اختصارات كاملة' }), E('div', { class: 'two' }, field('الكلمة', w), field('الأمر', full)),
    btn('إضافة', 'plus', async () => { await post('v/shortcut', { word: w.value, full: full.value }); r.shortcuts[w.value.toLowerCase().trim()] = full.value; w.value = full.value = ''; drawSc(); toast('انضاف'); }), sc),
    E('div', { class: 'card', style: 'margin-top:16px' }, E('h3', { html: ic('term') + 'كل الأوامر (' + r.commands.length + ')' }), field('بحث', q), list));
});

// ── الخبرة
mkTab('vxp', 'الخبرة والمستويات', 'خبرة من الشات والفويس، ورتب مكافأة عند اللفلات', 'star', async function load() {
  const body = $('#vxp .body'); await state(); const r = await api('v/xp'); const c = r.cfg; c.rewards = c.rewards || [];
  const box = E('div'); const draw = () => { box.replaceChildren(); c.rewards.forEach((x, k) => { const lv = E('input', { type: 'number', min: 1, max: 500, placeholder: 'اللفل' }); lv.value = x.level; lv.oninput = () => x.level = Number(lv.value); const del = E('button', { class: 'ib', type: 'button', html: ic('trash') }); del.onclick = () => { c.rewards.splice(k, 1); draw(); }; box.append(E('div', { class: 'vrow', style: 'grid-template-columns:110px 1fr 44px' }, lv, sel(roles(), x.roleId, v => x.roleId = v, 'اختار رتبة'), del)); }); }; draw();
  body.replaceChildren(E('div', { class: 'two' }, E('div', { class: 'card' }, E('h3', { html: ic('star') + 'الإعدادات' }), row('star', 'تفعيل الخبرة', 'رسالة = 15-25 XP كل دقيقة، فويس = 10 XP/دقيقة', toggle(c.enabled !== false, v => c.enabled = v)),
      field('روم إعلان اللفل (فاضي = نفس روم الرسالة)', sel(chans(), c.levelChannelId, v => c.levelChannelId = v || null, 'نفس الروم')), E('div', { class: 'sub', style: 'margin:10px 0 6px' }, 'مكافآت الرتب'), box,
      E('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, btn('إضافة مكافأة', 'plus', async () => { c.rewards.push({ level: 5, roleId: '' }); draw(); }, ghost), btn('حفظ', 'save', async () => { await post('v/xp', { enabled: c.enabled !== false, levelChannelId: c.levelChannelId, rewards: c.rewards }); toast('انحفظ'); }))),
    E('div', { class: 'card' }, E('h3', { html: ic('user') + 'أعلى 10' }), ...(r.top.length ? r.top.map((t, i) => E('div', { class: 'row' }, E('div', {}, `${i + 1}. ${t.name}`, E('small', {}, `${t.xp} XP`)), E('span', { class: 'tag' }, 'لفل ' + t.level))) : [E('div', { class: 'sub' }, 'لسه ما فيه أحد')]))));
});

// ── النسخ الاحتياطي والاسترجاع
mkTab('vbackup', 'النسخ الاحتياطي', 'نسخة موقّعة (كود + بيانات): تنرسل تلقائياً عند أي تعديل، وتنرجع بملف', 'save', async function load() {
  const body = $('#vbackup .body'), r = await api('backup/info'), fi = E('input', { type: 'file', accept: '.zip', style: 'display:none' });
  const only = E('input', { type: 'checkbox' }), note = E('div', { class: 'sub', style: 'margin-top:10px' });
  const restore = btn('استرجاع من ملف', 'save', async () => {
    fi.value = ''; fi.click(); await new Promise(ok => { fi.onchange = ok; });
    const f = fi.files[0]; if (!f) return;
    if (!confirm('تسترجع النسخة "' + f.name + '"؟\n' + (only.checked ? 'الإعدادات والبيانات فقط.' : 'الكود والبيانات كلها.') + '\nالبوت بيعيد التشغيل.')) return;
    const res = await fetch('/api/backup/restore?dataOnly=' + (only.checked ? 1 : 0), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: f });
    const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.error || 'فشل الاسترجاع');
    note.textContent = '✅ تم استرجاع ' + j.files + ' ملف. البوت يعيد التشغيل — حدّث الصفحة بعد دقيقة.';
  }, ghost);
  body.replaceChildren(E('div', { class: 'card' }, E('h3', { html: ic('save') + 'النسخ الاحتياطي' }),
    E('div', { class: 'hint' }, 'تنرسل نسخة تلقائياً للآيدي ' + r.to + ' (خاص أو روم) بعد أي تعديل في الإعدادات أو تحديث الكود. النسخة موقّعة: ما ينرجع إلا ملف طلع من نفس البوت.'),
    E('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin:12px 0' },
      btn('إرسال نسخة الآن', 'send', async () => { const x = await post('backup/send'); toast('انرسلت إلى ' + x.to); }),
      btn('تنزيل نسخة', 'save', async () => { location.href = '/api/backup/download'; }, ghost), restore),
    row('shield', 'استرجاع البيانات فقط', 'بدون ما يلمس الكود', toggle(false, v => only.checked = v)), note, fi));
});

// ── أغاني الملفات (داخل صفحة الأغاني): رفع، تشغيل، حذف
(() => {
  const list = E('div'), fi = E('input', { type: 'file', accept: '.mp3,.wav,.ogg,.m4a,.flac,.opus,.aac,audio/*', multiple: true, style: 'display:none' });
  const draw = async () => {
    try {
      const r = await api('songs');
      list.replaceChildren(...(r.songs.length ? r.songs.map(s => {
        const play = E('button', { class: 'ib', type: 'button', title: 'تشغيل', html: ic('music') }); play.onclick = () => dl(play, async () => { const x = await post('music/play', { voice: $('#m_vc').value, query: s.name }); toast('تمت الإضافة: ' + x.title); });
        const del = E('button', { class: 'ib', type: 'button', title: 'حذف', html: ic('trash') }); del.onclick = () => dl(del, async () => { if (!confirm('تحذف "' + s.name + '"؟')) return; await post('songs/delete', { name: s.name }); draw(); });
        return E('div', { class: 'row' }, E('div', { class: 'tile', html: ic('music') }), E('div', {}, s.name, E('small', {}, 'ملف محلي')), E('div', { style: 'display:flex;gap:6px' }, play, del));
      }) : [E('div', { class: 'sub' }, 'ما فيه أغاني بعد — ارفع ملفات mp3 أو حطها في مجلد songs')]));
    } catch {}
  };
  const upload = btn('رفع أغاني', 'plus', async () => {
    fi.value = ''; fi.click();
    await new Promise(ok => { fi.onchange = ok; });
    for (const f of fi.files) {
      if (f.size > 30 * 1024 * 1024) { toast(f.name + ': أكبر من 30MB', true); continue; }
      const res = await fetch('/api/songs/upload?name=' + encodeURIComponent(f.name), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: f });
      if (!res.ok) { toast(f.name + ': ' + ((await res.json().catch(() => ({}))).error || 'فشل الرفع'), true); continue; }
      toast('انرفعت: ' + f.name);
    }
    draw();
  });
  const card = E('div', { class: 'card', style: 'margin-top:16px' }, E('h3', { html: ic('music') + 'أغاني الملفات' }), E('div', { class: 'hint' }, 'الأغاني اللي ترفعها هنا تنحفظ في DATA_DIR/songs. التشغيل بالروم الصوتي المختار فوق. ولو تبي ملفات ثابتة حطها في مجلد songs على GitHub.'), upload, E('div', { style: 'margin-top:12px' }, list));
  $('#music').append(card, fi); draw();
})();

// ───────────────────────── ربط ─────────────────────────
const _show = show;
window.show = function (id) { _show(id); if (loaders[id]) loaders[id]().catch(e => toast(e.message, true)); };
const designHosts = {};
['welcome', 'feedback'].forEach(k => { const host = E('div'); $('#' + k).append(host); designHosts[k] = host; });
const prevShow = window.show;
window.show = function (id) { prevShow(id); if ((id === 'welcome' || id === 'feedback') && !designHosts[id].dataset.ok) { designHosts[id].dataset.ok = 1; designCard(id, designHosts[id]).catch(e => { designHosts[id].dataset.ok = ''; toast(e.message, true); }); } };

api('auth').then(a => {
  if (!a.protected) $('main').prepend(E('div', { class: 'warn' }, '⚠️ الداشبورد مو محمي بكلمة سر — أي أحد يعرف الرابط يتحكم بالبوت. ضيف DASH_PASSWORD في Environment على Render.'));
  else $('aside').append(E('a', { href: '/logout', style: 'margin-top:auto;padding:10px 14px;color:var(--mu);font-size:13px' }, 'تسجيل الخروج'));
}).catch(() => {});
const h0 = location.hash.slice(1); if (h0 && (loaders[h0] || h0 === 'welcome' || h0 === 'feedback')) window.show(h0);
})();
