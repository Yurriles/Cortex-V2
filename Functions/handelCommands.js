const { REST, Routes } = require("discord.js");
const fs = require("fs");
const Ascii = require("ascii-table");

module.exports = (client) => {
  client.handleCommands = async (commandFolders, basePath) => {
    const table = new Ascii().setHeading("File Name", "Status");
    client.commandArray = [];

    for (const folder of commandFolders) {
      const files = fs.readdirSync(`${basePath}/${folder}`).filter(f => f.endsWith(".js"));
      for (const file of files) {
        const cmd = require(`../Commands/${folder}/${file}`);
        client.commands.set(cmd.data.name, cmd);
        client.commandArray.push(cmd.data.toJSON());
        table.addRow(file, "Loaded");
      }
    }

    console.log(table.toString(), `\n[COMMANDS] Loaded ${client.commands.size} SlashCommands.`);

    client.once("ready", async () => {
      const appId = client.application?.id;
      const guildId = process.env.serverId?.trim();
      const rest = new REST({ version: "10" }).setToken(process.env.token?.trim());

      console.log("[DEBUG] Using appId:", appId, "guildId:", guildId);

      try {
        client.logs.info("[SLASH_COMMANDS] Refreshing (/) commands…");

        if (guildId) {
          await rest.put(
            Routes.applicationGuildCommands(appId, guildId),
            { body: client.commandArray }
          );

          await rest.put(Routes.applicationCommands(appId), { body: [] });
        } else {
          await rest.put(
            Routes.applicationCommands(appId),
            { body: client.commandArray }
          );
        }

        client.logs.success("[SLASH_COMMANDS] Reloaded (/) commands.");
      } catch (error) {
        console.error("[SLASH_COMMANDS] Registration failed", {
          status: error.status,
          code: error.code,
          discordCode: error.rawError?.code,
          message: error.rawError?.message,
          method: error.method,
          url: error.url,
        });
      }
    });
  };
};