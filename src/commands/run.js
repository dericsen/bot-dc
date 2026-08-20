const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

const PISTON_API = 'https://emkc.org/api/v2/piston';

const LANGUAGE_CHOICES = [
  { name: 'Python', value: 'python' },
  { name: 'JavaScript (Node.js)', value: 'javascript' },
  { name: 'C', value: 'c' },
  { name: 'C++', value: 'cpp' },
  { name: 'Java', value: 'java' },
];

const FILENAMES = {
  python: 'main.py',
  javascript: 'main.js',
  c: 'main.c',
  cpp: 'main.cpp',
  java: 'Main.java',
};

// Piston pakai nama "c++" bukan "cpp" untuk field language
const PISTON_LANGUAGE_ALIAS = {
  cpp: 'c++',
};

const MAX_OUTPUT_LENGTH = 1500;

// Cache daftar runtime supaya tidak fetch /runtimes tiap kali command dipanggil
let runtimeCache = null;
let runtimeCacheAt = 0;
const RUNTIME_CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam

// Cooldown per user supaya tidak spam API publik
const lastRunAt = new Map();

async function getRuntimes() {
  const now = Date.now();
  if (runtimeCache && now - runtimeCacheAt < RUNTIME_CACHE_TTL_MS) {
    return runtimeCache;
  }

  const res = await fetch(`${PISTON_API}/runtimes`);
  if (!res.ok) {
    throw new Error('Gagal mengambil daftar runtime dari Piston API');
  }

  runtimeCache = await res.json();
  runtimeCacheAt = now;
  return runtimeCache;
}

function resolveRuntime(runtimes, lang) {
  const target = PISTON_LANGUAGE_ALIAS[lang] || lang;

  const matches = runtimes.filter(
    (r) => r.language === target || (r.aliases || []).includes(target)
  );

  if (matches.length === 0) return null;

  // Ambil versi paling baru
  matches.sort((a, b) =>
    a.version.localeCompare(b.version, undefined, { numeric: true })
  );

  return matches[matches.length - 1];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('run')
    .setDescription('Jalankan kode di sandbox online (Python, JS, C, C++, Java)')
    .addStringOption((option) =>
      option
        .setName('bahasa')
        .setDescription('Bahasa pemrograman')
        .setRequired(true)
        .addChoices(...LANGUAGE_CHOICES)
    )
    .addStringOption((option) =>
      option
        .setName('kode')
        .setDescription('Kode yang mau dijalankan')
        .setRequired(true)
        .setMaxLength(config.run.maxCodeLength)
    )
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('Input/stdin untuk program (opsional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('bahasa');
    const code = interaction.options.getString('kode');
    const stdin = interaction.options.getString('input') || '';

    // ================= COOLDOWN =================

    const now = Date.now();
    const cooldownMs = config.run.cooldownSeconds * 1000;
    const last = lastRunAt.get(interaction.user.id) || 0;

    if (now - last < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - last)) / 1000);
      return interaction.reply({
        content: `⏳ Tunggu ${waitSec} detik lagi sebelum menjalankan kode berikutnya.`,
        ephemeral: true,
      });
    }

    lastRunAt.set(interaction.user.id, now);

    await interaction.deferReply();

    try {
      const runtimes = await getRuntimes();
      const runtime = resolveRuntime(runtimes, lang);

      if (!runtime) {
        return interaction.editReply(
          `⚠️ Bahasa **${lang}** sedang tidak tersedia di sandbox. Coba bahasa lain.`
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.run.runTimeoutMs + config.run.compileTimeoutMs + 5000
      );

      let res;
      try {
        res = await fetch(`${PISTON_API}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: runtime.language,
            version: runtime.version,
            files: [{ name: FILENAMES[lang] || 'main.txt', content: code }],
            stdin,
            run_timeout: config.run.runTimeoutMs,
            compile_timeout: config.run.compileTimeoutMs,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        return interaction.editReply(
          '⚠️ Sandbox sedang bermasalah atau sibuk. Coba lagi beberapa saat lagi.'
        );
      }

      const data = await res.json();

      let output = '';

      if (data.compile && data.compile.stderr) {
        output += `Compile error:\n${data.compile.stderr}\n`;
      }

      if (data.run) {
        if (data.run.stdout) output += data.run.stdout;
        if (data.run.stderr) output += `\n[stderr]\n${data.run.stderr}`;
        if (data.run.signal) output += `\n[program dihentikan: sinyal ${data.run.signal}]`;
      }

      if (!output.trim()) output = '(tidak ada output)';

      let truncatedNote = '';
      if (output.length > MAX_OUTPUT_LENGTH) {
        output = output.slice(0, MAX_OUTPUT_LENGTH);
        truncatedNote = '\n… (output dipotong)';
      }

      await interaction.editReply(
        `**Bahasa:** ${runtime.language} ${runtime.version}\n` +
          '```\n' +
          output +
          '```' +
          truncatedNote
      );
    } catch (error) {
      console.error('Run command error:', error);

      const message =
        error.name === 'AbortError'
          ? '⏱️ Eksekusi kode terlalu lama dan dibatalkan.'
          : 'Terjadi kesalahan saat menjalankan kode. Coba lagi nanti.';

      await interaction.editReply(message);
    }
  },
};
