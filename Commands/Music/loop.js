const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Toggle track/queue loop.")
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("Choose the loop mode.")
                .addChoices(
                    { name: "Track", value: "track" },
                    { name: "Queue", value: "queue" },
                    { name: "Off", value: "off" }
                )
                .setRequired(true)
        ),
    premiumOnly: false,

    async execute(interaction, client) {
        const mode = interaction.options.getString("mode");
        const player = client.manager.players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply({
                content: ":x: **There is no music currently playing!**",
                flags: MessageFlags.Ephemeral
            });
        }

        const enable = ['enabled', 'activated'];
        const disable = ['disabled', 'deactivated'];

        let response;
        if (mode === 'track') {
            if (player.loop !== 'track') {
                player.setLoop('track');
                response = `Looping the current song **${enable[Math.floor(Math.random() * enable.length)]}**.`;
            } else {
                player.setLoop('none');
                response = `Looping the current song **${disable[Math.floor(Math.random() * disable.length)]}**.`;
            }
        } else if (mode === 'queue') {
            if (player.loop !== 'queue') {
                player.setLoop('queue');
                response = `Looping the queue **${enable[Math.floor(Math.random() * enable.length)]}**.`;
            } else {
                player.setLoop('none');
                response = `Looping the queue **${disable[Math.floor(Math.random() * disable.length)]}**.`;
            }
        } else if (mode === 'off') {
            player.setLoop('none');
            response = `Looping is now **${disable[Math.floor(Math.random() * disable.length)]}**.`;
        } else {
            return interaction.reply({
                content: ":x: **Please provide a valid sub command.**",
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(response)
            ]
        });
    }
};
