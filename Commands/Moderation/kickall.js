const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kickall")
        .setDescription("Kick all members except those with the specified role.")
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("The role to exclude from kicking")
                .setRequired(true)),
    
    async execute(interaction, client) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: "You do not have permission to use this command. Only the server owner can execute it.", ephemeral: true });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: "I do not have permission to kick members.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const roleToExclude = interaction.options.getRole("role");
            const members = await interaction.guild.members.fetch();

            const targets = members.filter(m => !m.user.bot && !m.roles.cache.has(roleToExclude.id));
            const kickableTargets = targets.filter(m => m.kickable);
            const notKickable = targets.size - kickableTargets.size;

            const confirmButton = new ButtonBuilder()
                .setCustomId("kickall-confirm")
                .setLabel("Yes, I want to Continue")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(confirmButton);

            const panel = await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor || 0x2b2d31)
                        .setTitle("Kickall Confirmation")
                        .setDescription(
                            `This will kick **${kickableTargets.size}** members (excluding role **${roleToExclude.name}**). ` +
                            (notKickable > 0 ? `\n${notKickable} member(s) are not kickable due to hierarchy/permissions.` : ``) +
                            `\n\nClick the button below, then type **YesIwantToKickEveryone** in this channel within 30 seconds to proceed.`
                        )
                ],
                components: [row]
            });

            const buttonCollector = panel.createMessageComponentCollector({ time: 30_000, filter: i => i.customId === "kickall-confirm" && i.user.id === interaction.user.id, max: 1 });

            let proceed = false;

            buttonCollector.on("collect", async (i) => {
                await i.deferUpdate();
                await panel.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColor || 0x2b2d31)
                            .setTitle("Final Confirmation")
                            .setDescription("Type **YesIwantToKickEveryone** in this channel within 30 seconds to proceed.")
                    ],
                    components: [new ActionRowBuilder().addComponents(ButtonBuilder.from(confirmButton).setDisabled(true))]
                });

                const phraseCollector = interaction.channel.createMessageCollector({
                    time: 30_000,
                    max: 1,
                    filter: m => m.author.id === interaction.user.id
                });

                phraseCollector.on("collect", (m) => {
                    if (m.content.trim() === "YesIwantToKickEveryone") {
                        proceed = true;
                    }
                });

                phraseCollector.on("end", async () => {
                    if (!proceed) {
                        await panel.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xffa500)
                                    .setTitle("Kickall Cancelled")
                                    .setDescription("Confirmation phrase not received in time or incorrect. Operation cancelled.")
                            ],
                            components: [new ActionRowBuilder().addComponents(ButtonBuilder.from(confirmButton).setDisabled(true))]
                        });
                        await interaction.editReply({ content: "Cancelled." });
                        return;
                    }

                    let kicked = 0;
                    let failed = 0;

                    const ids = Array.from(kickableTargets.keys());
                    const batchSize = 3;

                    for (let i = 0; i < ids.length; i += batchSize) {
                        const batch = ids.slice(i, i + batchSize);
                        await Promise.all(batch.map(async id => {
                            const m = members.get(id);
                            try {
                                await m.kick("Kicked by command: kickall");
                                kicked++;
                            } catch {
                                failed++;
                            }
                        }));
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    const resultEmbed = new EmbedBuilder()
                        .setColor(client.config.embedColor || 0x2b2d31)
                        .setTitle("Kickall Summary")
                        .setDescription(`Excluded role: **${roleToExclude.name}**`)
                        .addFields(
                            { name: "Attempted", value: String(kickableTargets.size), inline: true },
                            { name: "Kicked", value: String(kicked), inline: true },
                            { name: "Failed", value: String(failed), inline: true },
                            { name: "Not Kickable (hierarchy/permissions)", value: String(notKickable), inline: true }
                        );

                    await panel.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x2b2d31)
                                .setTitle("Kickall Completed")
                                .setDescription("Operation finished. See summary in your ephemeral response.")
                        ],
                        components: [new ActionRowBuilder().addComponents(ButtonBuilder.from(confirmButton).setDisabled(true))]
                    });

                    await interaction.editReply({ embeds: [resultEmbed] });
                });
            });

            buttonCollector.on("end", async (collected) => {
                if (collected.size === 0) {
                    await panel.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.embedColor)
                                .setTitle("Kickall Timed Out")
                                .setDescription("No confirmation received within 30 seconds. Operation cancelled.")
                        ],
                        components: [new ActionRowBuilder().addComponents(ButtonBuilder.from(confirmButton).setDisabled(true))]
                    });
                    await interaction.editReply({ content: "Cancelled." });
                }
            });
        } catch (error) {
            await interaction.editReply({ content: "An error occurred while preparing the operation." });
        }
    },
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */
