const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../database');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat 10 member teratas berdasarkan level & XP'),

  async execute(interaction) {
    await interaction.deferReply();

    const top = getLeaderboard(interaction.guild.id, 10);

    if (top.length === 0) {
      await interaction.editReply('Belum ada data XP di server ini. Ayo mulai ngobrol! 💬');
      return;
    }

    const lines = await Promise.all(
      top.map(async (row, i) => {
        let name;
        try {
          const member = await interaction.guild.members.fetch(row.userId);
          name = member.user.username;
        } catch {
          name = `Unknown User (${row.userId})`;
        }
        const prefix = MEDALS[i] || `#${i + 1}`;
        return `${prefix} **${name}** — Level ${row.level} (${row.xp} XP)`;
      })
    );

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Leaderboard — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'))
      .setColor(0xffd166);

    await interaction.editReply({ embeds: [embed] });
  },
};
