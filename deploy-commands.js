const fs = require('fs');
const path = require('path');

const {
  REST,
  Routes,
} = require('discord.js');

require('dotenv').config();

const commands = [];

const commandsPath =
  path.join(__dirname, 'src', 'commands');

const commandFiles =
  fs.readdirSync(commandsPath)
    .filter((file) =>
      file.endsWith('.js')
    );

for (const file of commandFiles) {
  const filePath =
    path.join(commandsPath, file);

  const command =
    require(filePath);

  if (
    command.data &&
    command.execute
  ) {
    commands.push(
      command.data.toJSON()
    );
  }
}

const rest = new REST({
  version: '10',
}).setToken(
  process.env.DISCORD_TOKEN
);

(async () => {
  try {
    console.log(
      `⏳ Deploying ${commands.length} commands...`
    );

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands,
      }
    );

    console.log(
      '✅ Slash commands berhasil di-deploy!'
    );
  } catch (error) {
    console.error(
      '❌ Gagal deploy commands:',
      error
    );
  }
})();