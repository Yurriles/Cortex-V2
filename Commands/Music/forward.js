const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const formatDuration = require("../../Utils/formatDuration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("forward")
    .setDescription("⏩ Forward the current song by a specified amount of time.")
    .addIntegerOption(option =>
      option.setName("seconds")
        .setDescription("The amount of time to forward the song by.")
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
          content: ":no_entry_sign: **You can't forward the song by a negative amount of time!**",
          flags: MessageFlags.Ephemeral
        });
      }

      const position = player.position + (seconds * 1000);

      if (position > player.queue.current.length) {
        return interaction.reply({
          content: ":no_entry_sign: **You can't forward the song by that much!**",
          flags: MessageFlags.Ephemeral
        });
      }

      player.seek(position);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(":fast_forward: Song Forwarded")
        .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** \n\n**Forwarded by:** \`${interaction.user.username}\``)
        .setFooter({ text: `Forwarded to ${formatDuration(position, true)} :notes:` });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply(":exclamation: **An error occurred while trying to forward the song.**");
    }
  }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */