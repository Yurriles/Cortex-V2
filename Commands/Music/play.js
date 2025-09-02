const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder, MessageFlags } = require("discord.js");
const { convertTime } = require("../../Utils/convertTime");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("🎶 Play a song from any supported source.")
        .addStringOption(option =>
            option.setName("search")
                .setDescription("🔍 The song to play.")
                .setRequired(true)
        ),
    
    async execute(interaction, client) {
        try {
            const search = interaction.options.getString("search");
            const { channel } = interaction.member.voice;

            if (!channel) {
                return interaction.reply({
                    content: ":no_entry_sign: **You need to be in a voice channel to play music!**",
                    flags: MessageFlags.Ephemeral
                });
            }

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

            await interaction.reply({ content:`Searching... \`${search}\`` });

            const player = await client.manager.createPlayer({
                guildId: interaction.guild.id,
                textId: interaction.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });
            const res = await player.search(search, { requester: interaction.user });

            if (!res.tracks.length) {
                return interaction.editReply(":x: **No results found!**");
            }

            if (res.type === "PLAYLIST") {
                for (let track of res.tracks) {
                    player.queue.add(track);
                }
                if (!player.playing && !player.paused) {
                    player.play();
                }

                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor) 
                    .setTitle(":notes: Playlist Added")
                    .setDescription(`**[${res.playlistName}](${search})** \n\n**Tracks Queued:** \`${res.tracks.length}\`\n**Total Duration:** \`${convertTime(res.tracks[0].length + player.queue.durationLength, true)}\``)
                    .setFooter({ text: "Enjoy your music! :headphones:" })

                return interaction.editReply({ content: '', embeds: [embed] });
            } else {
                player.queue.add(res.tracks[0]);

                if (!player.playing && !player.paused) {
                    player.play();
                }

                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(":musical_note: Track Queued")
                    .setDescription(`**[${res.tracks[0].title}](${res.tracks[0].uri})** \n\n**Duration:** \`${convertTime(res.tracks[0].length, true)}\``)
                    .setFooter({ text: "Playing now! :notes:" })
                    .setThumbnail(res.tracks[0].thumbnail); 

                return interaction.editReply({ content: `>>> ***Track Added In Queue***:\n**[${res.tracks[0].title}](<${res.tracks[0].uri}>)**`, embeds: [] });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply(":exclamation: **An error occurred while trying to play the song.**");
        }
    }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */