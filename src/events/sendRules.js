const fs = require("fs");
const path = require("path");
const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        const dataPath = path.join(__dirname, "..", "rulesSent.json");

        // Jangan kirim lagi kalau sudah pernah
        if (fs.existsSync(dataPath)) {
            console.log("Rules sudah pernah dikirim.");
            return;
        }

        try {
            const RULES_CHANNEL_ID = "1538792667935277176";

            const channel = await client.channels.fetch(RULES_CHANNEL_ID);

            if (!channel) {
                console.log("Channel rules tidak ditemukan.");
                return;
            }

            // EMBED 1 - HEADER
            const rulesEmbed = new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("📜 SERVER RULES")
                .setDescription(`
**1. 🤝 Respect Everyone**
Saling menghormati dan jaga sikap.

**2. 🚫 No Discrimination**
Dilarang melakukan diskriminasi berdasarkan gender, suku, agama, ras, atau golongan.

**3. 🔒 Protect Privacy**
Jangan meminta atau menyebarkan informasi pribadi orang lain.

**4. ⚠️ No Illegal Content**
Dilarang membagikan pornografi, judi, piracy, atau konten ilegal lainnya.

**5. 📰 No Hoax**
Jangan menyebarkan informasi palsu atau menyesatkan.

**6. 👤 Use Your Real Name**
Gunakan nama asli sebagai profile name.

**7. 🎭 Use the Correct Role**
Gunakan role yang sesuai dengan role kamu di Onboard.

**8. ⚖️ Follow the Rules**
Pelanggaran akan ditindaklanjuti oleh pengurus.

💙 **ONE FAMILY, ONE GOAL!** 💙
`).setFooter({
                    text: "Dengan berada di server ini, kamu dianggap telah membaca dan menyetujui seluruh peraturan."
                });
    await channel.send({
        embeds: [rulesEmbed],
    });

    // Tandai sudah terkirim
    fs.writeFileSync(
        dataPath,
        JSON.stringify({
            sent: true,
            sentAt: new Date().toISOString(),
        })
    );

    console.log("Rules berhasil dikirim!");
} catch (error) {
    console.error("Gagal mengirim rules:", error);
}
    },
};