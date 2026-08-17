const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./src/config');

if (!config.token || !config.clientId) {
  console.error('❌ DISCORD_TOKEN atau CLIENT_ID belum diisi di file .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`🔄 Mendaftarkan ${commands.length} slash command...`);

    // Kalau GUILD_ID diisi -> command muncul instan di 1 server (bagus buat testing)
    // Kalau mau global (semua server, tapi butuh ~1 jam buat sync) -> hapus guildId
    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });

    console.log('✅ Slash command berhasil didaftarkan!');
  } catch (err) {
    console.error(err);
  }
})();
