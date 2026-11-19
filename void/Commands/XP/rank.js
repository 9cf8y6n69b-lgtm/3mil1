// rank / رانك — مستواك وخبرتك (أو عضو تمنشنه)
const { MessageEmbed } = require("../../compat");
const XP = require("../../utils/xp");
module.exports = {
    name: "rank",
    aliases: ["رانك", "لفل", "مستواي", "level"],
    description: "عرض المستوى والخبرة",
    run: async (client, message) => {
        if (!message.guild) return;
        const target = message.mentions.members.first() || message.member;
        const u = XP.getUser(message.guild.id, target.id);
        const pct = Math.min(10, Math.round((u.into / u.next) * 10));
        const embed = new MessageEmbed().setColor("#2b2d31")
            .setAuthor({ name: target.displayName, iconURL: target.displayAvatarURL() })
            .setDescription(`**المستوى:** ${u.level}\n\`${"█".repeat(pct)}${"░".repeat(10 - pct)}\` ${u.into}/${u.next} XP\n**إجمالي الخبرة:** ${u.xp}\n**الرسائل:** ${u.messages} • **الفويس:** ${Math.floor(u.voiceSeconds / 60)} دقيقة`);
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
};
