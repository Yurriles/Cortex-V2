const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const formatDuration = require("../../Utils/formatDuration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("backward")
    .setDescription("⏪ Backward the current song by a specified amount of time.")
    .addIntegerOption(option =>
      option.setName("seconds")
        .setDescription("The amount of time to backward the song by.")
        .setRequired(true)),

  async execute(interaction, client) {
    try {
      const player = client.manager.players.get(interaction.guild.id);

      if (!player) {
        return interaction.reply({
          content: ":no_entry_sign: **There is no song playing right now!**",
          flags: MessageFlags.Ephemeral
        });
      }

      if (!player.queue.current) {
        return interaction.reply({
          content: ":no_entry_sign: **There is no song playing right now!**",
          flags: MessageFlags.Ephemeral
        });
      }

      const seconds = interaction.options.getInteger("seconds");

      if (seconds < 0) {
        return interaction.reply({
          content: ":no_entry_sign: **You can't backward the song by a negative amount of time!**",
          flags: MessageFlags.Ephemeral
        });
      }

      const position = player.position - (seconds * 1000);

      if (position < 0) {
        return interaction.reply({
          content: ":no_entry_sign: **You can't backward the song by that much!**",
          flags: MessageFlags.Ephemeral
        });
      }

      player.seek(position);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(":rewind: Song Backwarded")
        .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** \n\n**Backwarded by:** \`${interaction.user.username}\``)
        .setFooter({ text: `Backwarded to ${formatDuration(position, true)} :notes:` });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply(":exclamation: **An error occurred while trying to backward the song.**");
    }
  }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */