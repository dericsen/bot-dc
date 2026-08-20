const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

// Helper: gambar teks dengan wrap otomatis biar ga kepotong
function drawCenteredText(ctx, text, x, y, maxWidth, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Kalau teks kepanjangan, kecilkan font sampai muat
  let fontSize = parseInt(font.match(/\d+/)[0], 10);
  while (ctx.measureText(text).width > maxWidth && fontSize > 10) {
    fontSize -= 2;
    ctx.font = font.replace(/\d+px/, `${fontSize}px`);
  }
  ctx.fillText(text, x, y);
}

// Helper: clip gambar jadi lingkaran (buat avatar)
function clipCircle(ctx, x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
}

/**
 * Generate Welcome Card
 * @param {object} opts
 * @param {string} opts.avatarURL - URL avatar user (format png, 256x256 disarankan)
 * @param {string} opts.username - nama user yang join
 * @param {number} opts.memberNumber - nomor urut member ke berapa
 * @param {string} opts.guildName - nama server
 */
async function generateWelcomeCard({ avatarURL, username, memberNumber, guildName }) {
  const width = 1000;
  const height = 450;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ---- Background ----
  const bgPath = path.join(__dirname, '..', '..', 'assets', 'background.jpg');
  if (fs.existsSync(bgPath)) {
    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, width, height);
  } else {
    // Fallback: gradient background kalau belum ada background.jpg
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1f1147');
    grad.addColorStop(1, '#3a1f7a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // ---- Overlay gelap biar teks kebaca ----
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, width, height);

  // ---- Border ----
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // ---- Avatar (lingkaran, tengah atas) ----
  const avatarSize = 160;
  const avatarX = width / 2;
  const avatarY = 150;

  ctx.save();
  clipCircle(ctx, avatarX, avatarY, avatarSize / 2 + 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(avatarX - avatarSize / 2 - 6, avatarY - avatarSize / 2 - 6, avatarSize + 12, avatarSize + 12);
  ctx.restore();

  try {
    const avatar = await loadImage(avatarURL);
    ctx.save();
    clipCircle(ctx, avatarX, avatarY, avatarSize / 2);
    ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
  } catch (e) {
    // kalau avatar gagal dimuat, biarin lingkaran putih kosong
  }

  // ---- Judul "WELCOME" ----
  drawCenteredText(ctx, 'WELCOME', width / 2, 280, width - 100, 'bold 60px sans-serif', '#ffffff');

  // ---- Nama user ----
  drawCenteredText(ctx, username, width / 2, 340, width - 150, 'bold 40px sans-serif', '#ffd166');

  // ---- Info nomor member ----
  drawCenteredText(
    ctx,
    `You are the ${memberNumber}${ordinalSuffix(memberNumber)} member of ${guildName}!`,
    width / 2,
    390,
    width - 150,
    '28px sans-serif',
    '#e0e0e0'
  );

  return canvas.toBuffer('image/png');
}

/**
 * Generate Rank Card (buat command /rank)
 */
async function generateRankCard({ avatarURL, username, level, xp, xpNeeded, rank }) {
  const width = 900;
  const height = 260;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#232526');
  grad.addColorStop(1, '#414345');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Avatar
  const avatarSize = 160;
  const avatarX = 130;
  const avatarY = height / 2;

  ctx.save();
  clipCircle(ctx, avatarX, avatarY, avatarSize / 2 + 5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(avatarX - avatarSize / 2 - 5, avatarY - avatarSize / 2 - 5, avatarSize + 10, avatarSize + 10);
  ctx.restore();

  try {
    const avatar = await loadImage(avatarURL);
    ctx.save();
    clipCircle(ctx, avatarX, avatarY, avatarSize / 2);
    ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
  } catch (e) {}

  // Username
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, 240, 100);

  // Rank & Level
  ctx.font = '26px sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`Rank #${rank}    Level ${level}`, 240, 140);

  // XP Progress bar
  const barX = 240;
  const barY = 170;
  const barWidth = 600;
  const barHeight = 30;
  const progress = Math.min(xp / xpNeeded, 1);

  ctx.fillStyle = '#ffffff22';
  roundRect(ctx, barX, barY, barWidth, barHeight, 15);
  ctx.fill();

  ctx.fillStyle = '#6a5acd';
  roundRect(ctx, barX, barY, barWidth * progress, barHeight, 15);
  ctx.fill();

  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(`${xp} / ${xpNeeded} XP`, barX + barWidth, barY - 10);

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, width, height, radius) {
  if (width < 0) width = 0;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function ordinalSuffix(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

module.exports = { generateWelcomeCard, generateRankCard };
