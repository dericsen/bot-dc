# 🤖 Discord Bot: Welcome Canvas + Leveling + Mini Games

Bot Discord custom bikin sendiri pakai **Node.js + Discord.js v14** + **@napi-rs/canvas**.

## ✨ Fitur
- 🖼️ **Welcome Card otomatis** — avatar + nama + nomor urut member, dikirim saat member baru join.
- 📈 **Sistem Leveling** — dapat XP dari chat (dengan cooldown anti-spam), auto level-up, tersimpan permanen di SQLite.
- 🏆 **`/rank`** — kartu rank bergambar (avatar, level, progress bar XP).
- 📊 **`/leaderboard`** — 10 member teratas di server.
- 🧠 **`/trivia`** — kuis interaktif pakai tombol.
- 🔢 **`/guess`** — game tebak angka 1-100.
- 🏆 **`/lomba`** — kelola & umumkan info lomba, member bisa klik tombol "Ikuti".
- 🎖️ **Auto-role per level** — otomatis kasih role begitu member mencapai level tertentu.
- 🔔 **GitHub Webhook → Discord** — kirim notifikasi push/PR/issue/release repo ke channel tertentu.
- 💻 **`/run`** — jalankan kode Python/JS/C/C++/Java langsung di Discord lewat sandbox online (Piston API), tanpa eksekusi kode apa pun di server bot sendiri.

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
- Coba `/rank`, `/leaderboard`, `/trivia`, `/guess`, `/lomba`, `/run` di server.
- Buat akun test (atau minta teman) untuk join server → welcome card harus otomatis muncul di channel yang di-set.
- Chat beberapa kali di channel → cek XP naik lewat `/rank`.
- Chat sampai level yang ada di `AUTOROLE_LEVEL_*` → cek role otomatis nempel.
- Push commit test ke repo yang sudah dipasangi webhook → cek notifikasi muncul di channel GitHub.

## 🎖️ Setup Auto-Role per Level
1. Buat role di server (misal `@Active Member`, `@Rajin Ngoding`).
2. Klik kanan role tersebut → **Copy Role ID** (aktifkan Developer Mode dulu kalau belum).
3. Isi di `.env`: `AUTOROLE_LEVEL_5=id_role_di_sini` (ganti `5` sesuai level yang kamu mau, atau tambah level baru langsung di `src/config.js` bagian `autoRoles`).
4. **Penting:** posisikan role bot kamu (Server Settings → Roles) **di atas** role-role auto-role ini, dan pastikan bot punya permission **Manage Roles** — kalau tidak, Discord akan menolak permintaan tambah role.

## 🔔 Setup GitHub Webhook
1. Isi `.env`:
   ```
   GITHUB_WEBHOOK_SECRET=generate_random_string_sendiri  # contoh: openssl rand -hex 20
   GITHUB_CHANNEL_ID=id_channel_untuk_notif_github
   GITHUB_WEBHOOK_PORT=3000
   ```
2. Bot butuh alamat publik supaya GitHub bisa mengirim webhook ke dia:
   - **Testing lokal**: pakai tunnel seperti `ngrok http 3000` atau `cloudflared tunnel --url http://localhost:3000`, lalu pakai URL yang diberikan.
   - **Production**: deploy bot ke VPS/server dengan port `3000` (atau sesuai `GITHUB_WEBHOOK_PORT`) yang bisa diakses dari internet.
3. Di repo GitHub: **Settings → Webhooks → Add webhook**
   - Payload URL: `https://alamat-publik-kamu/github/webhook`
   - Content type: `application/json`
   - Secret: sama persis dengan `GITHUB_WEBHOOK_SECRET`
   - Pilih event yang mau dikirim (Push, Pull requests, Issues, Releases, dll)
4. Restart bot (`npm start`) — kalau kedua env var terisi, log akan menunjukkan `[GitHub Webhook] Siap menerima di ...`.

## 💻 Cara Kerja `/run`
`/run` **tidak** mengeksekusi kode apa pun di komputer/server tempat bot berjalan. Kode dikirim ke [Piston](https://github.com/engineer-man/piston) — API sandbox publik gratis yang sama dipakai bot seperti Godbolt/TIO — dijalankan di sana, lalu hasilnya (`stdout`/`stderr`) dikirim balik ke Discord. ini menghindari resiko keamanan menjalankan kode sembarang orang langsung di server kalian. Ada cooldown 10 detik per user (`config.run.cooldownSeconds`) supaya tidak membanjiri API publik tersebut.

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
