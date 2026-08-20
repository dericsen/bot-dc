const {
  AttachmentBuilder,
} = require('discord.js');

const {
  getNextMemberNumber,
} = require('../database');

const {
  createWelcomeCanvas,
} = require('../utils/welcomeCanvas');

const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    try {
      // =========================
      // MEMBER NUMBER
      // =========================

      const memberNumber =
        getNextMemberNumber(
          member.guild.id
        );

      // =========================
      // FIND WELCOME CHANNEL
      // =========================

      const channel =
        member.guild.channels.cache.get(
          config.welcomeChannelId
        );

      if (!channel) {
        console.error(
          `Welcome channel tidak ditemukan: ${config.welcomeChannelId}`
        );

        return;
      }

      // =========================
      // CREATE WELCOME IMAGE
      // =========================

      const image =
        await createWelcomeCanvas(
          member,
          memberNumber
        );

      const attachment =
        new AttachmentBuilder(
          image,
          {
            name: 'welcome.png',
          }
        );

      // =========================
      // SEND MESSAGE
      // =========================

      await channel.send({
        content:
          `Welcome ${member} to **${member.guild.name}**! ` +
          `You are **${memberNumber}th member here!**`,

        files: [attachment],
      });

      console.log(
        ` ${member.user.tag} joined ${member.guild.name}`
      );

    } catch (error) {
      console.error(
        ' Welcome error:',
        error
      );
    }
  },
};