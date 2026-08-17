# 🤖 Discord Bot: Welcome Canvas + Leveling + Mini Games

Bot Discord custom bikin sendiri pakai **Node.js + Discord.js v14** + **@napi-rs/canvas**.

## ✨ Fitur
- 🖼️ **Welcome Card otomatis** — avatar + nama + nomor urut member, dikirim saat member baru join.
- 📈 **Sistem Leveling** — dapat XP dari chat (dengan cooldown anti-spam), auto level-up, tersimpan permanen di SQLite.
- 🏆 **`/rank`** — kartu rank bergambar (avatar, level, progress bar XP).
- 📊 **`/leaderboard`** — 10 member teratas di server.
- 🧠 **`/trivia`** — kuis interaktif pakai tombol.
- 🔢 **`/guess`** — game tebak angka 1-100.

---

## 🚀 Cara Setup

### 1. Buat Bot di Discord Developer Portal
1. Buka https://discord.com/developers/applications → **New Application**.
2. Ke tab **Bot** → klik **Reset Token** → salin token (ini `DISCORD_TOKEN`).
3. Di halaman yang sama, **aktifkan** 2 toggle ini (WAJIB, jangan sampai lupa):
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
4. Ke tab **OAuth2 > URL Generator**:
   - Scopes: centang `bot` dan `applications.commands`.
   - Bot Permissions: centang `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`.
   - Copy link yang di-generate di bawah, buka di browser, pilih server kamu → **Authorize**.
5. Salin **Application ID** di tab **General Information** (ini `CLIENT_ID`).

### 2. Install & Konfigurasi
```bash
cd discord-bot
npm install
cp .env.example .env
```

Buka file `.env`, isi:
```
DISCORD_TOKEN=token_bot_kamu
CLIENT_ID=application_id_kamu
GUILD_ID=id_server_kamu       # klik kanan icon server > Copy Server ID (aktifkan Developer Mode dulu di Discord)
WELCOME_CHANNEL_ID=id_channel_welcome
```

### 3. (Opsional tapi disarankan) Ganti Background Welcome Card
Taruh gambar background custom kamu di:
```
assets/background.jpg
```
Kalau file ini tidak ada, bot otomatis pakai gradient ungu default — tetap jalan, tidak error.

### 4. Daftarkan Slash Commands
```bash
npm run deploy
```
Command langsung muncul di server (karena pakai `GUILD_ID`). Kalau mau global di semua server bot (butuh ~1 jam sync), hapus `GUILD_ID` dari `.env` sebelum deploy.

### 5. Jalankan Bot
```bash
npm start
```
Kalau muncul `✅ Bot online sebagai NamaBot#0000` di terminal → bot sudah aktif!

---

## 🧪 Testing
- Coba `/rank`, `/leaderboard`, `/trivia`, `/guess` di server.
- Buat akun test (atau minta teman) untuk join server → welcome card harus otomatis muncul di channel yang di-set.
- Chat beberapa kali di channel → cek XP naik lewat `/rank`.

## 🛠️ Struktur Project
```
discord-bot/
├── deploy-commands.js      # daftarkan slash commands ke Discord
├── src/
│   ├── index.js             # entry point bot
│   ├── config.js            # semua pengaturan (XP rate, cooldown, dll)
│   ├── database.js          # SQLite: simpan XP, level, member count
│   ├── commands/             # /rank /leaderboard /trivia /guess
│   ├── events/                # guildMemberAdd, messageCreate, dll
│   └── utils/
│       ├── canvas.js          # generator gambar welcome card & rank card
│       └── xp.js               # logika hitung XP & level-up
├── assets/background.jpg    # ganti dengan background custom kamu
└── database/bot.sqlite       # dibuat otomatis, jangan dihapus manual
```

## ⚙️ Kustomisasi Cepat
- **Ubah kecepatan naik level**: edit `xp.minPerMessage`, `xp.maxPerMessage`, `xp.cooldownSeconds` di `src/config.js`.
- **Ubah rumus XP per level**: edit `xp.xpForLevel()` di `src/config.js`.
- **Tambah soal trivia**: edit array `QUESTIONS` di `src/commands/trivia.js`.
- **Ubah tampilan welcome card**: edit `src/utils/canvas.js` (warna, posisi teks, ukuran avatar, dll).
- **Tambah auto-role saat level tertentu**: tambahkan logic di `src/events/messageCreate.js` setelah `result.leveledUp`.

## 🐛 Troubleshooting
| Masalah | Solusi |
|---|---|
| Bot tidak online | Cek `DISCORD_TOKEN` benar & belum di-reset |
| Slash command tidak muncul | Jalankan `npm run deploy` lagi, tunggu beberapa detik / restart Discord client |
| Welcome card tidak terkirim | Pastikan `SERVER MEMBERS INTENT` aktif di Dev Portal & `WELCOME_CHANNEL_ID` benar |
| XP tidak nambah | Pastikan `MESSAGE CONTENT INTENT` aktif di Dev Portal |
| Error `better-sqlite3` saat install | Pastikan Node.js versi 18+ terinstall |

---

Selamat coding! 🚀 Kalau mau nambah fitur lanjutan (auto-role per level, moderation, music, dsb), tinggal tambah file baru di `src/commands/` — bot otomatis load semua command di folder itu.
