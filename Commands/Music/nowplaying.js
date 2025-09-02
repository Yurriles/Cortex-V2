const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");
const formatDuration = require("../../Utils/formatDuration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("🗒️ View the currently playing song."),

  async execute(interaction, client) {
    try {
      const player = client.manager.players.get(interaction.guild.id);

      if (!player) {
        return interaction.reply({
          content: ":no_entry_sign: **There is no song playing right now!**",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!player.queue.current) {
        return interaction.reply({
          content: ":no_entry_sign: **There is no song playing right now!**",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(":musical_note: Now Playing")
        .setDescription(
          `**[${player.queue.current.title}](${player.queue.current.uri})**`
        )
        .addFields(
          { name: "Author:", value: player.queue.current.author, inline: true },
          {
            name: "Source:",
            value: `${player.queue.current.sourceName || "unknown"}`,
            inline: true,
          },
          { name: "Requested By:", value: `${player.queue.current.requester.tag}`, inline: true }
        )
        .setFooter({ text: "Enjoy the music!" });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply(
        ":exclamation: **An error occurred while trying to view the currently playing song.**"
      );
    }
  },
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */