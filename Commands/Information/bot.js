const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
  AttachmentBuilder,
} = require("discord.js");
const mongoose = require("mongoose");
const os = require("os");
const changelogs = require("../../Schemas/changelogs");
const { formatTime } = require("../../Utils/time");
const logs = require("../../Utils/logs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

mongoose.set("strictQuery", true);
mongoose.connect(process.env.mongodbURL);

const Test = mongoose.model("Test", { name: String });

const BG =
  "https://wallpapers.com/images/hd/aesthetic-youtube-banner-background-2560-x-1440-ww9huiiatdggqa7g.jpg";

const font = (size, weight = 800) =>
  `${weight} ${size}px ${
    GlobalFonts.has("Inter")
      ? "Inter"
      : "system-ui, -apple-system, Segoe UI, Roboto, Arial"
  }`;

function round(ctx, x, y, w, h, r = 20) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function statTile(ctx, x, y, w, h, title, value) {
  round(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = font(18, 700);
  ctx.fillText(title.toUpperCase(), x + 18, y + 32);
  ctx.fillStyle = "#fff";
  ctx.font = font(36, 900);
  ctx.fillText(value, x + 18, y + 72);
}
// Add these helpers once
function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  while (text.length && ctx.measureText(text + ellipsis).width > maxWidth) {
    text = text.slice(0, -1);
  }
  return text + ellipsis;
}

function statTile(ctx, x, y, w, h, title, value) {
  round(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const padX = 18;
  const padBottom = 18;
  const maxValueWidth = w - padX * 2;

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = font(18, 800);
  ctx.fillText(title.toUpperCase(), x + padX, y + 32);

  let val = String(value);
  let size = 36;
  ctx.fillStyle = "#fff";
  while (size >= 16) {
    ctx.font = font(size, 900);
    if (ctx.measureText(val).width <= maxValueWidth) break;
    size -= 1;
  }
  if (ctx.measureText(val).width > maxValueWidth) {
    val = truncateToWidth(ctx, val, maxValueWidth);
  }

  const baseline = y + h - padBottom;
  ctx.fillText(val, x + padX, baseline);
}

// Your ping card using the safe statTile above
async function renderPingCard({ ws, db, uptime, avatarURL, botName }) {
  const W = 1100;
  const H = 430;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = await loadImage(BG);
  const scale = Math.max(W / bg.width, H / bg.height);
  const bw = bg.width * scale;
  const bh = bg.height * scale;
  ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, H);

  round(ctx, 20, 20, W - 40, H - 40, 26);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const avatar = await loadImage(avatarURL);
  ctx.save();
  round(ctx, 40, 40, 140, 140, 20);
  ctx.clip();
  ctx.drawImage(avatar, 40, 40, 140, 140);
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = font(42, 900);
  ctx.fillText("PONG!", 200, 86);
  ctx.font = font(22, 700);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(botName, 200, 120);

  const P = 40;
  const GAP = 30;
  const tileW = (W - P * 2 - GAP * 2) / 3;
  const tileH = 120;
  const baseY = 190;

  statTile(ctx, P, baseY, tileW, tileH, "websocket", `${ws} ms`);
  statTile(ctx, P + tileW + GAP, baseY, tileW, tileH, "database", `${db} ms`);
  statTile(ctx, P + (tileW + GAP) * 2, baseY, tileW, tileH, "uptime", uptime);

  const footerH = 56;
  const footerY = H - 20 - footerH;
  round(ctx, 20, footerY, W - 40, footerH, 16);
  ctx.save();
  ctx.clip();
  const grad = ctx.createLinearGradient(0, footerY, 0, footerY + footerH);
  grad.addColorStop(0, "rgba(255,255,255,0.10)");
  grad.addColorStop(1, "rgba(255,255,255,0.08)");
  ctx.fillStyle = grad;
  ctx.fillRect(20, footerY, W - 40, footerH);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  round(ctx, 20, footerY, W - 40, footerH, 16);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = font(18, 700);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`Last checked: ${new Date().toLocaleTimeString()}`, 40, footerY + footerH / 2);

  return canvas.toBuffer("image/png");
}



async function renderInviteCard({ botName, avatarURL, serverCount, userCount, cmdCount }) {
  const W = 1200;
  const H = 480;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const bg = await loadImage(BG);
  const scale = Math.max(W / bg.width, H / bg.height);
  const bw = bg.width * scale;
  const bh = bg.height * scale;
  ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, H);
  round(ctx, 24, 24, W - 48, H - 48, 26);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const avatar = await loadImage(avatarURL);
  ctx.save();
  round(ctx, 48, 48, 140, 140, 20);
  ctx.clip();
  ctx.drawImage(avatar, 48, 48, 140, 140);
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = font(40, 900);
  ctx.fillText("INVITE ME", 210, 92);
  ctx.font = font(22, 700);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(botName, 210, 126);
  const tileW = (W - 96 - 48) / 3;
  const tileY = 210;
  statTile(ctx, 48, tileY, tileW, 120, "servers", `${serverCount}`);
  statTile(ctx, 48 + tileW + 24, tileY, tileW, 120, "users", `${userCount}`);
  statTile(ctx, 48 + (tileW + 24) * 2, tileY, tileW, 120, "commands", `${cmdCount}`);
  ctx.textAlign = "center";
  ctx.font = font(20, 700);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("Use the buttons below to add me to your server or join support.", W / 2, H - 64);
  return canvas.toBuffer("image/png");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Jarvis OP")
    .addSubcommand((command) =>
      command
        .setName("suggest")
        .setDescription("Suggest a feature")
        .addStringOption((option) =>
          option.setName("suggestion").setDescription("The suggestion").setRequired(true)
        )
    )
    .addSubcommand((command) => command.setName("info").setDescription("Shows the status of the bot."))
    .addSubcommand((command) => command.setName("support").setDescription("Get support server invite."))
    .addSubcommand((command) => command.setName("source-code").setDescription("Want to buy the source code of this bot?"))
    .addSubcommand((command) => command.setName("uptime").setDescription("Displays the bot uptime and system uptime"))
    .addSubcommand((command) => command.setName("invite").setDescription("Invite our Bot to your servers"))
    .addSubcommand((command) => command.setName("ping").setDescription("Pong! View the speed of the bot's response"))
    .addSubcommand((command) => command.setName("changelogs").setDescription("Show last bot changelogs"))
    .addSubcommand((command) =>
      command
        .setName("report-bug")
        .setDescription("Report a bug to the Developers of this Bot!")
        .addStringOption((option) => option.setName("command").setDescription("The not-working/bugging command").setRequired(true))
        .addStringOption((option) => option.setName("details").setDescription("Describe the Problem (not required)").setRequired(false))
    )
    .addSubcommand((command) =>
      command.setName("feedback").setDescription("Give feedback to my developer.").addStringOption((option) => option.setName("message").setDescription("Your feedback message").setRequired(true))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    try {
      switch (sub) {
        case "support":
          return await interaction.reply({ content: `https://discord.gg/YSv9VqQg6g` });
        case "source-code":
          return await interaction.reply({ content: `[Source Code Available on BuiltByBit](https://builtbybit.com/resources/razor-an-all-in-one-discord-bot.29648/)` });
        case "suggest":
          return await handleSuggestion(interaction, client);
        case "ping":
          return await handlePing(interaction, client);
        case "changelogs":
          return await handleChangelogs(interaction);
        case "invite":
          return await handleInvite(interaction, client);
        case "uptime":
          return await handleUptime(interaction);
        case " report-bug":
          return await handleBugReport(interaction, client);
        case "info":
          return await handleInfo(interaction, client);
        case "feedback":
          return await handleFeedback(interaction, client);
        default:
          return await interaction.reply({ content: "Invalid subcommand.", flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      logs.error(error);
      return await interaction.reply({ content: "An error occurred while processing your request.", flags: MessageFlags.Ephemeral });
    }
  },
};

async function handleSuggestion(interaction, client) {
  const suggestion = interaction.options.getString("suggestion");
  const userId = interaction.user.id;
  const embed = new EmbedBuilder().setTitle("NEW SUGGESTION!").setColor("Green").addFields({ name: ":User  ", value: `<@${userId}>`, inline: false }).setDescription(suggestion).setTimestamp();
  const responseEmbed = new EmbedBuilder().setTitle("You sent us a suggestion!").setDescription(suggestion).setColor("Green");
  const channel = client.channels.cache.get(client.config.botsuggestions);
  await channel.send({ embeds: [embed] }).catch(() => {});
  return await interaction.reply({ embeds: [responseEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
}

async function handlePing(interaction, client) {
  await interaction.deferReply();
  const dbStart = Date.now();
  await Test.findOne();
  const dbPing = Date.now() - dbStart;
  const wsPing = Math.max(0, client.ws.ping | 0);
  const uptime = formatTime(process.uptime());
  const buffer = await renderPingCard({
    ws: wsPing,
    db: dbPing,
    uptime,
    avatarURL: client.user.displayAvatarURL({ extension: "png", size: 256 }),
    botName: client.user.username,
  });
  const file = new AttachmentBuilder(buffer, { name: "ping.png" });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ping_reload").setStyle(ButtonStyle.Secondary).setEmoji("🔄").setLabel("Reload")
  );
  const msg = await interaction.editReply({ files: [file], components: [row] });
  const collector = msg.createMessageComponentCollector({ time: 60_000 });
  collector.on("collect", async (i) => {
    if (i.customId !== "ping_reload") return;
    const dbStart2 = Date.now();
    await Test.findOne();
    const dbPing2 = Date.now() - dbStart2;
    const wsPing2 = Math.max(0, client.ws.ping | 0);
    const buffer2 = await renderPingCard({
      ws: wsPing2,
      db: dbPing2,
      uptime: formatTime(process.uptime()),
      avatarURL: client.user.displayAvatarURL({ extension: "png", size: 256 }),
      botName: client.user.username,
    });
    const file2 = new AttachmentBuilder(buffer2, { name: "ping.png" });
    await i.update({ files: [file2], components: [row] });
  });
  collector.on("end", async () => {
    row.components.forEach((b) => b.setDisabled(true));
    await interaction.editReply({ components: [row] });
  });
}

async function handleChangelogs(interaction) {
  const data = await changelogs.findOne({}).sort({ date: -1 }).exec();
  if (!data) {
    return await interaction.reply({ content: `> ${client.emoji.cross} No changelogs have been published`, flags: MessageFlags.Ephemeral });
  }
  const embed = new EmbedBuilder()
    .setTitle(data.config.title || `${interaction.client.user.username} Changelogs`)
    .setDescription(data.config.description || `${client.emoji.error} A new changelog is here!`)
    .setFooter({ text: `${data.config.footer || `${interaction.client.user.username} Changelogs`} | ${data.config.type || "Bot"}`, iconURL: interaction.client.user.avatarURL() })
    .setColor(data.config.color || "White");
  return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleInvite(interaction, client) {
  await interaction.deferReply();
  const link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands`;
  const support = "https://discord.gg/YSv9VqQg6g";
  const servers = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
  const cmds = client.commands.size;
  const buffer = await renderInviteCard({
    botName: client.user.username,
    avatarURL: client.user.displayAvatarURL({ extension: "png", size: 256 }),
    serverCount: servers,
    userCount: users,
    cmdCount: cmds,
  });
  const file = new AttachmentBuilder(buffer, { name: "invite.png" });
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setURL(link).setLabel("Invite Me").setStyle(ButtonStyle.Link),
    new ButtonBuilder().setURL(support).setLabel("Support Server").setStyle(ButtonStyle.Link)
  );
  return await interaction.editReply({ files: [file], components: [buttons] });
}

async function handleUptime(interaction) {
  const botUptime = process.uptime();
  const formattedBotUptime = formatTime(botUptime);
  const systemUptime = os.uptime();
  const formattedSystemUptime = formatTime(systemUptime);
  return await interaction.reply({
    content: `## Bot uptime: ${formattedBotUptime}\n## System uptime: ${formattedSystemUptime}`,
  });
}

async function handleBugReport(interaction, client) {
  const userTag = interaction.user.tag;
  const command = interaction.options.getString("command");
  const bugDetails = interaction.options.getString("details") || "No details given!";
  const embed = new EmbedBuilder().setTitle("NEW REPORTED BUG!").setDescription(`Bug: ${bugDetails}`).addFields({ name: "Command", value: command, inline: false }).addFields({ name: "User ", value: userTag, inline: false });
  const sendEmbed = new EmbedBuilder().setTitle("YOU REPORTED A BUG!").setDescription(`Bug: ${bugDetails}`).addFields({ name: "Command", value: command }).setFooter({ text: "The Developer Team will contact you as fast as they can!" });
  const channel = client.channels.cache.get(client.config.bugreport);
  await channel.send({ embeds: [embed] }).catch(() => {});
  return await interaction.reply({ embeds: [sendEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
}

async function handleInfo(interaction, client) {
  const botUptime = process.uptime();
  const formattedBotUptime = formatTime(botUptime);
  const status = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
  await client.user.fetch();
  await client.application.fetch();
  const getChannelTypeSize = (type) => client.channels.cache.filter((channel) => type.includes(channel.type)).size;
  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands`).setLabel("Invite Me").setStyle(ButtonStyle.Link),
    new ButtonBuilder().setURL(`https://discord.gg/7BfRV7w6ha`).setLabel("Support Server").setStyle(ButtonStyle.Link),
    new ButtonBuilder().setURL(`https://top.gg/bot/1002188910560026634/vote`).setLabel("Vote").setStyle(ButtonStyle.Link)
  );
  return await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`${client.user.username}`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields({
          name: "**Basic Information**",
          value: `>>> **Client ID:** \`[${client.user.id}]\`\n**Server Count:** ${client.guilds.cache.size}\n**User  Count:** ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\n**Channel Count:** ${getChannelTypeSize([ChannelType.GuildText, ChannelType.GuildNews])}\n**Total Commands:** ${client.commands.size}\n**Developer:** <@${client.application.owner.id}>`,
          inline: false,
        })
        .addFields({
          name: "**Status**",
          value: `>>> **Ping:** ${client.ws.ping}ms\n**Uptime:** ${formattedBotUptime}\n**OS:** ${os.type().replace("Windows_NT", "Windows").replace("Darwin", "macOS")}\n**CPU Usage:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}%\n**CPU Model:** ${os.cpus()[0].model}`,
          inline: false,
        }),
    ],
    components: [button],
  });
}

async function handleFeedback(interaction, client) {
  const userTag = interaction.user.tag;
  const feedbackMessage = interaction.options.getString("message");
  const embed = new EmbedBuilder().setTitle("NEW Feedback").addFields({ name: "Feedback", value: feedbackMessage, inline: false }).addFields({ name: "User ", value: userTag, inline: false });
  const sendEmbed = new EmbedBuilder().setTitle("Thanks For Your Feedback").addFields({ name: "Feedback", value: feedbackMessage }).setFooter({ text: "The Developer Team Received Your Feedback" });
  const channel = client.channels.cache.get(client.config.feedback);
  await channel.send({ embeds: [embed] }).catch(() => {});
  return await interaction.reply({ embeds: [sendEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
}
