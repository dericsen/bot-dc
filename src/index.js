const fs = require('fs');
const path = require('path');

const {
  Client,
  Collection,
  GatewayIntentBits,
} = require('discord.js');

const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Load commands
const commandsPath =
  path.join(__dirname, 'commands');

const commandFiles =
  fs.readdirSync(commandsPath)
    .filter((file) =>
      file.endsWith('.js')
    );

for (const file of commandFiles) {
  const command =
    require(
      path.join(commandsPath, file)
    );

  client.commands.set(
    command.data.name,
    command
  );
}

// Load events
const eventsPath =
  path.join(__dirname, 'events');

const eventFiles =
  fs.readdirSync(eventsPath)
    .filter((file) =>
      file.endsWith('.js')
    );

for (const file of eventFiles) {
  const event =
    require(
      path.join(eventsPath, file)
    );

  if (event.once) {
    client.once(
      event.name,
      (...args) =>
        event.execute(
          ...args,
          client
        )
    );
  } else {
    client.on(
      event.name,
      (...args) =>
        event.execute(
          ...args,
          client
        )
    );
  }
}

client.login(config.token);