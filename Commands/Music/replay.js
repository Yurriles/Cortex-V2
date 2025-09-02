const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("replay")
        .setDescription("🔁 Replay the current song."),
    
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

            player.seek(0);

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle(":repeat: Song Replayed")
                .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** has been replayed.`)
                .setFooter({ text: "Enjoy the music! :notes:" });

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply(":exclamation: **An error occurred while trying to replay the song.**");
        }
    }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */