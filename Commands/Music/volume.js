const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("🔊 Set the volume of the music player.")
        .addIntegerOption(option =>
            option.setName("volume")
                .setDescription("The volume level (0-100)")
                .setRequired(true)),

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

            const volume = interaction.options.getInteger("volume");

            if (volume < 0 || volume > 100) {
                return interaction.reply({
                    content: ":no_entry_sign: **Volume must be between 0 and 100!**",
                    flags: MessageFlags.Ephemeral,
                });
            }

            player.setVolume(volume);

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle(":speaker: Volume Set")
                .setDescription(`**Volume set to ${volume}%**`)
                .setFooter({ text: "Enjoy the music! :notes:" });

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply(":exclamation: **An error occurred while trying to set the volume.**");
        }
    }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */