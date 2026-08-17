const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { generateRankCard } = require('../utils/canvas');
const { getProgress } = require('../utils/xp');
const { getRank } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Lihat level & XP kamu (atau member lain)')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang mau dicek').setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('user') || interaction.user;
    const { level, xp, xpNeeded } = getProgress(interaction.guild.id, target.id);
    const rank = getRank(interaction.guild.id, target.id) || '-';

    const buffer = await generateRankCard({
      avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
      username: target.username,
      level,
      xp,
      xpNeeded,
      rank,
    });

    const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
    await interaction.editReply({ files: [attachment] });
  },
};
