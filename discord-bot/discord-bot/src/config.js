require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID,

  // ==== Pengaturan Leveling ====
  xp: {
    minPerMessage: 15,
    maxPerMessage: 25,
    cooldownSeconds: 60, // biar ga spam chat buat farming XP
    // Rumus level ala MEE6: butuh XP = 5*(level^2) + 50*level + 100
    xpForLevel: (level) => 5 * (level * level) + 50 * level + 100,
  },

  // ==== Pengaturan Welcome Card ====
  welcome: {
    backgroundPath: 'assets/background.jpg', // ganti dengan background custom kamu
    title: 'WELCOME',
  },
};
