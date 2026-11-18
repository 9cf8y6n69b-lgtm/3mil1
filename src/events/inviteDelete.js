const { removeInvite } = require('../utils/invites');
module.exports = { name: 'inviteDelete', execute(invite) { removeInvite(invite); } };
