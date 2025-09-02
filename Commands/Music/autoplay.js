
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("🔁 Toggle autoplay for music"),
        
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guild.id);


        if (!player) {
            return interaction.reply({
                content: ":x: **No music is currently playing.**",
                ephemeral: true
            });
        }

        const currentSetting = player.data.get("autoplay") || false;
        const newSetting = !currentSetting;

        player.data.set("autoplay", newSetting);
        player.data.set("identifier", player.queue.current.identifier);
        player.data.set("requester", interaction.user);

        await interaction.reply({
            content: newSetting ? "🔁 **Autoplay has been enabled.**" : "⏹️ **Autoplay has been disabled.**",
            ephemeral: true
        });
    }
};
