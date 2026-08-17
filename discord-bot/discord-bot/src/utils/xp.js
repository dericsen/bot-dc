const { getUser, updateUser } = require('../database');
const config = require('../config');

/**
 * Tambah XP ke user, cek apakah naik level.
 * Return { leveledUp, newLevel, xp, xpNeeded }
 */
function addXp(guildId, userId) {
  const user = getUser(guildId, userId);
  const now = Date.now();
  const cooldownMs = config.xp.cooldownSeconds * 1000;

  // Anti-spam: cek cooldown
  if (now - user.lastMessageAt < cooldownMs) {
    return { leveledUp: false, onCooldown: true };
  }

  const gained =
    Math.floor(Math.random() * (config.xp.maxPerMessage - config.xp.minPerMessage + 1)) +
    config.xp.minPerMessage;

  let newXp = user.xp + gained;
  let newLevel = user.level;
  let leveledUp = false;

  let xpNeeded = config.xp.xpForLevel(newLevel);
  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel += 1;
    leveledUp = true;
    xpNeeded = config.xp.xpForLevel(newLevel);
  }

  updateUser(guildId, userId, newXp, newLevel, now);

  return {
    leveledUp,
    onCooldown: false,
    newLevel,
    xp: newXp,
    xpNeeded,
  };
}

function getProgress(guildId, userId) {
  const user = getUser(guildId, userId);
  const xpNeeded = config.xp.xpForLevel(user.level);
  return { level: user.level, xp: user.xp, xpNeeded };
}

module.exports = { addXp, getProgress };
