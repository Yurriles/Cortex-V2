const { SlashCommandBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Get info of a member in the server.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user you want to get info from").setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser("user") || interaction.user;
      const member = await interaction.guild.members.fetch(user.id);

      let bannerURL = null;
      try {
        const u = await client.users.fetch(user.id, { force: true });
        bannerURL = u.bannerURL({ size: 2048 });
      } catch {}

      let flagsArr = [];
      try {
        const flags = user.flags ?? (await user.fetchFlags());
        flagsArr = flags?.toArray?.() ?? [];
      } catch {}

      const isBooster = !!member.premiumSince;

      const topRole = member.roles.highest?.id === interaction.guild.id ? null : member.roles.highest;
      const accent = topRole?.hexColor && topRole.hexColor !== "#000000" ? topRole.hexColor : "#FFD700";

      const joinPosition =
        (await interaction.guild.members.fetch())
          .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
          .map((m) => m.id)
          .indexOf(member.id) + 1;

      const mutualCount = client.guilds.cache.filter((g) => g.members.cache.has(member.id)).size;

      const botOwners = (process.env.developerId || "").split(/[,\s]+/).filter(Boolean);
      const isOwner = member.id === interaction.guild.ownerId;
      const isDev = botOwners.includes(member.id);

      const W = 1200;
      const H = 600;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const font = (size, weight = 700) =>
        `${weight} ${size}px ${GlobalFonts.has("Inter") ? "Inter" : "system-ui, -apple-system, Segoe UI, Roboto, Arial"}`;

      const roundRect = (x, y, w, h, r = 18) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      const truncateToWidth = (ctx2, text, maxWidth) => {
        if (ctx2.measureText(text).width <= maxWidth) return text;
        const ellipsis = "…";
        while (text.length && ctx2.measureText(text + ellipsis).width > maxWidth) {
          text = text.slice(0, -1);
        }
        return text + ellipsis;
      };

      const drawPill = (x, y, text, paddingX = 14, paddingY = 8) => {
        ctx.font = font(18, 700);
        const w = ctx.measureText(text).width + paddingX * 2;
        const h = 34 + (paddingY - 8) * 2;
        roundRect(x, y, w, h, 14);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x + paddingX, y + h / 2);
        return { w, h };
      };

      const drawLabel = (x, y, label, value) => {
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = font(16, 700);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(label.toUpperCase(), x, y);
        ctx.font = font(22, 800);
        ctx.fillStyle = "#fff";
        ctx.fillText(value, x, y + 30);
      };

      const nf = (n) => n.toLocaleString();

      const bgUrl = "https://wallpapers.com/images/hd/aesthetic-youtube-banner-background-2560-x-1440-ww9huiiatdggqa7g.jpg";
      const bg = await loadImage(bgUrl);
      const scale = Math.max(W / bg.width, H / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, H);

      roundRect(24, 24, W - 48, H - 48, 22);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.font = font(34, 900);
      ctx.fillText("USER INFORMATION", 48, 76);

      let chipX = 48;
      const chipY = 92;
      if (isOwner) {
        const m = drawPill(chipX, chipY, "Server Owner");
        chipX += m.w + 10;
      }
      if (isDev) {
        const m = drawPill(chipX, chipY, "Bot Developer");
        chipX += m.w + 10;
      }
      if (isBooster) {
        const m = drawPill(chipX, chipY, "Server Booster");
        chipX += m.w + 10;
      }

      if (bannerURL) {
        const banner = await loadImage(bannerURL);
        const bW = 520,
          bH = 120;
        roundRect(W - 48 - bW, 48, bW, bH, 16);
        ctx.save();
        ctx.clip();
        ctx.drawImage(banner, W - 48 - bW, 48, bW, bH);
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.5;
        roundRect(W - 48 - bW, 48, bW, bH, 16);
        ctx.stroke();
      }

      const avatarURL = member.displayAvatarURL({ extension: "png", size: 256 });
      const avatar = await loadImage(avatarURL);

      const AV_X = 64,
        AV_Y = 140,
        AV_R = 88;

      ctx.beginPath();
      ctx.arc(AV_X + AV_R, AV_Y + AV_R, AV_R + 6, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(AV_X + AV_R, AV_Y + AV_R, AV_R, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, AV_X, AV_Y, AV_R * 2, AV_R * 2);
      ctx.restore();

      const displayName = member.displayName || user.username;
      const handle = `@${user.username}`;
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = font(34, 900);
      ctx.fillText(displayName, AV_X + AV_R * 2 + 32, 190);
      ctx.font = font(22, 700);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(handle, AV_X + AV_R * 2 + 32, 222);

      const flagLabels = {
        Staff: "Discord Staff",
        Partner: "Partner",
        Hypesquad: "HypeSquad",
        HypeSquadOnlineHouse1: "Bravery",
        HypeSquadOnlineHouse2: "Brilliance",
        HypeSquadOnlineHouse3: "Balance",
        BugHunterLevel1: "Bug Hunter",
        BugHunterLevel2: "Bug Hunter Gold",
        CertifiedModerator: "Certified Mod",
        VerifiedDeveloper: "Early Dev",
        ActiveDeveloper: "Active Dev",
        PremiumEarlySupporter: "Early Supporter",
      };

      let fx = AV_X + AV_R * 2 + 32;
      const fy = 242;
      for (const f of flagsArr) {
        const label = flagLabels[f];
        if (!label) continue;
        const m = drawPill(fx, fy, label);
        fx += m.w + 8;
      }

      const L_X = AV_X + AV_R * 2 + 32;
      const R_X = W / 2 + 40;
      const ST_Y = 310;

      const fmt = (d) =>
        new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }).format(d);

      drawLabel(L_X, ST_Y, "User ID", user.id);
      drawLabel(L_X, ST_Y + 70, "Top Role", topRole ? `@${topRole.name}` : "None");
      drawLabel(L_X, ST_Y + 140, "Booster", isBooster ? "Yes" : "No");

      drawLabel(R_X, ST_Y, "Joined Server", fmt(member.joinedAt));
      drawLabel(R_X, ST_Y + 70, "Discord User Since", fmt(user.createdAt));
      drawLabel(R_X, ST_Y + 140, "Join Position", `#${nf(joinPosition)}`);

      const footerH = 58;
      const footerY = H - 24 - footerH;

      roundRect(24, footerY, W - 48, footerH, 14);
      ctx.save();
      ctx.clip();
      const grad = ctx.createLinearGradient(0, footerY, 0, footerY + footerH);
      grad.addColorStop(0, "rgba(255,255,255,0.10)");
      grad.addColorStop(1, "rgba(255,255,255,0.08)");
      ctx.fillStyle = grad;
      ctx.fillRect(24, footerY, W - 48, footerH);
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      roundRect(24, footerY, W - 48, footerH, 14);
      ctx.stroke();

      const cy = footerY + footerH / 2;
      ctx.textBaseline = "middle";
      ctx.font = font(18, 700);
      ctx.fillStyle = "rgba(255,255,255,0.9)";

      ctx.textAlign = "left";
      const leftPad = 40;
      const leftText = `Mutual Servers: ${nf(mutualCount)}`;
      ctx.fillText(leftText, 24 + leftPad, cy);

      ctx.textAlign = "right";
      const rightPad = 40;
      const maxRightWidth = (W - 48) / 2;
      let rightText = `Guild: ${interaction.guild.name}`;
      rightText = truncateToWidth(ctx, rightText, maxRightWidth - rightPad);
      ctx.fillText(rightText, W - 24 - rightPad, cy);

      const buffer = canvas.toBuffer("image/png");
      const file = new AttachmentBuilder(buffer, { name: "userinfo.png" });
      await interaction.editReply({ files: [file] });
    } catch (error) {
      const content = "There was an error fetching the user information.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
  },
};
