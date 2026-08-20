const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'database');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dbDir, 'bot.sqlite'));

db.exec('PRAGMA journal_mode = WAL;');

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

  CREATE TABLE IF NOT EXISTS competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    messageId TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    infoLink TEXT DEFAULT '',
    registrationLink TEXT DEFAULT '',
    imageUrl TEXT DEFAULT '',
    createdBy TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS competition_followers (
    competitionId INTEGER NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (competitionId, userId)
  );
`);

// ================= LEVEL SYSTEM =================

function getUser(guildId, userId) {
  let row = db
    .prepare(
      'SELECT * FROM levels WHERE guildId = ? AND userId = ?'
    )
    .get(guildId, userId);

  if (!row) {
    db.prepare(`
      INSERT INTO levels (
        guildId,
        userId,
        xp,
        level,
        lastMessageAt
      )
      VALUES (?, ?, 0, 0, 0)
    `).run(guildId, userId);

    row = {
      guildId,
      userId,
      xp: 0,
      level: 0,
      lastMessageAt: 0,
    };
  }

  return row;
}

function updateUser(
  guildId,
  userId,
  xp,
  level,
  lastMessageAt
) {
  db.prepare(`
    UPDATE levels
    SET xp = ?,
        level = ?,
        lastMessageAt = ?
    WHERE guildId = ?
      AND userId = ?
  `).run(
    xp,
    level,
    lastMessageAt,
    guildId,
    userId
  );
}

function getLeaderboard(guildId, limit = 10) {
  return db
    .prepare(`
      SELECT userId, xp, level
      FROM levels
      WHERE guildId = ?
      ORDER BY level DESC, xp DESC
      LIMIT ?
    `)
    .all(guildId, limit);
}

function getRank(guildId, userId) {
  const rows = db
    .prepare(`
      SELECT userId
      FROM levels
      WHERE guildId = ?
      ORDER BY level DESC, xp DESC
    `)
    .all(guildId);

  const index = rows.findIndex(
    (row) => row.userId === userId
  );

  return index === -1 ? null : index + 1;
}

function getNextMemberNumber(guildId) {
  let row = db
    .prepare(
      'SELECT * FROM guild_stats WHERE guildId = ?'
    )
    .get(guildId);

  if (!row) {
    db.prepare(`
      INSERT INTO guild_stats (guildId, memberCount)
      VALUES (?, 0)
    `).run(guildId);

    row = {
      guildId,
      memberCount: 0,
    };
  }

  const next = row.memberCount + 1;

  db.prepare(`
    UPDATE guild_stats
    SET memberCount = ?
    WHERE guildId = ?
  `).run(next, guildId);

  return next;
}

// ================= COMPETITION SYSTEM =================

function createCompetition(data) {
  const result = db.prepare(`
    INSERT INTO competitions (
      guildId,
      channelId,
      name,
      description,
      deadline,
      infoLink,
      registrationLink,
      imageUrl,
      createdBy,
      createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.guildId,
    data.channelId,
    data.name,
    data.description || '',
    data.deadline || '',
    data.infoLink || '',
    data.registrationLink || '',
    data.imageUrl || '',
    data.createdBy,
    Date.now()
  );

  return Number(result.lastInsertRowid);
}

function getCompetition(id) {
  return db
    .prepare(
      'SELECT * FROM competitions WHERE id = ?'
    )
    .get(id);
}

function getCompetitions(guildId) {
  return db
    .prepare(`
      SELECT *
      FROM competitions
      WHERE guildId = ?
      ORDER BY createdAt DESC
    `)
    .all(guildId);
}

function setCompetitionMessage(id, messageId) {
  db.prepare(`
    UPDATE competitions
    SET messageId = ?
    WHERE id = ?
  `).run(messageId, id);
}

function deleteCompetition(id) {
  db.prepare(`
    DELETE FROM competition_followers
    WHERE competitionId = ?
  `).run(id);

  return db
    .prepare(`
      DELETE FROM competitions
      WHERE id = ?
    `)
    .run(id);
}

// ================= FOLLOW SYSTEM =================

function followCompetition(competitionId, userId) {
  const exists = db
    .prepare(`
      SELECT *
      FROM competition_followers
      WHERE competitionId = ?
        AND userId = ?
    `)
    .get(competitionId, userId);

  if (exists) {
    return false;
  }

  db.prepare(`
    INSERT INTO competition_followers (
      competitionId,
      userId
    )
    VALUES (?, ?)
  `).run(competitionId, userId);

  return true;
}

function unfollowCompetition(
  competitionId,
  userId
) {
  const result = db.prepare(`
    DELETE FROM competition_followers
    WHERE competitionId = ?
      AND userId = ?
  `).run(competitionId, userId);

  return result.changes > 0;
}

function getCompetitionFollowers(competitionId) {
  return db
    .prepare(`
      SELECT userId
      FROM competition_followers
      WHERE competitionId = ?
      ORDER BY rowid ASC
    `)
    .all(competitionId);
}

function getFollowerCount(competitionId) {
  const result = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM competition_followers
      WHERE competitionId = ?
    `)
    .get(competitionId);

  return result.count;
}

module.exports = {
  db,

  getUser,
  updateUser,
  getLeaderboard,
  getRank,
  getNextMemberNumber,

  createCompetition,
  getCompetition,
  getCompetitions,
  setCompetitionMessage,
  deleteCompetition,

  followCompetition,
  unfollowCompetition,
  getCompetitionFollowers,
  getFollowerCount,
};