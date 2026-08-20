const { EmbedBuilder } = require('discord.js');

const {
  getCompetition,
  followCompetition,
  unfollowCompetition,
  getCompetitionFollowers,
  getFollowerCount,
} = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    try {
      // ================= SLASH COMMAND =================

      if (interaction.isChatInputCommand()) {
        const command =
          interaction.client.commands.get(
            interaction.commandName
          );

        if (!command) return;

        await command.execute(interaction);
        return;
      }

      // ================= BUTTON =================

      if (!interaction.isButton()) return;

      const parts =
        interaction.customId.split('_');

      if (parts[0] !== 'competition') {
        return;
      }

      const action = parts[1];

      const competitionId =
        Number(parts[2]);

      const competition =
        getCompetition(competitionId);

      if (!competition) {
        return interaction.reply({
          content:
            ' Lomba ini sudah tidak tersedia.',
          ephemeral: true,
        });
      }

      // ================= IKUTI =================

      if (action === 'follow') {
        const success =
          followCompetition(
            competitionId,
            interaction.user.id
          );

        if (!success) {
          return interaction.reply({
            content:
              `⚠️ Kamu sudah mengikuti **${competition.name}**.`,
            ephemeral: true,
          });
        }

        const count =
          getFollowerCount(competitionId);

        return interaction.reply({
          content:
            `✨ Kamu sekarang mengikuti **${competition.name}**!\n` +
            `👥 Total yang mengikuti: **${count} orang**.`,
          ephemeral: true,
        });
      }

      // ================= BATAL =================

      if (action === 'unfollow') {
        const success =
          unfollowCompetition(
            competitionId,
            interaction.user.id
          );

        if (!success) {
          return interaction.reply({
            content:
              '⚠️ Kamu belum mengikuti lomba ini.',
            ephemeral: true,
          });
        }

        return interaction.reply({
          content:
            ` Kamu batal mengikuti **${competition.name}**.`,
          ephemeral: true,
        });
      }

      // ================= LIHAT PESERTA =================

      if (action === 'participants') {
        const followers =
          getCompetitionFollowers(
            competitionId
          );

        if (followers.length === 0) {
          return interaction.reply({
            content:
              `👥 Belum ada yang mengikuti **${competition.name}**.`,
            ephemeral: true,
          });
        }

        const list = followers
          .map(
            (follower, index) =>
              `${index + 1}. <@${follower.userId}>`
          )
          .join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(
            ` Mengikuti ${competition.name}`
          )
          .setDescription(list)
          .setFooter({
            text:
              `Total: ${followers.length} orang`,
          });

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(
        'Interaction Error:',
        error
      );

      const errorMessage = {
        content:
          ' Terjadi kesalahan saat menjalankan perintah.',
        ephemeral: true,
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction
          .followUp(errorMessage)
          .catch(() => {});
      } else {
        await interaction
          .reply(errorMessage)
          .catch(() => {});
      }
    }
  },
};