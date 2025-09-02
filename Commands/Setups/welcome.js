const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const WelcomeMessage = require("../../Schemas/welcomeMessageSchema");
const { Card } = require("welcomify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome-message")
    .setDescription("Configure the welcome message system")
    .setDMPermission(false),

  async execute(interaction, client) {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
      interaction.user.id !== process.env.developerId
    ) {
      return await interaction.reply({
        content: "You **do not** have the permission to do that!",
        flags: MessageFlags.Ephemeral,
      });
    }

    let data = await WelcomeMessage.findOne({ guildId: interaction.guild.id });
    let collectedData = {};

    const embed = new EmbedBuilder()
      .setTitle("Welcome Message Configuration Panel")
      .setDescription("```md\n# Welcome Message System\n> Configure a warm welcome for new members!\n```")
      .addFields(
        {
          name: "System Status",
          value: data
            ? "```ansi\n\u001b[32m□ 🟢 SYSTEM ONLINE\n\u001b[32m├───> Features: FULLY AVAILABLE\n\u001b[32m└───> Updates: Real-time Enabled\n```"
            : "```ansi\n\u001b[32m□ 🔴 SYSTEM OFFLINE\n\u001b[32m├───> Features: NOT CONFIGURED\n\u001b[32m└───> Updates: Disabled\n```",
        },
        {
          name: "Active Configuration",
          value: data
            ? "```yml\n" +
              `\"channel\": \"${data.channelId ? "<#" + data.channelId + ">" : "Not Configured"}\"\n` +
              `\"message\": \"${data.message || "Not Configured"}\"\n` +
              `\"embed\": \"${data.isEmbed ? "Yes" : "No"}\"\n` +
              `\"welcome-image\": \"${data.isImage ? "Yes" : "No"}\"\n` +
              `\"author\": \"${data.author || "Not Set"}\"\n` +
              `\"title\": \"${data.title || "Not Set"}\"\n` +
              `\"description\": \"${data.description || "Not Set"}\"\n` +
              `\"color\": \"${data.color || "Not Set"}\"\n` +
              `\"thumbnail\": \"${data.thumbnail || "Not Set"}\"\n` +
              `\"image\": \"${data.embedImage || "Not Set"}\"\n` +
              `\"footer\": \"${data.footer || "Not Set"}\"\n` +
              `\"timestamp\": \"${data.timestamp ? "Yes" : "No"}\"\n` +
              `\"image-bg\": \"${data.image || "Not Set"}\"\n` +
              "```"
            : "```yml\n" +
              `\"channel\": \"Not Configured\"\n` +
              `\"message\": \"Not Configured\"\n` +
              `\"embed\": \"Not Configured\"\n` +
              `\"welcome-image\": \"Not Configured\"\n` +
              `\"author\": \"Not Set\"\n` +
              `\"title\": \"Not Set\"\n` +
              `\"description\": \"Not Set\"\n` +
              `\"color\": \"Not Set\"\n` +
              `\"thumbnail\": \"Not Set\"\n` +
              `\"image\": \"Not Set\"\n` +
              `\"footer\": \"Not Set\"\n` +
              `\"timestamp\": \"Not Set\"\n` +
              `\"image-bg\": \"Not Set\"\n` +
              "```",
        }
      )
      .setColor("Green")
      .setTimestamp()
      .setFooter({ text: `Today at ${new Date().toLocaleTimeString()}` });

    const mainButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("set_channel")
        .setLabel("Set Channel")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!data),
      new ButtonBuilder()
        .setCustomId("set_message")
        .setLabel("Set Message")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!data),
      new ButtonBuilder()
        .setCustomId("set_embed")
        .setLabel("Set Embed")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data),
      new ButtonBuilder()
        .setCustomId("set_image")
        .setLabel("Set Welcome Image")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data),
      new ButtonBuilder()
        .setCustomId("set_image_bg")
        .setLabel("Set Image BG")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isImage)
    );

    const embedButtons1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("set_author")
        .setLabel("Set Author")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("set_title")
        .setLabel("Set Title")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("set_description")
        .setLabel("Set Description")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("set_color")
        .setLabel("Set Color")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("set_thumbnail")
        .setLabel("Set Thumbnail")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed)
    );

    const embedButtons2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("set_embed_image") // renamed to avoid duplicate custom_id
        .setLabel("Set Embed Image")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("set_footer")
        .setLabel("Set Footer")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("set_timestamp")
        .setLabel("Set Timestamp")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!data || !collectedData.isEmbed),
      new ButtonBuilder()
        .setCustomId("disable_welcome")
        .setLabel("Disable")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!data),
      new ButtonBuilder()
        .setCustomId("done")
        .setLabel("Done")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!data)
    );

    const controlButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("test_welcome")
        .setLabel("Test")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!data)
    );

    const res = await interaction.reply({
      embeds: [embed],
      components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
      withResponse: true
    });

    const message = res.resource.message;


    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 1200000000,
    });

    let setupStage = null;

    const updateDoneButton = () => {
      embedButtons2.components[4].setDisabled(!(collectedData.channel && (collectedData.message || collectedData.isImage)));
    };

    const updateConfigurationField = () => {
      embed.spliceFields(1, 1, {
        name: "Active Configuration",
        value:
          "```yml\n" +
          `\"channel\": \"${collectedData.channel ? "<#" + collectedData.channel + ">" : "Not Configured"}\"\n` +
          `\"message\": \"${collectedData.message || "Not Configured"}\"\n` +
          `\"embed\": \"${collectedData.isEmbed !== undefined ? (collectedData.isEmbed ? "Yes" : "No") : "Not Configured"}\"\n` +
          `\"welcome-image\": \"${collectedData.isImage !== undefined ? (collectedData.isImage ? "Yes" : "No") : "Not Configured"}\"\n` +
          `\"author\": \"${collectedData.author || "Not Set"}\"\n` +
          `\"title\": \"${collectedData.title || "Not Set"}\"\n` +
          `\"description\": \"${collectedData.description || "Not Set"}\"\n` +
          `\"color\": \"${collectedData.color || "Not Set"}\"\n` +
          `\"thumbnail\": \"${collectedData.thumbnail || "Not Set"}\"\n` +
          `\"image\": \"${collectedData.embedImage || "Not Set"}\"\n` +
          `\"footer\": \"${collectedData.footer || "Not Set"}\"\n` +
          `\"timestamp\": \"${collectedData.timestamp !== undefined ? (collectedData.timestamp ? "Yes" : "No") : "Not Set"}\"\n` +
          `\"image-bg\": \"${collectedData.image || "Not Set"}\"\n` +
          "```",
      });
    };

    collector.on("collect", async (i) => {
      if (i.customId === "set_channel") {
        setupStage = "channel";
        await i.reply({
          content: "Please mention the channel for welcome messages.",
          flags: MessageFlags.Ephemeral,
        });

        const channelFilter = (m) => m.author.id === i.user.id;
        const channelCollector = i.channel.createMessageCollector({
          filter: channelFilter,
          max: 1,
          time: 30000,
        });

        channelCollector.on("collect", async (m) => {
          const channel = m.mentions.channels.first();
          if (!channel || ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
            await i.followUp({
              content: "Invalid channel! Please mention a text or announcement channel.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.channel = channel.id;
          mainButtons.components[0].setDisabled(true);
          updateDoneButton();
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Channel set to ${channel}.`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        channelCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_message") {
        setupStage = "message";
        await i.reply({
          content: "Please send the welcome message (max 1000 characters). Use {user} to mention the user.",
          flags: MessageFlags.Ephemeral,
        });

        const messageFilter = (m) => m.author.id === i.user.id;
        const messageCollector = i.channel.createMessageCollector({
          filter: messageFilter,
          max: 1,
          time: 30000,
        });

        messageCollector.on("collect", async (m) => {
          const messageContent = m.content;
          if (messageContent.length > 1000) {
            await i.followUp({
              content: "Message is too long! Please keep it under 1000 characters.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.message = messageContent;
          mainButtons.components[1].setDisabled(true);
          updateDoneButton();
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Message set to: "${messageContent}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        messageCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_embed") {
        setupStage = "embed";
        await i.reply({
          content: "Do you want to send the welcome message as an embed? Reply with 'yes' or 'no'.",
          flags: MessageFlags.Ephemeral,
        });

        const embedFilter = (m) => m.author.id === i.user.id;
        const embedCollector = i.channel.createMessageCollector({
          filter: embedFilter,
          max: 1,
          time: 30000,
        });

        embedCollector.on("collect", async (m) => {
          const response = m.content.toLowerCase();
          if (!["yes", "no"].includes(response)) {
            await i.followUp({
              content: "Invalid response! Please reply with 'yes' or 'no'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.isEmbed = response === "yes";
          mainButtons.components[2].setDisabled(true);
          embedButtons1.components[0].setDisabled(!collectedData.isEmbed); // Author
          embedButtons1.components[1].setDisabled(!collectedData.isEmbed); // Title
          embedButtons1.components[2].setDisabled(!collectedData.isEmbed); // Description
          embedButtons1.components[3].setDisabled(!collectedData.isEmbed); // Color
          embedButtons1.components[4].setDisabled(!collectedData.isEmbed); // Thumbnail
          embedButtons2.components[0].setDisabled(!collectedData.isEmbed); // Embed Image
          embedButtons2.components[1].setDisabled(!collectedData.isEmbed); // Footer
          embedButtons2.components[2].setDisabled(!collectedData.isEmbed); // Timestamp
          updateDoneButton();
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Embed set to: ${response === "yes" ? "Yes" : "No"}.`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        embedCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_image") {
        setupStage = "image";
        await i.reply({
          content: "Do you want to use a welcome image? Reply with 'yes' or 'no'.",
          flags: MessageFlags.Ephemeral,
        });

        const imageFilter = (m) => m.author.id === i.user.id;
        const imageCollector = i.channel.createMessageCollector({
          filter: imageFilter,
          max: 1,
          time: 30000,
        });

        imageCollector.on("collect", async (m) => {
          const response = m.content.toLowerCase();
          if (!["yes", "no"].includes(response)) {
            await i.followUp({
              content: "Invalid response! Please reply with 'yes' or 'no'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.isImage = response === "yes";
          mainButtons.components[3].setDisabled(true);
          mainButtons.components[4].setDisabled(!collectedData.isImage); // Image BG
          updateDoneButton();
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Welcome Image set to: ${response === "yes" ? "Yes" : "No"}.`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        imageCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_image_bg") {
        setupStage = "image_bg";
        await i.reply({
          content: "Please provide a URL (PNG, JPG, JPEG) or upload an image for the welcome image background. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const imageBgFilter = (m) => m.author.id === i.user.id;
        const imageBgCollector = i.channel.createMessageCollector({
          filter: imageBgFilter,
          max: 1,
          time: 30000,
        });

        imageBgCollector.on("collect", async (m) => {
          let url = m.content;
          if (m.attachments.size > 0) {
            const attachment = m.attachments.first();
            if (attachment.contentType?.match(/image\/(png|jpeg|jpg)/i)) {
              url = attachment.url;
            } else {
              await i.followUp({
                content: "Invalid image format! Please upload a PNG, JPG, or JPEG or provide a valid URL.",
                flags: MessageFlags.Ephemeral,
              });
              setupStage = null;
              return;
            }
          } else if (url.toLowerCase() !== "none" && !url.match(/^https?:\/\/.+\.(png|jpg|jpeg)$/i)) {
            await i.followUp({
              content: "Invalid image URL! Please provide a valid PNG, JPG, or JPEG URL or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.image = url.toLowerCase() === "none" ? "" : url;
          mainButtons.components[4].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Image background set to: "${collectedData.image || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        imageBgCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_author") {
        setupStage = "author";
        await i.reply({
          content: "Please provide the author text for the embed (max 256 characters). Use {user} to mention the user. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const authorFilter = (m) => m.author.id === i.user.id;
        const authorCollector = i.channel.createMessageCollector({
          filter: authorFilter,
          max: 1,
          time: 30000,
        });

        authorCollector.on("collect", async (m) => {
          const authorText = m.content;
          if (authorText.length > 256 && authorText.toLowerCase() !== "none") {
            await i.followUp({
              content: "Author text is too long! Please keep it under 256 characters or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.author = authorText.toLowerCase() === "none" ? "" : authorText;
          embedButtons1.components[0].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Author set to: "${collectedData.author || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        authorCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_title") {
        setupStage = "title";
        await i.reply({
          content: "Please provide the title text for the embed (max 256 characters). Use {user} to mention the user. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const titleFilter = (m) => m.author.id === i.user.id;
        const titleCollector = i.channel.createMessageCollector({
          filter: titleFilter,
          max: 1,
          time: 30000,
        });

        titleCollector.on("collect", async (m) => {
          const titleText = m.content;
          if (titleText.length > 256 && titleText.toLowerCase() !== "none") {
            await i.followUp({
              content: "Title text is too long! Please keep it under 256 characters or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.title = titleText.toLowerCase() === "none" ? "" : titleText;
          embedButtons1.components[1].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Title set to: "${collectedData.title || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        titleCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_description") {
        setupStage = "description";
        await i.reply({
          content: "Please provide the description text for the embed (max 2048 characters). Use {user} to mention the user. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const descFilter = (m) => m.author.id === i.user.id;
        const descCollector = i.channel.createMessageCollector({
          filter: descFilter,
          max: 1,
          time: 30000,
        });

        descCollector.on("collect", async (m) => {
          const descText = m.content;
          if (descText.length > 2048 && descText.toLowerCase() !== "none") {
            await i.followUp({
              content: "Description text is too long! Please keep it under 2048 characters or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.description = descText.toLowerCase() === "none" ? "" : descText;
          embedButtons1.components[2].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Description set to: "${collectedData.description || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        descCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_color") {
        setupStage = "color";
        await i.reply({
          content: "Please provide a hex color code (e.g., #FF0000) for the embed. Reply 'none' to use default.",
          flags: MessageFlags.Ephemeral,
        });

        const colorFilter = (m) => m.author.id === i.user.id;
        const colorCollector = i.channel.createMessageCollector({
          filter: colorFilter,
          max: 1,
          time: 30000,
        });

        colorCollector.on("collect", async (m) => {
          const colorText = m.content;
          if (colorText.toLowerCase() !== "none" && !colorText.match(/^#[0-9A-Fa-f]{6}$/i)) {
            await i.followUp({
              content: "Invalid hex color code! Please provide a valid hex code (e.g., #FF0000) or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.color = colorText.toLowerCase() === "none" ? "" : colorText;
          embedButtons1.components[3].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Color set to: "${collectedData.color || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        colorCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_thumbnail") {
        setupStage = "thumbnail";
        await i.reply({
          content: "Please provide a URL (PNG, JPG, JPEG) or upload an image for the embed thumbnail. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const thumbnailFilter = (m) => m.author.id === i.user.id;
        const thumbnailCollector = i.channel.createMessageCollector({
          filter: thumbnailFilter,
          max: 1,
          time: 30000,
        });

        thumbnailCollector.on("collect", async (m) => {
          let url = m.content;
          if (m.attachments.size > 0) {
            const attachment = m.attachments.first();
            if (attachment.contentType?.match(/image\/(png|jpeg|jpg)/i)) {
              url = attachment.url;
            } else {
              await i.followUp({
                content: "Invalid image format! Please upload a PNG, JPG, or JPEG or provide a valid URL.",
                flags: MessageFlags.Ephemeral,
              });
              setupStage = null;
              return;
            }
          } else if (url.toLowerCase() !== "none" && !url.match(/^https?:\/\/.+\.(png|jpg|jpeg)$/i)) {
            await i.followUp({
              content: "Invalid image URL! Please provide a valid PNG, JPG, or JPEG URL or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.thumbnail = url.toLowerCase() === "none" ? "" : url;
          embedButtons1.components[4].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Thumbnail set to: "${collectedData.thumbnail || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        thumbnailCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_embed_image") {
        setupStage = "embed_image";
        await i.reply({
          content: "Please provide a URL (PNG, JPG, JPEG) or upload an image for the embed image. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const embedImageFilter = (m) => m.author.id === i.user.id;
        const embedImageCollector = i.channel.createMessageCollector({
          filter: embedImageFilter,
          max: 1,
          time: 30000,
        });

        embedImageCollector.on("collect", async (m) => {
          let url = m.content;
          if (m.attachments.size > 0) {
            const attachment = m.attachments.first();
            if (attachment.contentType?.match(/image\/(png|jpeg|jpg)/i)) {
              url = attachment.url;
            } else {
              await i.followUp({
                content: "Invalid image format! Please upload a PNG, JPG, or JPEG or provide a valid URL.",
                flags: MessageFlags.Ephemeral,
              });
              setupStage = null;
              return;
            }
          } else if (url.toLowerCase() !== "none" && !url.match(/^https?:\/\/.+\.(png|jpg|jpeg)$/i)) {
            await i.followUp({
              content: "Invalid image URL! Please provide a valid PNG, JPG, or JPEG URL or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.embedImage = url.toLowerCase() === "none" ? "" : url;
          embedButtons2.components[0].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Embed Image set to: "${collectedData.embedImage || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        embedImageCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_footer") {
        setupStage = "footer";
        await i.reply({
          content: "Please provide the footer text for the embed (max 2048 characters). Use {user} to mention the user. Reply 'none' to skip.",
          flags: MessageFlags.Ephemeral,
        });

        const footerFilter = (m) => m.author.id === i.user.id;
        const footerCollector = i.channel.createMessageCollector({
          filter: footerFilter,
          max: 1,
          time: 30000,
        });

        footerCollector.on("collect", async (m) => {
          const footerText = m.content;
          if (footerText.length > 2048 && footerText.toLowerCase() !== "none") {
            await i.followUp({
              content: "Footer text is too long! Please keep it under 2048 characters or reply 'none'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.footer = footerText.toLowerCase() === "none" ? "" : footerText;
          embedButtons2.components[1].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Footer set to: "${collectedData.footer || "Not Set"}".`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        footerCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "set_timestamp") {
        setupStage = "timestamp";
        await i.reply({
          content: "Do you want to include a timestamp in the embed? Reply with 'yes' or 'no'.",
          flags: MessageFlags.Ephemeral,
        });

        const timestampFilter = (m) => m.author.id === i.user.id;
        const timestampCollector = i.channel.createMessageCollector({
          filter: timestampFilter,
          max: 1,
          time: 30000,
        });

        timestampCollector.on("collect", async (m) => {
          const response = m.content.toLowerCase();
          if (!["yes", "no"].includes(response)) {
            await i.followUp({
              content: "Invalid response! Please reply with 'yes' or 'no'.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
            return;
          }

          collectedData.timestamp = response === "yes";
          embedButtons2.components[2].setDisabled(true);
          updateConfigurationField();

          await i.message.edit({
            embeds: [embed],
            components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
          });

          await i.followUp({
            content: `Timestamp set to: ${response === "yes" ? "Yes" : "No"}.`,
            flags: MessageFlags.Ephemeral,
          });
          setupStage = null;
        });

        timestampCollector.on("end", async (collected) => {
          if (collected.size === 0) {
            await i.deferUpdate();
            await i.followUp({
              content: "You did not respond in time. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
            setupStage = null;
          }
        });
      } else if (i.customId === "disable_welcome") {
        if (!data) {
          await i.reply({
            content: "The welcome message system is not configured.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await WelcomeMessage.deleteOne({ guildId: i.guild.id });
        data = null;
        collectedData = {};

        embed.spliceFields(
          0,
          2,
          {
            name: "System Status",
            value:
              "```ansi\n\u001b[32m□ 🔴 SYSTEM OFFLINE\n\u001b[32m├───> Features: NOT CONFIGURED\n\u001b[32m└───> Updates: Disabled\n```",
          },
          {
            name: "Active Configuration",
            value:
              "```yml\n" +
              `\"channel\": \"Not Configured\"\n` +
              `\"message\": \"Not Configured\"\n` +
              `\"embed\": \"Not Configured\"\n` +
              `\"welcome-image\": \"Not Configured\"\n` +
              `\"author\": \"Not Set\"\n` +
              `\"title\": \"Not Set\"\n` +
              `\"description\": \"Not Set\"\n` +
              `\"color\": \"Not Set\"\n` +
              `\"thumbnail\": \"Not Set\"\n` +
              `\"image\": \"Not Set\"\n` +
              `\"footer\": \"Not Set\"\n` +
              `\"timestamp\": \"Not Set\"\n` +
              `\"image-bg\": \"Not Set\"\n` +
              "```",
          }
        );

        mainButtons.components.forEach((c) => c.setDisabled(false));
        embedButtons1.components.forEach((c) => c.setDisabled(true));
        embedButtons2.components[0].setDisabled(true); // Embed Image
        embedButtons2.components[1].setDisabled(true); // Footer
        embedButtons2.components[2].setDisabled(true); // Timestamp
        embedButtons2.components[3].setDisabled(true); // Disable
        embedButtons2.components[4].setDisabled(true); // Done
        controlButtons.components[0].setDisabled(true); // Test

        await i.update({
          embeds: [embed],
          components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
        });

        await i.followUp({
          content: "Welcome message system has been disabled.",
          flags: MessageFlags.Ephemeral,
        });
      } else if (i.customId === "done") {
        if (!collectedData.channel || (!collectedData.message && !collectedData.isImage)) {
          await i.reply({
            content: "Please set the channel and at least a message or welcome image before finalizing.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await WelcomeMessage.findOneAndUpdate(
          { guildId: i.guild.id },
          {
            guildId: i.guild.id,
            channelId: collectedData.channel,
            message: collectedData.message || "",
            isEmbed: collectedData.isEmbed !== undefined ? collectedData.isEmbed : false,
            isImage: collectedData.isImage || false,
            author: collectedData.author || "",
            title: collectedData.title || "",
            description: collectedData.description || "",
            color: collectedData.color || "",
            thumbnail: collectedData.thumbnail || "",
            embedImage: collectedData.embedImage || "",
            footer: collectedData.footer || "",
            timestamp: collectedData.timestamp !== undefined ? collectedData.timestamp : false,
            image: collectedData.image || "",
          },
          { upsert: true }
        );

        data = await WelcomeMessage.findOne({ guildId: i.guild.id });

        embed.spliceFields(
          0,
          2,
          {
            name: "System Status",
            value:
              "```ansi\n\u001b[32m□ 🟢 SYSTEM ONLINE\n\u001b[32m├───> Features: FULLY AVAILABLE\n\u001b[32m└───> Updates: Real-time Enabled\n```",
          },
          {
            name: "Active Configuration",
            value:
              "```yml\n" +
              `\"channel\": \"<#${collectedData.channel}>\"\n` + // fixed rendering
              `\"message\": \"${collectedData.message || "Not Configured"}\"\n` +
              `\"embed\": \"${collectedData.isEmbed !== undefined ? (collectedData.isEmbed ? "Yes" : "No") : "No"}\"\n` +
              `\"welcome-image\": \"${collectedData.isImage ? "Yes" : "No"}\"\n` +
              `\"author\": \"${collectedData.author || "Not Set"}\"\n` +
              `\"title\": \"${collectedData.title || "Not Set"}\"\n` +
              `\"description\": \"${collectedData.description || "Not Set"}\"\n` +
              `\"color\": \"${collectedData.color || "Not Set"}\"\n` +
              `\"thumbnail\": \"${collectedData.thumbnail || "Not Set"}\"\n` +
              `\"image\": \"${collectedData.embedImage || "Not Set"}\"\n` +
              `\"footer\": \"${collectedData.footer || "Not Set"}\"\n` +
              `\"timestamp\": \"${collectedData.timestamp !== undefined ? (collectedData.timestamp ? "Yes" : "No") : "No"}\"\n` +
              `\"image-bg\": \"${collectedData.image || "Not Set"}\"\n` +
              "```",
          }
        );

        mainButtons.components.forEach((c) => c.setDisabled(true));
        embedButtons1.components.forEach((c) => c.setDisabled(true));
        embedButtons2.components[0].setDisabled(true); // Embed Image
        embedButtons2.components[1].setDisabled(true); // Footer
        embedButtons2.components[2].setDisabled(true); // Timestamp
        embedButtons2.components[3].setDisabled(false); // Disable
        embedButtons2.components[4].setDisabled(true); // Done
        controlButtons.components[0].setDisabled(false); // Test

        await i.message.edit({
          embeds: [embed],
          components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
        });

        await i.followUp({
          content: `Welcome message system set up successfully! Messages will be sent to <#${collectedData.channel}>. You can now test the configuration using the Test button.`,
          flags: MessageFlags.Ephemeral,
        });
      } else if (i.customId === "test_welcome") {
        await i.deferReply({ ephemeral: true });

        data = await WelcomeMessage.findOne({ guildId: i.guild.id });

        if (!data) {
          await i.followUp({
            content: "The welcome message system is not configured.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const image = data.image || "https://i.imgur.com/GMuBRQo.jpeg";
        const author = data.author ? data.author.replace("{user}", i.user.toString()) : "";
        const title = data.title ? data.title.replace("{user}", i.user.toString()) : "";
        const description = data.description ? data.description.replace("{user}", i.user.toString()) : "";
        const color = data.color || "Random";
        const thumbnail = data.thumbnail || "";
        const embedImage = data.embedImage || "";
        const footer = data.footer ? data.footer.replace("{user}", i.user.toString()) : "";
        const timestamp = data.timestamp || false;
        const isImage = data.isImage || false;
        const isEmbed = data.isEmbed || false;
        const messageContent =
          data.message && data.message.trim() !== "" ? data.message.replace("{user}", i.user.toString()) : null;

        const channel = i.guild.channels.cache.get(data.channelId);
        if (!channel || !channel.permissionsFor(i.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
          await i.followUp({
            content:
              "The configured channel was not found or I lack permission to send messages there. Please reconfigure the welcome system.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const sendOptions = {};

        if (isImage) {
          const card = new Card()
            .setTitle("Welcome")
            .setName(i.user.username)
            .setAvatar(i.user.displayAvatarURL({ format: "png", dynamic: true }))
            .setMessage(`You are the ${i.guild.memberCount}th to join`)
            .setBackground(image)
            .setColor("00FF38");
          const cardOutput = await card.build();
          sendOptions.files = [{ attachment: cardOutput, name: "welcome-card.png" }];
        }

        if (isEmbed) {
          const out = new EmbedBuilder().setColor(color);
          if (author && author.trim() !== "") out.setAuthor({ name: author });
          if (title && title.trim() !== "") out.setTitle(title);
          if (description && description.trim() !== "") out.setDescription(description);
          if (thumbnail && thumbnail.trim() !== "") out.setThumbnail(thumbnail);
          if (embedImage && embedImage.trim() !== "") out.setImage(embedImage);
          if (footer && footer.trim() !== "") out.setFooter({ text: footer });
          if (timestamp) out.setTimestamp();
          sendOptions.embeds = [out];
        }

        if (messageContent) {
          sendOptions.content = messageContent;
        }

        if (sendOptions.content || sendOptions.embeds || sendOptions.files) {
          try {
            await channel.send(sendOptions);
            await i.followUp({
              content: `Test welcome message sent to <#${data.channelId}>!`,
              flags: MessageFlags.Ephemeral,
            });
          } catch (error) {
            await i.followUp({
              content:
                "Failed to send the test message. Please ensure the bot has permission to send messages in the configured channel.",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else {
          await i.followUp({
            content: "No message, embed, or image is configured to send.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    });

    collector.on("end", async () => {
      mainButtons.components.forEach((component) => component.setDisabled(true));
      embedButtons1.components.forEach((component) => component.setDisabled(true));
      embedButtons2.components.forEach((component) => component.setDisabled(true));
      controlButtons.components.forEach((component) => component.setDisabled(true));
      try {
        await message.edit({
          content: "The welcome message configuration panel has timed out.",
          embeds: [embed],
          components: [mainButtons, embedButtons1, embedButtons2, controlButtons],
        });
      } catch (error) {
        console.error("Failed to edit message on collector end:", error);
      }
    });
  },
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */
