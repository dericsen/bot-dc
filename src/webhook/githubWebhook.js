const http = require('http');
const crypto = require('crypto');
const config = require('../config');

const WEBHOOK_PATH = '/github/webhook';
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB, cukup untuk payload GitHub

// Verifikasi signature HMAC SHA-256 dari GitHub (X-Hub-Signature-256)
// supaya endpoint tidak bisa dipicu sembarang orang yang tahu URL-nya.
function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function truncate(text, max = 200) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// Ubah payload event GitHub jadi teks pesan Discord.
// Return null kalau event-nya tidak perlu diumumkan.
function formatEvent(eventName, payload) {
  const repo = payload.repository ? payload.repository.full_name : 'repo';

  switch (eventName) {
    case 'push': {
      if (payload.deleted) {
        return `🗑️ **${payload.pusher?.name || 'Seseorang'}** menghapus branch \`${(payload.ref || '').replace('refs/heads/', '')}\` di **${repo}**`;
      }

      const branch = (payload.ref || '').replace('refs/heads/', '');
      const commits = payload.commits || [];

      if (commits.length === 0) return null;

      const lines = commits
        .slice(0, 5)
        .map(
          (c) =>
            `\`${c.id.slice(0, 7)}\` ${truncate(c.message.split('\n')[0], 100)} — *${c.author?.name || 'unknown'}*`
        )
        .join('\n');

      const more =
        commits.length > 5 ? `\n…dan ${commits.length - 5} commit lainnya` : '';

      return (
        `📦 **${payload.pusher?.name || 'Seseorang'}** push ${commits.length} commit ke \`${branch}\` di **${repo}**\n` +
        `${lines}${more}\n` +
        `🔗 ${payload.compare || ''}`
      );
    }

    case 'pull_request': {
      const action = payload.action;
      const pr = payload.pull_request;
      if (!pr) return null;

      if (!['opened', 'closed', 'reopened', 'ready_for_review'].includes(action)) {
        return null;
      }

      const mergedText = action === 'closed' && pr.merged ? 'di-merge' : action;

      return (
        `🔀 **${payload.sender?.login || 'Seseorang'}** ${mergedText} pull request **#${pr.number}** di **${repo}**\n` +
        `**${truncate(pr.title, 150)}**\n` +
        `🔗 ${pr.html_url}`
      );
    }

    case 'issues': {
      const action = payload.action;
      const issue = payload.issue;
      if (!issue) return null;

      if (!['opened', 'closed', 'reopened'].includes(action)) return null;

      return (
        `📝 **${payload.sender?.login || 'Seseorang'}** ${action} issue **#${issue.number}** di **${repo}**\n` +
        `**${truncate(issue.title, 150)}**\n` +
        `🔗 ${issue.html_url}`
      );
    }

    case 'create': {
      if (payload.ref_type !== 'branch' && payload.ref_type !== 'tag') return null;
      return `🌱 **${payload.sender?.login || 'Seseorang'}** membuat ${payload.ref_type} \`${payload.ref}\` di **${repo}**`;
    }

    case 'release': {
      if (payload.action !== 'published') return null;
      const release = payload.release;
      return (
        `🚀 Release baru **${release.name || release.tag_name}** di **${repo}**\n` +
        `🔗 ${release.html_url}`
      );
    }

    default:
      return null;
  }
}

function startGithubWebhookServer(client) {
  const { webhookSecret, channelId, port } = config.github;

  if (!webhookSecret || !channelId) {
    console.log(
      '[GitHub Webhook] Dilewati — isi GITHUB_WEBHOOK_SECRET dan GITHUB_CHANNEL_ID di .env untuk mengaktifkan.'
    );
    return null;
  }

  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== WEBHOOK_PATH) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const chunks = [];
    let size = 0;
    let aborted = false;

    req.on('data', (chunk) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        aborted = true;
        res.writeHead(413);
        res.end('Payload too large');
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', async () => {
      if (aborted) return;

      const rawBody = Buffer.concat(chunks);
      const signature = req.headers['x-hub-signature-256'];

      if (!verifySignature(rawBody, signature, webhookSecret)) {
        res.writeHead(401);
        res.end('Invalid signature');
        return;
      }

      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
        return;
      }

      // Balas GitHub duluan supaya tidak timeout, baru proses & kirim ke Discord.
      res.writeHead(200);
      res.end('OK');

      const eventName = req.headers['x-github-event'];

      let message;
      try {
        message = formatEvent(eventName, payload);
      } catch (error) {
        console.error('[GitHub Webhook] Gagal memformat event:', error.message);
        return;
      }

      if (!message) return;

      try {
        const channel = await client.channels.fetch(channelId);
        if (channel) await channel.send(message.slice(0, 2000));
      } catch (error) {
        console.error('[GitHub Webhook] Gagal mengirim pesan ke Discord:', error.message);
      }
    });

    req.on('error', () => {});
  });

  server.listen(port, () => {
    console.log(
      `[GitHub Webhook] Siap menerima di http://localhost:${port}${WEBHOOK_PATH}`
    );
  });

  return server;
}

module.exports = { startGithubWebhookServer };
