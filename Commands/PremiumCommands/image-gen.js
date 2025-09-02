const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const API_URL = 'https://api.rnilaweera.lk/api/image/generate';
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('Generates an image based on your prompt.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The description of the image you want to create.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('model')
                .setDescription('Select the image generation model.')
                .setRequired(true)
                .addChoices(
                    { name: 'Rsn Labs', value: 'rsnlabs' },
                    { name: 'Flux', value: 'flux' },
                    { name: 'Anime', value: 'anime' },
                    { name: 'Disney', value: 'disney' },
                    { name: 'Cartoon', value: 'cartoon' },
                    { name: 'Photography', value: 'photography' },
                    { name: 'Icon', value: 'icon' }
                )
        ),
        premium: true,
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 2 * 60 * 1000; // 2 minutes in milliseconds

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000; // Time left in seconds
                return await interaction.reply({ content: `Please wait ${timeLeft.toFixed(0)} more seconds before using this command again.`, flags: MessageFlags.Ephemeral });
            }
        }

        cooldowns.set(userId, now);

        await interaction.deferReply(); 

        const prompt = interaction.options.getString('prompt');
        const selectedModel = interaction.options.getString('model');

        try {
            const response = await axios.post(API_URL, {
                prompt: prompt,
                model: selectedModel
            }, {
                headers: {
                    Authorization: `Bearer ${client.config.imageGenAPI}`
                }
            });

            const imageUrl = response.data.image_url;

            if (imageUrl) {
                const embed = new EmbedBuilder()
                    .setImage(imageUrl);
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: 'Image generation failed. Please try again or check your API credentials.' });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'An error occurred during image generation. Please try again later.' });
        }
    }
};

/**
 * Credits: Arpan | @arpandevv
 * Buy: https://razorbot.buzz/buy
 */