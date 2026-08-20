const { addXp } = require('../utils/xp');
const config = require('../config');

// Tambahkan semua role auto-role yang levelnya <= newLevel
// dan belum dimiliki member (jaga-jaga kalau XP naik banyak
// sekaligus dan lompat beberapa level tier).
async function applyAutoRoles(message, newLevel) {
  const member = message.member;
  if (!member) return;

  for (const [levelStr, roleId] of Object.entries(config.autoRoles)) {
    const level = Number(levelStr);

    if (!roleId) continue;
    if (newLevel < level) continue;
    if (member.roles.cache.has(roleId)) continue;

    try {
      await member.roles.add(roleId);

      message.channel
        .send(
          `🎖️ ${message.author} juga dapat role baru karena mencapai Level ${level}!`
        )
        .catch(() => {});
    } catch (error) {
      console.error(
        `Gagal menambahkan auto-role untuk level ${level}:`,
        error.message
      );
    }
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const result = addXp(message.guild.id, message.author.id);

    if (result.leveledUp) {
      message.channel
        .send(
          ` Selamat, ${message.author}! Kamu naik ke **Level ${result.newLevel}**!`
        )
        .catch(() => {});

      await applyAutoRoles(message, result.newLevel);
    }
  },
};
