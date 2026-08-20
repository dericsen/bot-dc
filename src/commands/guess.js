const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Main tebak angka 1-100! Kamu punya 7 kesempatan.'),

  async execute(interaction) {
    const target = Math.floor(Math.random() * 100) + 1;
    const maxTries = 7;
    let tries = 0;

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔢 Tebak Angka!')
          .setDescription(
            `Aku sudah memilih angka antara **1 - 100**.\nKetik angka tebakanmu langsung di chat ini. Kamu punya **${maxTries}x** kesempatan!`
          )
          .setColor(0x00b4d8),
      ],
    });

    const collector = interaction.channel.createMessageCollector({
      filter: (m) => m.author.id === interaction.user.id && /^\d+$/.test(m.content.trim()),
      time: 60000,
      max: maxTries,
    });

    collector.on('collect', async (m) => {
      tries++;
      const guess = parseInt(m.content.trim(), 10);

      if (guess === target) {
        await m.reply(`🎉 **Tepat!** Angkanya memang **${target}**. Kamu berhasil dalam ${tries} kali coba!`);
        collector.stop('won');
        return;
      }

      const hint = guess < target ? 'Lebih besar lagi!' : 'Lebih kecil lagi!';
      const sisa = maxTries - tries;

      if (sisa === 0) {
        await m.reply(`Kesempatan habis! Angka yang benar adalah **${target}**. Coba lagi dengan \`/guess\`!`);
      } else {
        await m.reply(`${hint} (sisa ${sisa}x kesempatan)`);
      }
    });

    collector.on('end', (_collected, reason) => {
      if (reason === 'time') {
        interaction.followUp(`Waktu habis! Angka yang benar adalah **${target}**.`).catch(() => {});
      }
    });
  },
};
