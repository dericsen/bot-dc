const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Bank soal — tambahin sendiri sesuka hati
const QUESTIONS = [
  {
    q: 'Bahasa pemrograman apa yang dipakai untuk membuat bot Discord.js?',
    options: ['Python', 'JavaScript', 'Rust', 'PHP'],
    answer: 1,
  },
  {
    q: 'Apa kepanjangan dari HTML?',
    options: ['HyperText Markup Language', 'HighText Machine Language', 'Hyperlink Text Markup Language', 'Home Tool Markup Language'],
    answer: 0,
  },
  {
    q: 'Struktur data apa yang bekerja dengan prinsip LIFO (Last In First Out)?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    answer: 1,
  },
  {
    q: 'Apa nama library canvas yang dipakai bot ini untuk generate welcome image?',
    options: ['fabric.js', 'p5.js', '@napi-rs/canvas', 'three.js'],
    answer: 2,
  },
  {
    q: 'Kompleksitas waktu Big-O untuk binary search adalah?',
    options: ['O(n)', 'O(n^2)', 'O(log n)', 'O(1)'],
    answer: 2,
  },
];

const LETTERS = ['A', 'B', 'C', 'D'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Main kuis singkat seputar coding & general knowledge'),

  async execute(interaction) {
    const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

    const row = new ActionRowBuilder().addComponents(
      question.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${i}_${question.answer}`)
          .setLabel(`${LETTERS[i]}. ${opt}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const embed = new EmbedBuilder()
      .setTitle(' Trivia Time!')
      .setDescription(question.q)
      .setColor(0x6a5acd)
      .setFooter({ text: 'Kamu punya 15 detik untuk jawab!' });

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 15000 });
    let answered = false;

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        await btnInteraction.reply({ content: 'Ini bukan trivia kamu! Ketik `/trivia` buat main sendiri.', ephemeral: true });
        return;
      }

      answered = true;
      const [, chosenIdx, correctIdx] = btnInteraction.customId.split('_');
      const isCorrect = chosenIdx === correctIdx;

      await btnInteraction.update({
        embeds: [
          embed.setDescription(
            `${question.q}\n\n${
              isCorrect
                ? ' **Benar!** Kerennn 🎉'
                : ` **Salah!** Jawaban yang benar: ${LETTERS[correctIdx]}. ${question.options[correctIdx]}`
            }`
          ),
        ],
        components: [],
      });
      collector.stop();
    });

    collector.on('end', async () => {
      if (!answered) {
        await interaction.editReply({
          embeds: [embed.setDescription(`${question.q}\n\n Waktu habis!`)],
          components: [],
        }).catch(() => {});
      }
    });
  },
};
