const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("🔀 Shuffle the music queue."),
    
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

            player.queue.shuffle();

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle(":twisted_rightwards_arrows: Queue Shuffled")
                .setDescription("The music queue has been shuffled.")
                .setFooter({ text: "Enjoy the music! :notes:" });

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply(":exclamation: **An error occurred while trying to shuffle the queue.**");
        }
    }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */