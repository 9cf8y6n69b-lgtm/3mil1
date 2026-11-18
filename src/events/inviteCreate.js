const { addInvite } = require('../utils/invites');
module.exports = { name: 'inviteCreate', execute(invite) { addInvite(invite); } };
