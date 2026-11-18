module.exports = {
  botName:   'DealerBot',
  prefix:    process.env.PREFIX || '#',
  ownerID:   process.env.OWNER_ID,
  colors: {
    main:    '#7C3AED',
    success: '#22C55E',
    error:   '#EF4444',
    warning: '#F59E0B',
    info:    '#3B82F6',
    plus:    '#A855F7',
  },
  footer:    'DealerBot • Dev: Youssef',
  maxWarnings: 3,
  dashboard: {
    port:   process.env.DASHBOARD_PORT || 3000,
    url:    process.env.DASHBOARD_URL  || 'http://localhost:3000',
  },
};
