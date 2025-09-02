const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const TRACKS_PER_PAGE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("View the music queue."),

  async execute(interaction, client) {
    try {
      const player = client.manager.players.get(interaction.guild.id);

      if (!player) {
        return interaction.reply({
          content: ":no_entry_sign: **There is no song playing right now!**",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (player.queue.size === 0) {
        return interaction.reply({
          content: ":no_entry_sign: **The queue is empty!**",
          flags: MessageFlags.Ephemeral,
        });
      }

      const totalTracks = player.queue.size;
      const totalPages = Math.ceil(totalTracks / TRACKS_PER_PAGE);
      let currentPage = 0;

      const createEmbed = (page) => {
        const start = page * TRACKS_PER_PAGE;
        const end = Math.min(start + TRACKS_PER_PAGE, totalTracks);
        const queue = player.queue
          .slice(start, end)
          .map((track, index) => {
            return `**${start + index + 1}.** [${track.title}](${
              track.uri
            }) - **${track.author}**`;
          })
          .join("\n");

        return new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle("📃 Music Queue")
          .setDescription(queue || "No tracks in this page.")
          .setFooter({
            text: `Page ${
              page + 1
            } of ${totalPages} | Total tracks: ${totalTracks}`,
          });
      };

      const embed = createEmbed(currentPage);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1)
      );

      const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        withResponse: true
      });

      const filter = (buttonInteraction) => {
        return buttonInteraction.user.id === interaction.user.id;
      };

      const collector = message.resource.message.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (buttonInteraction) => {
        if (buttonInteraction.customId === "prev") {
          currentPage--;
        } else if (buttonInteraction.customId === "next") {
          currentPage++;
        }

        const newEmbed = createEmbed(currentPage);
        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [row],
        });

        // Update button states
        row.components[0].setDisabled(currentPage === 0); // Previous button
        row.components[1].setDisabled(currentPage === totalPages - 1); // Next button
      });

      collector.on("end", () => {
        row.components.forEach((button) => button.setDisabled(true));
        message.edit({ components: [row] });
      });
    } catch (error) {
      console.error(error);
      return interaction.reply(
        ":exclamation: **An error occurred while trying to view the queue.**"
      );
    }
  },
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */
