const { Events, EmbedBuilder, PermissionsBitField } = require("discord.js");
const WelcomeMessage = require("../../Schemas/welcomeMessageSchema");
const { Card } = require("welcomify");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const data = await WelcomeMessage.findOne({ guildId: member.guild.id });
    if (!data) return;

    const channel = member.guild.channels.cache.get(data.channelId);
    if (
      !channel ||
      !channel
        .permissionsFor(member.guild.members.me)
        ?.has(PermissionsBitField.Flags.SendMessages)
    ) {
      return;
    }

    const image = data.image || "https://i.imgur.com/GMuBRQo.jpeg";
    const author = data.author ? data.author.replace("{user}", member.user.toString()) : "";
    const title = data.title ? data.title.replace("{user}", member.user.toString()) : "";
    const description = data.description ? data.description.replace("{user}", member.user.toString()) : "";
    const color = data.color || "Random";
    const thumbnail = data.thumbnail || "";
    const embedImage = data.embedImage || "";
    const footer = data.footer ? data.footer.replace("{user}", member.user.toString()) : "";
    const timestamp = !!data.timestamp;
    const isImage = !!data.isImage;
    const isEmbed = !!data.isEmbed;

    const messageContent =
      data.message && data.message.trim() !== ""
        ? data.message.replace("{user}", member.user.toString())
        : null;

    const sendOptions = {};

    if (isImage) {
      const card = new Card()
        .setTitle("Welcome")
        .setName(member.user.username)
        .setAvatar(member.user.displayAvatarURL({ format: "png", dynamic: true }))
        .setMessage(`You are the ${member.guild.memberCount}th to join`)
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
      } catch (e) {
        console.error("Failed to send welcome message:", e);
      }
    }
  },
};
