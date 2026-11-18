const ms = require('ms');

module.exports = {
  parseTime: s => { try { return ms(s); } catch { return null; } },
  formatTime: v => {
    if (!v || v <= 0) return '0s';
    const s=Math.floor(v/1000),m=Math.floor(s/60),h=Math.floor(m/60),d=Math.floor(h/24);
    if (d>0) return `${d}d ${h%24}h`;
    if (h>0) return `${h}h ${m%60}m`;
    if (m>0) return `${m}m ${s%60}s`;
    return `${s}s`;
  },
  isAdmin: m => m.permissions.has('Administrator'),
  isMod:   (m, rid) => m.permissions.has('Administrator') || (rid && m.roles.cache.has(rid)),
  rng:     (a,b) => Math.floor(Math.random()*(b-a+1))+a,
  plural:  (n,w) => `${n} ${w}${n!==1?'s':''}`,
};
