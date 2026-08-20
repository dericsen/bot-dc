const {
  createCanvas,
  loadImage,
} = require('@napi-rs/canvas');

const path = require('path');

async function createWelcomeCanvas(member, memberNumber) {
  const width = 1200;
  const height = 500;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // =========================
  // BACKGROUND
  // =========================

  const backgroundPath = path.join(
    __dirname,
    '..',
    'assets',
    'welcome-bg.png'
  );

  try {
    const background = await loadImage(
      backgroundPath
    );

    ctx.drawImage(
      background,
      0,
      0,
      width,
      height
    );
  } catch (error) {
    console.error(
      'Gagal membaca background:',
      error
    );

    // fallback background
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        width,
        height
      );

    gradient.addColorStop(
      0,
      '#17124d'
    );

    gradient.addColorStop(
      1,
      '#315cff'
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }

  // =========================
  // DARK OVERLAY
  // =========================

  ctx.fillStyle =
    'rgba(0, 0, 0, 0.20)';

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  // =========================
  // AVATAR
  // =========================

  const avatarSize = 180;
  const avatarX =
    width / 2 - avatarSize / 2;
  const avatarY = 55;

  const avatarURL =
    member.user.displayAvatarURL({
      extension: 'png',
      size: 256,
    });

  const avatar =
    await loadImage(avatarURL);

  // Circle clipping
  ctx.save();

  ctx.beginPath();

  ctx.arc(
    width / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2
  );

  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    avatar,
    avatarX,
    avatarY,
    avatarSize,
    avatarSize
  );

  ctx.restore();

  // Avatar border
  ctx.beginPath();

  ctx.arc(
    width / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2 + 7,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    'rgba(255,255,255,0.9)';

  ctx.lineWidth = 8;

  ctx.stroke();

  // =========================
  // WELCOME
  // =========================

  ctx.textAlign = 'center';

  ctx.font =
    'bold 58px Arial';

  ctx.fillStyle = '#ffffff';

  ctx.fillText(
    'WELCOME',
    width / 2,
    315
  );

  // =========================
  // USERNAME
  // =========================

  let username =
    member.user.username;

  if (username.length > 22) {
    username =
      username.substring(0, 22) +
      '...';
  }

  ctx.font =
    'bold 34px Arial';

  ctx.fillStyle = '#ffffff';

  ctx.fillText(
    username,
    width / 2,
    360
  );

  // =========================
  // MEMBER NUMBER
  // =========================

  ctx.font =
    'bold 24px Arial';

  ctx.fillStyle =
    'rgba(255,255,255,0.9)';

  ctx.fillText(
    `YOU ARE OUR ${memberNumber}TH MEMBER!`,
    width / 2,
    405
  );

  // =========================
  // RETURN IMAGE
  // =========================

  return canvas.toBuffer(
    'image/png'
  );
}

module.exports = {
  createWelcomeCanvas,
};