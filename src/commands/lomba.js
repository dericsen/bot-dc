const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config = require('../config');

const {
  createCompetition,
  getCompetitions,
  deleteCompetition,
  setCompetitionMessage,
} = require('../database');

function isAdmin(member) {
  return (
    member.permissions.has(
      PermissionFlagsBits.Administrator
    ) ||
    (
      config.adminRoleId &&
      member.roles.cache.has(config.adminRoleId)
    )
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lomba')
    .setDescription('Kelola informasi lomba')

    .addSubcommand((subcommand) =>
      subcommand
        .setName('tambah')
        .setDescription('Tambahkan info lomba')

        .addStringOption((option) =>
          option
            .setName('nama')
            .setDescription('Nama lomba')
            .setRequired(true)
        )

        .addStringOption((option) =>
          option
            .setName('deskripsi')
            .setDescription('Deskripsi lomba')
            .setRequired(true)
        )

        .addStringOption((option) =>
          option
            .setName('deadline')
            .setDescription(
              'Contoh: 20 September 2026'
            )
            .setRequired(false)
        )

        .addStringOption((option) =>
          option
            .setName('info')
            .setDescription(
              'Link Instagram atau info lomba'
            )
            .setRequired(false)
        )

        .addStringOption((option) =>
          option
            .setName('daftar')
            .setDescription(
              'Link pendaftaran resmi'
            )
            .setRequired(false)
        )

        .addStringOption((option) =>
          option
            .setName('gambar')
            .setDescription(
              'Link poster/gambar lomba'
            )
            .setRequired(false)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription(
          'Lihat semua lomba'
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('hapus')
        .setDescription(
          'Hapus lomba berdasarkan ID'
        )

        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('ID lomba')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand =
      interaction.options.getSubcommand();

    // ================= TAMBAH =================

    if (subcommand === 'tambah') {
      if (!isAdmin(interaction.member)) {
        return interaction.reply({
          content:
            ' Kamu tidak memiliki izin untuk menambahkan lomba.',
          ephemeral: true,
        });
      }

      const name =
        interaction.options.getString('nama');

      const description =
        interaction.options.getString('deskripsi');

      const deadline =
        interaction.options.getString('deadline') || '';

      const infoLink =
        interaction.options.getString('info') || '';

      const registrationLink =
        interaction.options.getString('daftar') || '';

      const imageUrl =
        interaction.options.getString('gambar') || '';

      const competitionId = createCompetition({
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        name,
        description,
        deadline,
        infoLink,
        registrationLink,
        imageUrl,
        createdBy: interaction.user.id,
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`${name}`)
        .setDescription(description)
        .setTimestamp();

      if (deadline) {
        embed.addFields({
          name: 'Deadline',
          value: deadline,
          inline: true,
        });
      }

      embed.addFields({
        name: ' Status',
        value: 'Belum ada yang mengikuti',
        inline: true,
      });

      embed.setFooter({
        text: 'Klik tombol Ikuti jika kamu tertarik dengan lomba ini',
      });

      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      const row1 =
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(
              `competition_follow_${competitionId}`
            )
            .setLabel('Ikuti')
            .setEmoji('')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId(
              `competition_unfollow_${competitionId}`
            )
            .setLabel('Batal')
            .setEmoji('')
            .setStyle(ButtonStyle.Secondary),

          new ButtonBuilder()
            .setCustomId(
              `competition_participants_${competitionId}`
            )
            .setLabel('Lihat Peserta')
            .setEmoji('')
            .setStyle(ButtonStyle.Primary)
        );

      const components = [row1];

      const links = [];

      if (infoLink) {
        links.push(
          new ButtonBuilder()
            .setLabel('Info Lomba')
            .setEmoji('')
            .setStyle(ButtonStyle.Link)
            .setURL(infoLink)
        );
      }

      if (registrationLink) {
        links.push(
          new ButtonBuilder()
            .setLabel('Daftar Resmi')
            .setEmoji('')
            .setStyle(ButtonStyle.Link)
            .setURL(registrationLink)
        );
      }

      if (links.length > 0) {
        components.push(
          new ActionRowBuilder().addComponents(
            ...links
          )
        );
      }

      const message =
        await interaction.reply({
          embeds: [embed],
          components,
          fetchReply: true,
        });

      setCompetitionMessage(
        competitionId,
        message.id
      );
    }

    // ================= LIST =================

    if (subcommand === 'list') {
      const competitions =
        getCompetitions(interaction.guild.id);

      if (competitions.length === 0) {
        return interaction.reply({
          content: ' Belum ada lomba.',
          ephemeral: true,
        });
      }

      const list = competitions
        .map(
          (competition) =>
            `**#${competition.id} — ${competition.name}**\n` +
            ` ${competition.deadline || 'Deadline tidak tersedia'}`
        )
        .join('\n\n');

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🏆 Daftar Lomba')
            .setDescription(list),
        ],
        ephemeral: true,
      });
    }

    // ================= HAPUS =================

    if (subcommand === 'hapus') {
      if (!isAdmin(interaction.member)) {
        return interaction.reply({
          content:
            'Kamu tidak memiliki izin untuk menghapus lomba.',
          ephemeral: true,
        });
      }

      const id =
        interaction.options.getInteger('id');

      const result =
        deleteCompetition(id);

      if (result.changes === 0) {
        return interaction.reply({
          content:
            'Lomba dengan ID tersebut tidak ditemukan.',
          ephemeral: true,
        });
      }

      return interaction.reply({
        content:
          `Lomba dengan ID **#${id}** berhasil dihapus.`,
        ephemeral: true,
      });
    }
  },
};