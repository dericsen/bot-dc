const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'bot.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS levels (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    lastMessageAt INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guildId, userId)
  );

  CREATE TABLE IF NOT EXISTS guild_stats (
    guildId TEXT PRIMARY KEY,
    memberCount INTEGER NOT NULL DEFAULT 0
  );
`);

// ---------- Helper functions ----------

function getUser(guildId, userId) {
  let row = db
    .prepare('SELECT * FROM levels WHERE guildId = ? AND userId = ?')
    .get(guildId, userId);

  if (!row) {
    db.prepare(
      'INSERT INTO levels (guildId, userId, xp, level, lastMessageAt) VALUES (?, ?, 0, 0, 0)'
    ).run(guildId, userId);
    row = { guildId, userId, xp: 0, level: 0, lastMessageAt: 0 };
  }
  return row;
}

function updateUser(guildId, userId, xp, level, lastMessageAt) {
  db.prepare(
    'UPDATE levels SET xp = ?, level = ?, lastMessageAt = ? WHERE guildId = ? AND userId = ?'
  ).run(xp, level, lastMessageAt, guildId, userId);
}

function getLeaderboard(guildId, limit = 10) {
  return db
    .prepare(
      'SELECT userId, xp, level FROM levels WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT ?'
    )
    .all(guildId, limit);
}

function getRank(guildId, userId) {
  const rows = db
    .prepare(
      'SELECT userId FROM levels WHERE guildId = ? ORDER BY level DESC, xp DESC'
    )
    .all(guildId);
  const idx = rows.findIndex((r) => r.userId === userId);
  return idx === -1 ? null : idx + 1;
}

// Nomor urut member yang join (dipakai di welcome card)
function getNextMemberNumber(guildId) {
  let row = db.prepare('SELECT * FROM guild_stats WHERE guildId = ?').get(guildId);
  if (!row) {
    db.prepare('INSERT INTO guild_stats (guildId, memberCount) VALUES (?, 0)').run(guildId);
    row = { guildId, memberCount: 0 };
  }
  const next = row.memberCount + 1;
  db.prepare('UPDATE guild_stats SET memberCount = ? WHERE guildId = ?').run(next, guildId);
  return next;
}

module.exports = {
  db,
  getUser,
  updateUser,
  getLeaderboard,
  getRank,
  getNextMemberNumber,
};
