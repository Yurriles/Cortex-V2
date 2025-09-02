const { Events } = require('discord.js');
const Giveaway = require('../../Schemas/giveawaySchema');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            if (!interaction.isButton() || interaction.customId !== 'giveaway_enter') return;

            // Respond immediately to avoid timeout
            await interaction.reply({ content: 'Processing your giveaway entry...', ephemeral: true });

            const giveawayId = interaction.message.id;
            const giveaway = await Giveaway.findOne({ giveawayId });
            if (!giveaway) {
                return interaction.followUp({ content: 'This giveaway no longer exists!', ephemeral: true });
            }

            if (new Date() > giveaway.endTime || giveaway.hasEnded) {
                return interaction.followUp({ content: 'This giveaway has ended!', ephemeral: true });
            }

            const hasEntered = giveaway.entrants.includes(interaction.user.id);

            if (!hasEntered) {
                let messageCount = 0;
                const channels = interaction.guild.channels.cache.filter(ch => ch.isTextBased());
                for (const channel of channels.values()) {
                    try {
                        const messages = await channel.messages.fetch({ limit: 50 });
                        messageCount += messages.filter(msg => msg.author.id === interaction.user.id).size;
                    } catch (err) {
                        console.error(`Failed to fetch messages from channel ${channel.id}:`, err);
                    }
                }
                if (messageCount < giveaway.requiredMessages) {
                    return interaction.followUp({ content: `You need at least ${giveaway.requiredMessages} messages to enter this giveaway! You have ${messageCount}.`, ephemeral: true });
                }

                let inviteCount = 0;
                try {
                    const invites = await interaction.guild.invites.fetch({ cache: true });
                    const userInvites = invites.filter(inv => inv.inviterId === interaction.user.id);
                    inviteCount = userInvites.reduce((count, inv) => count + (inv.uses || 0), 0);
                } catch (err) {
                    console.error(`Failed to fetch invites for guild ${interaction.guild.id}:`, err);
                    return interaction.followUp({ content: 'Error checking invites. Please try again later.', ephemeral: true });
                }
                if (inviteCount < giveaway.requiredInvites) {
                    return interaction.followUp({ content: `You need at least ${giveaway.requiredInvites} invites to enter this giveaway! You have ${inviteCount}.`, ephemeral: true });
                }

                let totalEntries = 1;
                const updateOps = { $push: { entrants: interaction.user.id } };
                if (giveaway.bonusRole && interaction.member.roles.cache.has(giveaway.bonusRole)) {
                    totalEntries += giveaway.bonusEntries;
                    for (let i = 0; i < giveaway.bonusEntries; i++) {
                        updateOps.$push.entrants = interaction.user.id;
                    }
                }

                await Giveaway.updateOne(
                    { giveawayId, hasEnded: false },
                    updateOps
                );

                const updatedGiveaway = await Giveaway.findOne({ giveawayId });
                console.log(`[Enter Giveaway] User ${interaction.user.id} entered giveaway ID: ${giveawayId}. Total entries: ${updatedGiveaway.entrants.length}, Entrants: ${updatedGiveaway.entrants.join(', ')}`);

                const enterButton = new ButtonBuilder()
                    .setCustomId('giveaway_enter')
                    .setLabel('Enter')
                    .setStyle(ButtonStyle.Primary);

                const showEntriesButton = new ButtonBuilder()
                    .setCustomId('giveaway_show_entries')
                    .setLabel(`Show Entries: ${updatedGiveaway.entrants.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const row = new ActionRowBuilder().addComponents(enterButton, showEntriesButton);
                await interaction.message.edit({ components: [row] });

                await interaction.followUp({ content: `You’ve entered the giveaway${totalEntries > 1 ? ` with ${totalEntries} entries (including ${giveaway.bonusEntries} bonus entries)` : ''}!`, ephemeral: true });
            } else {
                await Giveaway.updateOne(
                    { giveawayId, hasEnded: false },
                    { $pull: { entrants: interaction.user.id } }
                );

                const updatedGiveaway = await Giveaway.findOne({ giveawayId });
                console.log(`[Leave Giveaway] User ${interaction.user.id} left giveaway ID: ${giveawayId}. Total entries: ${updatedGiveaway.entrants.length}, Entrants: ${updatedGiveaway.entrants.join(', ')}`);

                const enterButton = new ButtonBuilder()
                    .setCustomId('giveaway_enter')
                    .setLabel('Enter')
                    .setStyle(ButtonStyle.Primary);

                const showEntriesButton = new ButtonBuilder()
                    .setCustomId('giveaway_show_entries')
                    .setLabel(`Show Entries: ${updatedGiveaway.entrants.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const row = new ActionRowBuilder().addComponents(enterButton, showEntriesButton);
                await interaction.message.edit({ components: [row] });

                await interaction.followUp({ content: 'You’ve been removed from the giveaway!', ephemeral: true });
            }
        } catch (error) {
            console.error(`[Giveaway Error] Failed to process interaction for giveaway ${interaction.message.id}:`, error);
            try {
                await interaction.followUp({ content: 'An error occurred while processing your entry!', ephemeral: true });
            } catch (followUpError) {
                console.error(`[Giveaway Error] Failed to send follow-up:`, followUpError);
            }
        }
    },
};