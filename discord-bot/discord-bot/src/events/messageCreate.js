const { addXp } = require('../utils/xp');

module.exports = {
  name: 'messageCreate',
  execute(message) {
    if (message.author.bot || !message.guild) return;

    const result = addXp(message.guild.id, message.author.id);

    if (result.leveledUp) {
      message.channel
        .send(
          `🎉 Selamat, ${message.author}! Kamu naik ke **Level ${result.newLevel}**!`
        )
        .catch(() => {});
    }
  },
};
