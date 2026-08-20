require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,

  clientId: process.env.CLIENT_ID,

  guildId: process.env.GUILD_ID,

  welcomeChannelId:
    process.env.WELCOME_CHANNEL_ID,

  adminRoleId:
    process.env.ADMIN_ROLE_ID || '',

  xp: {
    minPerMessage: 15,
    maxPerMessage: 25,
    cooldownSeconds: 60,

    xpForLevel: (level) =>
      5 * level * level +
      50 * level +
      100,
  },

  // Auto-role saat member mencapai level tertentu.
  // Isi role ID di .env, atau ganti langsung angkanya di sini.
  // Bot butuh permission "Manage Roles" dan role bot harus
  // diposisikan LEBIH TINGGI dari role-role ini di server settings.
  autoRoles: {
    5: process.env.AUTOROLE_LEVEL_5 || '',
    10: process.env.AUTOROLE_LEVEL_10 || '',
    20: process.env.AUTOROLE_LEVEL_20 || '',
  },

  // Webhook GitHub -> channel Discord
  github: {
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    channelId: process.env.GITHUB_CHANNEL_ID || '',
    port: process.env.GITHUB_WEBHOOK_PORT
      ? parseInt(process.env.GITHUB_WEBHOOK_PORT, 10)
      : 3000,
  },

  // /run - eksekusi kode via Piston API (sandbox pihak ketiga,
  // bot tidak menjalankan kode apa pun secara lokal)
  run: {
    cooldownSeconds: 10,
    maxCodeLength: 4000,
    runTimeoutMs: 5000,
    compileTimeoutMs: 10000,
  },

  welcome: {
    backgroundPath:
      'assets/background.jpg',

    title: 'WELCOME',
  },
};