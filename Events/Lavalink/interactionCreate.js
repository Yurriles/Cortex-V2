const { InteractionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, MessageFlags } = require("discord.js");
const { convertTime } = require("../../Utils/convertTime");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (interaction.type !== InteractionType.MessageComponent || !interaction.isButton()) return;

        const musicPanelCustomIds = [
            "playpause", "skip", "stop", "replay", "shuffle",
            "forward", "backward", "volplus", "volminus"
        ];

        if (!musicPanelCustomIds.includes(interaction.customId)) return;

        const guildId = interaction.guild.id;
        const panelData = await client.musicPanels.get(guildId);
        if (!panelData) return;

        const player = client.manager.players.get(guildId);
        if (!player) return;

        const panelMessage = await interaction.channel.messages.fetch(panelData.messageId).catch(() => null);
        if (!panelMessage) return;

        const customId = interaction.customId;
        console.log(`[Button Interaction] ${interaction.user.tag} clicked ${customId} in guild ${guildId}`);

        await interaction.deferUpdate();

        try {
            let feedback = "";
            let shouldUpdatePanel = true;
            
            switch (customId) {
                case "playpause":
                    if (player) {
                        console.log(`[Button] Play/Pause - Current state: paused=${player.paused}, playing=${player.playing}, state=${player.state}, connected=${player.connected}`);
                        if (player.paused) {
                            await player.pause(false);
                            feedback = "▶️ **Resumed playback!**";
                        } else {
                            await player.pause(true);
                            feedback = "⏸️ **Paused playback!**";
                        }
                    }
                    break;
                case "skip":
                    if (player && (player.queue.size > 0 || player.queue.current)) {
                        try {
                            await player.skip();
                            feedback = "⏭️ **Skipped to next track!**";
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        } catch (skipError) {
                            console.error(`[Button Error] Skip failed: ${skipError}`);
                            feedback = "❌ **Failed to skip track!**";
                        }
                    } else {
                        feedback = "❌ **No tracks to skip!**";
                    }
                    break;
                case "stop":
                    if (player) {
                        try {
                            await player.destroy();
                            feedback = "⏹️ **Stopped playback and disconnected!**";
                            shouldUpdatePanel = true;
                        } catch (stopError) {
                            console.error(`[Button Error] Stop failed: ${stopError}`);
                            feedback = "❌ **Failed to stop player!**";
                        }
                    }
                    break;
                case "replay":
                    if (player.queue.current) {
                        player.queue.unshift(player.queue.current);
                        await player.play();
                        feedback = "🔄 **Replayed current track!**";
                    }
                    break;
                case "shuffle":
                    if (player.queue.size > 1) {
                        player.queue.shuffle();
                        feedback = "🔀 **Shuffled queue!**";
                    }
                    break;
                case "forward":
                    const position = player.position + 10000; // 10 seconds in ms
                    await player.seek(Math.min(position, player.queue.current.length));
                    feedback = "⏩ **Forwarded 10 seconds!**";
                    break;
                case "backward":
                    const newPosition = player.position - 10000; // 10 seconds in ms
                    await player.seek(Math.max(newPosition, 0));
                    feedback = "⏪ **Rewound 10 seconds!**";
                    break;
                case "volplus":
                    const newVolume = Math.min(player.volume + 10, 150);
                    await player.setVolume(newVolume);
                    feedback = "🔊 **Volume increased to " + newVolume + "%!**";
                    break;
                case "volminus":
                    const reducedVolume = Math.max(player.volume - 10, 0);
                    await player.setVolume(reducedVolume);
                    feedback = "🔉 **Volume decreased to " + reducedVolume + "%!**";
                    break;
                default:
                    return;
            }

            if (feedback) {
                try {
                    await interaction.followUp({ content: feedback, flags: MessageFlags.Ephemeral });
                } catch (followUpError) {
                    console.error(`[Button Error] Failed to send feedback: ${followUpError}`);
                }
            }

            if (panelMessage && shouldUpdatePanel) {
                try {
                    const currentPlayer = client.manager.players.get(guildId);
                    
                    if (currentPlayer && currentPlayer.queue && currentPlayer.queue.current) {
                        const queueList = currentPlayer.queue.size > 0 ? 
                            currentPlayer.queue.filter(track => track !== currentPlayer.queue.current)
                                .map((track, index) => `${index + 1}. **[${track.title}](${track.uri})** - \`${convertTime(track.length, true)}\``)
                                .join('\n') : '';
                        
                        const updatedEmbed = new EmbedBuilder()
                            .setColor(client.config.embedColor)
                            .setTitle("Music Control Panel")
                            .setDescription(`Now playing: **[${currentPlayer.queue.current.title}](${currentPlayer.queue.current.uri})**\nDuration: \`${convertTime(currentPlayer.queue.current.length, true)}\``)
                            .setImage(currentPlayer.queue.current.thumbnail || "https://i.pinimg.com/originals/e2/d4/5c/e2d45c1474a5b514be7d10cd47ed26b4.jpg")
                            .setFooter({ text: `Bot by ${client.config.dev} | Guild: ${interaction.guild.name} v2.0 Testing`, iconURL: client.user.displayAvatarURL() });

                        if (queueList) {
                            updatedEmbed.addFields({
                                name: "Queue",
                                value: queueList.length > 1024 ? `${queueList.slice(0, 1020)}...` : queueList,
                                inline: false
                            });
                        }

                        const playPauseButton = new ButtonBuilder()
                            .setCustomId("playpause")
                            .setEmoji("⏯️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);
                        
                        const skipButton = new ButtonBuilder()
                            .setCustomId("skip")
                            .setEmoji("⏭️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPlayer.queue.size === 0 && !currentPlayer.queue.current);
                        
                        const stopButton = new ButtonBuilder()
                            .setCustomId("stop")
                            .setEmoji("⏹️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);
                        
                        const replayButton = new ButtonBuilder()
                            .setCustomId("replay")
                            .setEmoji("🔄")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);
                        
                        const shuffleButton = new ButtonBuilder()
                            .setCustomId("shuffle")
                            .setEmoji("🔀")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPlayer.queue.size < 2);
                        
                        const forwardButton = new ButtonBuilder()
                            .setCustomId("forward")
                            .setEmoji("🔀")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);
                        
                        const backwardButton = new ButtonBuilder()
                            .setCustomId("backward")
                            .setEmoji("⏪")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);
                        
                        const volPlusButton = new ButtonBuilder()
                            .setCustomId("volplus")
                            .setEmoji("🔊")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);
                        
                        const volMinusButton = new ButtonBuilder()
                            .setCustomId("volminus")
                            .setEmoji("🔉")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false);

                        const row1 = new ActionRowBuilder().addComponents(playPauseButton, skipButton, stopButton, forwardButton, volPlusButton);
                        const row2 = new ActionRowBuilder().addComponents(replayButton, shuffleButton, backwardButton, volMinusButton);

                        await panelMessage.edit({ embeds: [updatedEmbed], components: [row1, row2] });
                        
                    } else {
                        
                        const defaultEmbed = new EmbedBuilder()
                            .setColor(client.config.embedColor)
                            .setTitle("Music Control Panel")
                            .setDescription("🎵 **No music currently playing**\nSend a song name/link in this channel to add songs to the queue!")
                            .setImage("https://i.pinimg.com/originals/e2/d4/5c/e2d45c1474a5b514be7d10cd47ed26b4.jpg")
                            .setFooter({ text: `Bot by ${client.config.dev} | Guild: ${interaction.guild.name} v2.0 Testing`, iconURL: client.user.displayAvatarURL() });

                        const disabledButtons = [
                            new ButtonBuilder().setCustomId("playpause").setEmoji("⏯️").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("stop").setEmoji("⏹️").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("forward").setEmoji("⏩").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("volplus").setEmoji("🔊").setStyle(ButtonStyle.Secondary).setDisabled(true)
                        ];
                        
                        const disabledButtons2 = [
                            new ButtonBuilder().setCustomId("replay").setEmoji("🔄").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("backward").setEmoji("⏪").setStyle(ButtonStyle.Secondary).setDisabled(true),
                            new ButtonBuilder().setCustomId("volminus").setEmoji("🔉").setStyle(ButtonStyle.Secondary).setDisabled(true)
                        ];

                        const defaultRow1 = new ActionRowBuilder().addComponents(disabledButtons);
                        const defaultRow2 = new ActionRowBuilder().addComponents(disabledButtons2);

                        await panelMessage.edit({ embeds: [defaultEmbed], components: [defaultRow1, defaultRow2] });
                    }
                    
                } catch (editError) {
                    console.error(`[Button Error] Failed to edit panel message after ${customId}: ${editError} for guild ${guildId}`);
                }
            }
            
        } catch (error) {
            console.error(`[Button Error] ${error} for guild ${guildId}`);
            try {
                await interaction.followUp({ content: ":exclamation: **An error occurred with the button.**", flags: MessageFlags.Ephemeral });
            } catch (followUpError) {
                console.error(`[Button Error] Failed to send error message: ${followUpError}`);
            }
        }
    }
};