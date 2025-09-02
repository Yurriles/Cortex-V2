const {
  SlashCommandBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");

const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const levelSchema = require("../../Schemas/level");
const voiceLevelSchema = require("../../Schemas/voiceLevel");

// (Optional) register a nicer font if you ship one with your bot
// GlobalFonts.registerFromPath(require("path").join(__dirname, "../../assets/Inter-SemiBold.ttf"), "Inter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDMPermission(false)
    .setDescription("Displays the top 10 members of the server as an image leaderboard."),

  async execute(interaction) {
    // Fetch top 10 for both sources
    const [levelData, voiceData] = await Promise.all([
      levelSchema.find({ Guild: interaction.guild.id }).sort({ XP: -1 }).limit(10),
      voiceLevelSchema.find({ Guild: interaction.guild.id }).sort({ XP: -1 }).limit(10),
    ]);

    if (levelData.length === 0 && voiceData.length === 0) {
      return interaction.reply({
        content: "No members have XP data yet.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Re-usable renderer
    const renderLeaderboard = async (data, title, type) => {
      // Canvas size — 1280x720 keeps files small and looks crisp in Discord
      const W = 1280, H = 720;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // ---- Background
      const bgUrl = "https://wallpapers.com/images/hd/aesthetic-youtube-banner-background-2560-x-1440-ww9huiiatdggqa7g.jpg";
      const bg = await loadImage(bgUrl);
      // Cover-fit the background
      const scale = Math.max(W / bg.width, H / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      ctx.drawImage(bg, (W - bw) / -2, (H - bh) / -2, bw * 2, bh * 2); // a bit oversized to be safe

      // Dim overlay for readability
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, H);

      // Helpers
      const font = (size, weight = 700) =>
        `${weight} ${size}px ${GlobalFonts.has("Inter") ? "Inter" : "system-ui, -apple-system, Segoe UI, Roboto, Arial"}`;

      const roundRect = (x, y, w, h, r = 16) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      const trunc = (str, max) => (str.length > max ? str.slice(0, max - 1) + "…" : str);
      const nf = (n) => n.toLocaleString();

      // ---- Header
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = font(42, 800);
      ctx.textAlign = "left";
      ctx.fillText("LEADERBOARD", 36, 68);

      ctx.font = font(22, 600);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Top 10 by ${type} XP`, 36, 102);

      // Right-side tag
      const tagTxt = title.toUpperCase();
      ctx.font = font(24, 800);
      const tagW = ctx.measureText(tagTxt).width + 28;
      roundRect(W - tagW - 36, 36, tagW, 40, 12);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(tagTxt, W - tagW / 2 - 36, 64);

      // ---- Rows
      const startY = 140;
      const rowH = 52;
      const leftPad = 36;

      for (let i = 0; i < Math.min(10, data.length); i++) {
        const entry = data[i];

        // Try to resolve member&username (allow uncached)
        let username = "Unknown";
        try {
          const m =
            interaction.guild.members.cache.get(entry.User) ||
            (await interaction.guild.members.fetch(entry.User).catch(() => null));
          if (m) username = m.user?.username || m.displayName || "Unknown";
        } catch {}

        // Row background
        const y = startY + i * (rowH + 8);
        roundRect(leftPad - 4, y, W - leftPad * 2 + 8, rowH, 12);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fill();

        // Rank pill
        const rankStr = String(i + 1).padStart(2, "0");
        roundRect(leftPad + 4, y + 8, 56, rowH - 16, 10);
        ctx.fillStyle = i < 3 ? "rgba(255,215,0,0.9)" : "rgba(255,255,255,0.2)";
        ctx.fill();

        ctx.fillStyle = i < 3 ? "#1a1a1a" : "white";
        ctx.font = font(22, 800);
        ctx.textAlign = "center";
        ctx.fillText(rankStr, leftPad + 32, y + rowH / 2 + 8);

        // Username (with @ prefix)
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        ctx.font = font(22, 700);
        const uname = `@${username}`;
        ctx.fillText(trunc(uname, 24), leftPad + 76, y + rowH / 2 + 8);

        // Stats (Level | XP)
        ctx.textAlign = "right";
        ctx.font = font(18, 600);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        const stats = `Level ${entry.Level}  •  XP ${nf(entry.XP)}`;
        ctx.fillText(stats, W - leftPad, y + rowH / 2 + 8);
      }

      return canvas.toBuffer("image/png");
    };

    // Buttons
    const buildRow = (voiceDisabled, msgDisabled) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("voice_leaderboard")
          .setLabel("Voice Leaderboard")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(voiceDisabled),
        new ButtonBuilder()
          .setCustomId("message_leaderboard")
          .setLabel("Message Leaderboard")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(msgDisabled)
      );

    // Initial render: Message XP
    const initialPng = await renderLeaderboard(levelData, "Message Leaderboard", "Message");
    const initialAttachment = new AttachmentBuilder(initialPng, { name: "leaderboard.png" });
    let row = buildRow(false, true);

    await interaction.reply({ files: [initialAttachment], components: [row] });

    // Collector
    const filter = (i) =>
      (i.customId === "voice_leaderboard" || i.customId === "message_leaderboard") &&
      i.user.id === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000 });

    collector.on("collect", async (i) => {
      if (i.customId === "voice_leaderboard") {
        const png = await renderLeaderboard(voiceData, "Voice Leaderboard", "Voice");
        const file = new AttachmentBuilder(png, { name: "leaderboard.png" });
        row = buildRow(true, false);
        await i.update({ files: [file], components: [row] });
      } else {
        const png = await renderLeaderboard(levelData, "Message Leaderboard", "Message");
        const file = new AttachmentBuilder(png, { name: "leaderboard.png" });
        row = buildRow(false, true);
        await i.update({ files: [file], components: [row] });
      }
    });

    collector.on("end", async () => {
      // Disable both buttons after timeout
      row.components.forEach((btn) => btn.setDisabled(true));
      await interaction.editReply({ components: [row] });
    });
  },
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */
