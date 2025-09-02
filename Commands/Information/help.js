const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const font = (size, weight = 900) =>
  `${weight} ${size}px ${GlobalFonts.has("Inter") ? "Inter" : "system-ui, -apple-system, Segoe UI, Roboto, Arial"}`;

function round(ctx, x, y, w, h, r = 24) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function renderHelpBanner(botName, avatarURL) {
  const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

  const W = 1200, H = 200;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const FACE = GlobalFonts.has("Inter")
    ? "Inter"
    : "system-ui, -apple-system, Segoe UI, Roboto, Arial";

  const TEXTBG = "#1f2326";
  const TILEBG = "#111519";
  const DARK   = "#0f1113";

  const PAD = 16;
  const GAP = 16;
  const R   = 24;
  const TILE = 160;

  ctx.clearRect(0, 0, W, H);

  const roundLoc = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const tileX = PAD, tileY = PAD, tileW = TILE, tileH = H - PAD*2;
  roundLoc(tileX, tileY, tileW, tileH, R);
  ctx.fillStyle = TILEBG;
  ctx.fill();

  const logo = await loadImage(avatarURL);
  ctx.save();
  roundLoc(tileX, tileY, tileW, tileH, R);
  ctx.clip();
  ctx.drawImage(logo, tileX, tileY, tileW, tileH);
  ctx.restore();

  const textX = tileX + tileW + GAP;
  const textY = PAD;
  const textW = W - PAD - textX;
  const textH = H - PAD*2;

  roundLoc(textX, textY, textW, textH, R);
  ctx.fillStyle = TEXTBG;
  ctx.fill();

  const sheen = ctx.createLinearGradient(0, textY, 0, textY + textH);
  sheen.addColorStop(0, "rgba(255,255,255,0.06)");
  sheen.addColorStop(1, "rgba(255,255,255,0.02)");
  ctx.fillStyle = sheen;
  roundLoc(textX, textY, textW, textH, R);
  ctx.fill();

  const padX = 28;
  const TITLE_SIZE = 64;
  const SUB_SIZE   = 32;
  const LINE_GAP   = 44;
  const infoR = 18;

  const titleText = `${botName} Help`;
  ctx.font = `900 ${TITLE_SIZE}px ${FACE}`;
  const mt = ctx.measureText(titleText);
  const tAsc = mt.actualBoundingBoxAscent ?? TITLE_SIZE * 0.8;
  const tDes = mt.actualBoundingBoxDescent ?? TITLE_SIZE * 0.2;

  const subText = `New to ${botName}? Look through the categories!`;
  ctx.font = `800 ${SUB_SIZE}px ${FACE}`;
  const ms = ctx.measureText(subText);
  const sAsc = ms.actualBoundingBoxAscent ?? SUB_SIZE * 0.8;
  const sDes = ms.actualBoundingBoxDescent ?? SUB_SIZE * 0.2;

  const titleY0 = textY + tAsc + 8;
  const subY0   = titleY0 + LINE_GAP;

  const groupTop    = titleY0 - tAsc;
  const groupBottom = subY0 + sDes;
  const groupMid    = (groupTop + groupBottom) / 2;
  const panelMid    = textY + textH / 2;
  const deltaY      = panelMid - groupMid;

  const titleY = titleY0 + deltaY;
  const subY   = subY0 + deltaY;

  const infoCx = textX + padX + infoR;
  const infoCy = titleY + (tDes - tAsc) / 2;

  ctx.beginPath();
  ctx.arc(infoCx, infoCy, infoR, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = DARK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 24px ${FACE}`;
  ctx.fillText("i", infoCx, infoCy + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${TITLE_SIZE}px ${FACE}`;
  const titleX = infoCx + infoR + 12;
  ctx.fillText(titleText, titleX, titleY);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `800 ${SUB_SIZE}px ${FACE}`;
  ctx.fillText(subText, titleX, subY);

  return canvas.toBuffer("image/png");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`help`)
    .setDescription("Get information about the Razor Bot Commands."),

  async execute(interaction, client) {
    let servers = await client.guilds.cache.size;
    let users = await client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);

    let commandIds = new Map();
    try {
      const commands = await client.application.commands.fetch();
      commands.forEach((command) => commandIds.set(command.name, command.id));
    } catch {}

    const commandFolders = fs
      .readdirSync(`./Commands`)
      .filter((folder) => !folder.startsWith(".") && folder !== "Owner");
    const commandsByCategory = {};
    for (const folder of commandFolders) {
      const commandFiles = fs.readdirSync(`./Commands/${folder}`).filter((file) => file.endsWith(".js"));
      const commands = [];
      for (const file of commandFiles) {
        try {
          const { default: command } = await import(`./../${folder}/${file}`);
          if (command.data && command.data.name && command.data.description) {
            const entry = { name: command.data.name, description: command.data.description, subcommands: [] };
            if (command.data.options?.length > 0) {
              command.data.options.forEach((option) => {
                if (option instanceof require("discord.js").SlashCommandSubcommandBuilder) {
                  entry.subcommands.push({ name: option.name, description: option.description || "No description provided" });
                }
              });
            }
            commands.push(entry);
          }
        } catch {}
      }
      const unique = [];
      const seen = new Set();
      for (const c of commands) {
        if (!seen.has(c.name)) { seen.add(c.name); unique.push(c); }
      }
      unique.sort((a, b) => a.name.localeCompare(b.name));
      commandsByCategory[folder] = unique;
    }

    const resolveEmoji = (emoji) => {
      if (!emoji) return undefined;
      const match = emoji.match(/^<a?:\w+:(\d+)>$/);
      if (match) return { id: match[1] };
      return { name: emoji };
    };

    const dropdownOptions = [
      { label: "Home", value: "home", emoji: resolveEmoji(client.emoji.home) },
      ...Object.keys(commandsByCategory).map((folder) => ({
        label: folder,
        value: folder,
        emoji: resolveEmoji(
          {
            Antinuke: client.emoji.antinuke,
            Automod: client.emoji.thunder,
            Economy: client.emoji.economy,
            Fun: client.emoji.fun,
            Community: client.emoji.community,
            PremiumCommands: client.emoji.premium,
            Socials: client.emoji.socials,
            Giveaway: client.emoji.giveaway,
            Images: client.emoji.images,
            Information: client.emoji.information,
            Moderation: client.emoji.moderation,
            Music: client.emoji.music,
            Setups: client.emoji.setups,
            Suggestion: client.emoji.suggestions,
            Tools: client.emoji.tools,
            Utility: client.emoji.utils,
          }[folder]
        ),
      })),
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`category-select`)
      .setPlaceholder(`Razor | Help Menu`)
      .addOptions(...dropdownOptions);

    const bannerBuffer = await renderHelpBanner(
      client.user.username,
      client.user.displayAvatarURL({ extension: "png", size: 256 })
    );
    const makeBannerFile = () => new AttachmentBuilder(bannerBuffer, { name: "help-banner.png" });

    const homeEmbed = new EmbedBuilder()
      .setAuthor({
        name: "Razor",
        iconURL: client.user.avatarURL(),
        url: `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`,
      })
      .setDescription(
        `• Hey! :wave:\n` +
          `• Total commands: ${client.commands.size}\n` +
          `• Get [\`Razor\`](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands) | [\`Support server\`](https://discord.gg/5FzKutmwSw) | [\`Vote Me\`](https://top.gg/bot/1002188910560026634/vote)\n` +
          `• In \`${servers}\` servers with \`${users}\` members`
      )
      .setImage("attachment://help-banner.png")
      .addFields({
        name: `__**Main**__`,
        value: [
          `${client.emoji.automod} Automod`,
          `${client.emoji.community} Community`,
          `${client.emoji.fun} Fun`,
          `${client.emoji.information} Information`,
          `${client.emoji.moderation} Moderation`,
          `${client.emoji.music} Music`,
          `${client.emoji.setups} Setups`,
        ]
          .sort()
          .join("\n"),
        inline: true,
      })
      .addFields({
        name: `**__Extras__**`,
        value: [
          `${client.emoji.economy} Economy`,
          `${client.emoji.giveaway} Giveaway`,
          `${client.emoji.images} Images`,
          `${client.emoji.premium} Premium Commands`,
          `${client.emoji.socials} Socials`,
          `${client.emoji.tools} Tools`,
          `${client.emoji.utils} Utility`,
        ]
          .sort()
          .join("\n"),
        inline: true,
      })
      .setThumbnail(client.user.avatarURL({ size: 512 }))
      .setFooter({ text: `Made with 💖 by @arpandevv`, iconURL: client.user.avatarURL() })
      .setColor(client.config.embedColor);

    const supportButton = new ButtonBuilder().setLabel("Support Server").setStyle(ButtonStyle.Link).setURL("https://discord.gg/5FzKutmwSw");
    const inviteButton = new ButtonBuilder().setLabel("Invite Bot").setStyle(ButtonStyle.Link).setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands`);
    const voteButton = new ButtonBuilder().setLabel("Vote Bot").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1002188910560026634/vote");

    const buttonRow = new ActionRowBuilder().addComponents(supportButton, inviteButton, voteButton);
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [homeEmbed],
      components: [selectRow, buttonRow],
      files: [makeBannerFile()],
    });

    const filter = (i) =>
      (i.isStringSelectMenu() && i.customId === "category-select") ||
      (i.isButton() && i.customId.startsWith("page_"));
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 600000,
    });

    let currentPage = 0;
    const commandsPerPage = 10;

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: "This menu can only be operated by the interaction user.", flags: MessageFlags.Ephemeral });
        return;
      }

      if (i.isStringSelectMenu() && i.values[0] === "home") {
        currentPage = 0;
        await i.update({
          embeds: [homeEmbed],
          components: [selectRow, buttonRow],
          attachments: [],
          files: [makeBannerFile()],
        });
      } else if (i.isStringSelectMenu()) {
        const selectedCategory = i.values[0];
        const categoryCommands = commandsByCategory[selectedCategory];
        currentPage = 0;

        const allCommands = [];
        categoryCommands.forEach((command) => {
          if (command.subcommands.length === 0) {
            allCommands.push({ name: command.name, description: command.description, isSubcommand: false });
          } else {
            command.subcommands.forEach((sub) => {
              allCommands.push({ name: sub.name, description: sub.description, isSubcommand: true, parentName: command.name });
            });
          }
        });

        const totalPages = Math.ceil(allCommands.length / commandsPerPage);
        const startIndex = currentPage * commandsPerPage;
        const endIndex = Math.min(startIndex + commandsPerPage, allCommands.length);
        const commandsToShow = allCommands.slice(startIndex, endIndex);

        const formatted = commandsToShow
          .map((command) => {
            const id = commandIds.get(command.isSubcommand ? command.parentName : command.name) || "0";
            const full = command.isSubcommand ? `</${command.parentName} ${command.name}:${id}>` : `</${command.name}:${id}>`;
            return `${client.emoji.dropdownLine} **${full}** - ${command.description}\n`;
          })
          .join("")
          .trim();

        const categoryEmbed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setAuthor({
            name: `${selectedCategory} Commands`,
            iconURL: client.user.avatarURL(),
            url: `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`,
          })
          .setDescription(formatted)
          .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} • Made with 💖 by @arpandevv`, iconURL: client.user.avatarURL() })
          .setThumbnail(client.user.displayAvatarURL());

        const paginationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`page_first_${selectedCategory}`).setEmoji("⏪").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
          new ButtonBuilder().setCustomId(`page_prev_${selectedCategory}`).setEmoji("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
          new ButtonBuilder().setCustomId(`page_stop`).setEmoji("🛑").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`page_next_${selectedCategory}`).setEmoji("➡️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === totalPages - 1),
          new ButtonBuilder().setCustomId(`page_last_${selectedCategory}`).setEmoji("⏩").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === totalPages - 1)
        );

        await i.update({
          embeds: [categoryEmbed],
          components: [paginationRow, selectRow, buttonRow],
          attachments: [], // ensure banner removed on categories
        });
      } else if (i.isButton()) {
        if (i.customId === "page_stop") {
          await i.message.delete();
          return;
        }

        const selectedCategory = i.customId.split("_").slice(2).join("_") || i.message.embeds[0].author.name.split(" ")[0];
        const categoryCommands = commandsByCategory[selectedCategory];

        const allCommands = [];
        categoryCommands.forEach((command) => {
          if (command.subcommands.length === 0) {
            allCommands.push({ name: command.name, description: command.description, isSubcommand: false });
          } else {
            command.subcommands.forEach((sub) => {
              allCommands.push({ name: sub.name, description: sub.description, isSubcommand: true, parentName: command.name });
            });
          }
        });

        const totalPages = Math.ceil(allCommands.length / commandsPerPage);
        if (i.customId.startsWith("page_first")) currentPage = 0;
        else if (i.customId.startsWith("page_prev")) currentPage = Math.max(currentPage - 1, 0);
        else if (i.customId.startsWith("page_next")) currentPage = Math.min(currentPage + 1, totalPages - 1);
        else if (i.customId.startsWith("page_last")) currentPage = totalPages - 1;

        const startIndex = currentPage * commandsPerPage;
        const endIndex = Math.min(startIndex + commandsPerPage, allCommands.length);
        const commandsToShow = allCommands.slice(startIndex, endIndex);

        const formatted = commandsToShow
          .map((command) => {
            const id = commandIds.get(command.isSubcommand ? command.parentName : command.name) || "0";
            const full = command.isSubcommand ? `</${command.parentName} ${command.name}:${id}>` : `</${command.name}:${id}>`;
            return `${client.emoji.dropdownLine} **${full}** - ${command.description}\n`;
          })
          .join("")
          .trim();

        const categoryEmbed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setAuthor({ name: `${selectedCategory} Commands`, iconURL: client.user.avatarURL(), url: `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands` })
          .setDescription(formatted)
          .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} • Made with 💖 by @arpandevv`, iconURL: client.user.avatarURL() })
          .setThumbnail(client.user.displayAvatarURL());

        const paginationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`page_first_${selectedCategory}`).setEmoji("⏪").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
          new ButtonBuilder().setCustomId(`page_prev_${selectedCategory}`).setEmoji("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
          new ButtonBuilder().setCustomId(`page_stop`).setEmoji("🛑").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`page_next_${selectedCategory}`).setEmoji("➡️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === totalPages - 1),
          new ButtonBuilder().setCustomId(`page_last_${selectedCategory}`).setEmoji("⏩").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === totalPages - 1)
        );

        await i.update({
          embeds: [categoryEmbed],
          components: [paginationRow, selectRow, buttonRow],
          attachments: [], // ensure banner removed on pagination pages too
        });
      }
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [selectRow, buttonRow] });
    });
  },
};
