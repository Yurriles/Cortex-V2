const { EmbedBuilder, MessageFlags } = require("discord.js");
const Premium = require("../../Schemas/premiumUserSchema");
const PremiumGuild = require("../../Schemas/premiumGuildSchema");
const blacklistDB = require("../../Schemas/blacklistSchema");
const GuildConfig = require("../../Schemas/guildInviteConfig");

const isUserPremium = async (userId) => {
  const isPremium = await Premium.findOne({ id: userId });
  return isPremium && isPremium.isPremium;
};
const isGuildPremium = async (guildId) => {
  const isPremium = await PremiumGuild.findOne({ id: guildId });
  return isPremium && isPremium.isPremiumGuild;
};

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ----- Slash command handling -----
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (command.premium) {
        const isPremium = await isUserPremium(interaction.user.id);
        const isPremiumServer = await isGuildPremium(interaction.guild.id);
        const premiumembed = new EmbedBuilder()
          .setTitle('✨ **Premium Subscription**')
          .setAuthor({ name: '> Wah There!'})
          .setDescription(`**• Premium Feature Discovered** \n> You **must** be a **Premium** user to use this command!\n**• Buy Premium**\n> https://discord.gg/qkZaSgGDuq`)
          .setFooter({ text: `✨ Premium Required `})
          .setColor('Yellow')
          .setThumbnail('https://cdn.discordapp.com/attachments/1188547936494293012/1198638318011822232/Not-Background.png')
          .setTimestamp();
        if (!isPremium && !isPremiumServer) {
          return interaction.reply({
            embeds: [premiumembed],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (command.developer) {
        if (interaction.user.id !== process.env.developerId) {
          return interaction.reply({
            content: `You are not a developer of this bot!`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      const userData = await blacklistDB.findOne({ userId: interaction.user.id });
      if (userData) {
        return interaction.reply({
          content: `**You are blacklisted from using this bot.**\nReason: **${userData.reason}**`,
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while executing this command. If this persists, please contact the developer by making a support request.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // ----- Modal submission handling -----
    if (interaction.isModalSubmit() && interaction.customId.startsWith('inviteConfigModal_')) {
      const channelId = interaction.customId.split('_')[1];
      const welcomeMessage = interaction.fields.getTextInputValue('welcomeMessage');

      await GuildConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          welcomeChannelId: channelId,
          welcomeMessage,
          enabled: true
        },
        { upsert: true, new: true }
      );

      return interaction.reply({
        content: `${client.emoji.tick} Invite system configured.\n**Channel:** <#${channelId}>\n**Message:** ${welcomeMessage}`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
