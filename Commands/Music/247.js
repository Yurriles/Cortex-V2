const { EmbedBuilder, PermissionsBitField, MessageFlags, SlashCommandBuilder } = require("discord.js");
const db = require("../../Schemas/247");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("247")
        .setDescription("Toggles 24/7 mode."),
    premiumOnly: false,

    async execute(interaction, client) {
        const { channel } = interaction.member.voice;

        if (!channel) {
            return interaction.reply({
                content: ":no_entry_sign: **You need to be in a voice channel to toggle 24/7 mode!**",
                flags: MessageFlags.Ephemeral
            });
        }

        // Check permissions
        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.Connect)) {
            return interaction.reply({
                content: ":lock: **I don't have permission to join your voice channel!**",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.Speak)) {
            return interaction.reply({
                content: ":mute: **I don't have permission to play music in your voice channel!**",
                flags: MessageFlags.Ephemeral
            });
        }

        let data = await db.findOne({ _id: interaction.guild.id });
        const enable = ['enabled', 'activated'];
        const disable = ['disabled', 'deactivated'];

        if (!data) {
            // Create a new entry in the database
            data = new db({
                _id: interaction.guild.id,
                mode: true,
                textChannel: interaction.channel.id,
                voiceChannel: channel.id,
                moderator: interaction.user.id,
                lastUpdated: Math.round(Date.now() / 1000),
            });
            await data.save();

            // Create a player if it doesn't exist
            const player = await client.manager.createPlayer({
                guildId: interaction.guild.id,
                textId: interaction.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });

            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FF00")
                        .setDescription(`24/7 mode is now **${enable[Math.floor(Math.random() * enable.length)]}**.`)
                ]
            });
        } else if (data.mode) {
            // Disable 24/7 mode
            data.mode = false;
            data.moderator = interaction.user.id;
            data.lastUpdated = Math.round(Date.now() / 1000);
            await data.save();

            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setDescription(`24/7 mode is now **${disable[Math.floor(Math.random() * disable.length)]}**.`)
                ]
            });
        } else {
            // Enable 24/7 mode
            data.mode = true;
            data.textChannel = interaction.channel.id;
            data.voiceChannel = channel.id;
            data.moderator = interaction.user.id;
            data.lastUpdated = Math.round(Date.now() / 1000);
            await data.save();

            // Create a player if it doesn't exist
            const player = await client.manager.createPlayer({
                guildId: interaction.guild.id,
                textId: interaction.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });

            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FF00")
                        .setDescription(`24/7 mode is now **${enable[Math.floor(Math.random() * enable.length)]}**.`)
                ]
            });
        }
    }
};