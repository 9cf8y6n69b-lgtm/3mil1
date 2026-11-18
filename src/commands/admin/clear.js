const { ok, err } = require('../../utils/embed');
module.exports = {
  name:'clear', aliases:['purge'], modOnly:true,
  async execute(message, args) {
    const target = message.mentions.users.first();
    const amount = parseInt(target ? args[1] : args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100)
      return message.reply({embeds:[err('Provide a number between 1 and 100.')]});
    await message.delete().catch(()=>{});
    let msgs = await message.channel.messages.fetch({limit:100});
    if (target) msgs = msgs.filter(m=>m.author.id===target.id);
    const toDelete = [...msgs.values()].slice(0, amount);
    const deleted = await message.channel.bulkDelete(toDelete, true).catch(()=>new Map());
    const reply = await message.channel.send({embeds:[ok(`Deleted **${deleted.size}** messages.`)]});
    setTimeout(()=>reply.delete().catch(()=>{}), 4000);
  }
};
