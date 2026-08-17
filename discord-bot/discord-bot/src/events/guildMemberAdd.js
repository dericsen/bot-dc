const { AttachmentBuilder } = require('discord.js');
const { generateWelcomeCard } = require('../utils/canvas');
const { getNextMemberNumber } = require('../database');
const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const channel = config.welcomeChannelId
        ? member.guild.channels.cache.get(config.welcomeChannelId)
        : member.guild.systemChannel;

      if (!channel) {
        console.warn('⚠️ Welcome channel tidak ditemukan. Cek WELCOME_CHANNEL_ID di .env');
        return;
      }

      const memberNumber = getNextMemberNumber(member.guild.id);
      const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });

      const buffer = await generateWelcomeCard({
        avatarURL,
        username: member.user.username,
        memberNumber,
        guildName: member.guild.name,
      });

      const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

      await channel.send({
        content: `👋 Selamat datang <@${member.id}> di **${member.guild.name}**!`,
        files: [attachment],
      });
    } catch (err) {
      console.error('Gagal mengirim welcome card:', err);
    }
  },
};
