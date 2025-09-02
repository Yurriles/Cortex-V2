/*
██████╗  █████╗ ███████╗ ██████╗ ██████╗ 
██╔══██╗██╔══██╗╚══███╔╝██╔═══██╗██╔══██╗
██████╔╝███████║  ███╔╝ ██║   ██║██████╔╝
██╔══██╗██╔══██║ ███╔╝  ██║   ██║██╔══██╗
██║  ██║██║  ██║███████╗╚██████╔╝██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝

Developed by: @arpandevv. All rights reserved. (2025)
MIT License
*/

// -------------------------------
// Module Imports
// -------------------------------
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  PermissionsBitField, 
  Permissions, 
  MessageManager, 
  Embed, 
  Collection, 
  Partials, 
  Events, 
  ActivityType,
  REST,
  Routes
} = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
const cron = require('node-cron');
const path = require('path');
const dayjs = require('dayjs');
const chalk = require('chalk');
const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const MongoStore = require('connect-mongo');
const Spotify = require('kazagumo-spotify');
const KazagumoFilter = require('kazagumo-filter');
require('dotenv').config();

// -------------------------------
// Configuration and Constants
// -------------------------------
const currentVersion = 'v2.0.1';
const Premium = require('./Schemas/premiumUserSchema.js');
const PremiumGuild = require('./Schemas/premiumGuildSchema.js');
const { handleLogs } = require("./Events/Others/handleLogs");
const { color, getTimestamp } = require('./Utils/logEffects.js');

// -------------------------------
// Client Initialization
// -------------------------------
const client = new Client({
  intents: Object.keys(GatewayIntentBits),
  partials: [
    Partials.GuildMember, 
    Partials.Channel,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction, 
    Partials.ThreadMember, 
    Partials.User
  ]
});

// Loading utilities
client.logs = require('./Utils/logs.js');
client.config = require('./config');
client.emoji = require('./emoji.json');

// Setting up collections
client.commands = new Collection();
client.setMaxListeners(35);

// -------------------------------
// Lavalink (Music System) Setup
// -------------------------------
const Nodes = [
  {
    name: client.config.lavalink.name,
    url: client.config.lavalink.url,
    auth: client.config.lavalink.auth,
    secure: client.config.lavalink.secure,
  },
];

client.manager = new Kazagumo(
  {
    defaultSearchEngine: 'spotify',
    plugins: [
      new Plugins.PlayerMoved(client),
      new KazagumoFilter(),
      new Spotify({
        clientId: client.config.SpotifyClientID,
        clientSecret: client.config.SpotifyClientSecret,
        playlistPageLimit: 1,
        albumPageLimit: 1,
        searchLimit: 10,
        searchMarket: 'IN',
      }),
    ],
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client),
  Nodes
);

// -------------------------------
// System Loaders
// -------------------------------
const systemsPath = path.join(__dirname, "Systems");
const systemFiles = fs
  .readdirSync(systemsPath)
  .filter((file) => file.endsWith(".js"));

let loadedSystemsCount = 0;

for (const file of systemFiles) {
  const system = require(path.join(systemsPath, file));
  system(client);
  loadedSystemsCount++;
}

client.logs.success(`[SYSTEM] - Loaded Systems: ${loadedSystemsCount}`);

// -------------------------------
// Lavalink Event Handlers
// -------------------------------
client.manager.shoukaku.on('ready', (name) =>
  client.logs.success(`Lavalink ${name}: Ready!`)
);

client.manager.shoukaku.on('error', (name, error) =>
  client.logs.error(`Lavalink ${name}: Error Caught,`, error)
);

client.manager.shoukaku.on('close', (name, code, reason) =>
  console.warn(
    `[MUSIC] Lavalink ${name}: Closed, Code ${code}, Reason ${reason || 'No reason'}`
  )
);

// -------------------------------
// Music Events System
// -------------------------------
client.manager.on('playerStart', async (player, track) => {
  try {
    const playerStartEvent = require('./Events/Lavalink/playerStart.js');
    await playerStartEvent.execute(client, player, track);
  } catch (error) {
    console.error(`Error executing playerStart Event: ${error}`);
  }
});

client.manager.on('playerEmpty', async (player) => {
  try {
    const playerEmptyEvent = require('./Events/Lavalink/playerEmpty.js');
    await playerEmptyEvent.execute(client, player);
  } catch (error) {
    console.error(`Error executing playerEmpty Event: ${error}`);
  }
});

client.manager.on('playerEnd', async (player) => {
  try {
    const playerEndEvent = require('./Events/Lavalink/playerEnd.js');
    await playerEndEvent.execute(client, player);
  } catch (error) {
    console.error(`Error executing playerEnd Event: ${error}`);
  }
});

// -------------------------------
// File Handlers Setup
// -------------------------------
require('./Functions/processHandlers.js')();

const functions = fs.readdirSync('./Functions').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./Events').filter(file => file.endsWith('.js'));
const triggerFiles = fs.readdirSync('./Triggers').filter(file => file.endsWith('.js'));
const commandFolders = fs.readdirSync('./Commands');

// -------------------------------
// Bot Status System
// -------------------------------
client.on(Events.ClientReady, async (client) => {
  try {
    setInterval(() => {
      let activities = [
        { type: 'Watching', name: `${client.commands.size} slash commands!` },
        { type: 'Watching', name: `${client.guilds.cache.size} servers!` },
        { type: 'Watching', name: `${client.guilds.cache.reduce((a,b) => a+b.memberCount, 0)} members!` },
        { type: 'Playing', name: `/help | @${client.user.username}` },
      ];

      const status = activities[Math.floor(Math.random() * activities.length)];

      if (status.type === 'Watching') {
        client.user.setPresence({ 
          activities: [{ name: `${status.name}`, type: ActivityType.Watching }]
        });
      } else {
        client.user.setPresence({ 
          activities: [{ name: `${status.name}`, type: ActivityType.Playing }]
        });
      } 
    }, 7500);
    client.logs.success(`[STATUS] Rotating status loaded successfully.`);
  } catch (error) {
    client.logs.error(`[STATUS] Error while loading rotating status.`);
  }
});

client.on(Events.ClientReady, () => {
  try {
    client.user.setStatus(client.config.status);
    client.logs.success(`[STATUS] Bot status loaded as ${client.config.status}.`);
  } catch (error) {
    client.logs.error(`[STATUS] Error while loading bot status.`);
  }
});

// -------------------------------
// Guild Events
// -------------------------------
client.on('guildCreate', guild => {
  client.logs.info(`[BOT] | I'm in a new guild: ${guild.name}!`);
});

client.on('guildDelete', guild => {
  client.logs.info(`[BOT] | I'm not in ${guild.name} any more...`);
});

// -------------------------------
// Ticket Remind Function
// -------------------------------

const ticketCommand = require('./Commands/Setups/ticket.js');
ticketCommand.setupMessageListener(client);

// -------------------------------
// Command Logging System
// -------------------------------
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction || !interaction.isChatInputCommand()) return;
  
  const channel = await client.channels.cache.get(client.config.slashCommandLoggingChannel);
  const server = interaction.guild.name;
  const user = interaction.user.username;
  const userID = interaction.user.id;

  const embed = new EmbedBuilder()
    .setColor(client.config.embedColor)
    .setAuthor({ 
      name: `${user} has used a command.`, 
      iconURL: client.user.avatarURL({ dynamic: true })
    })
    .setTitle(`${client.user.username} Command Logger`)
    .addFields({ name: 'Server Name', value: `${server}` })
    .addFields({ name: 'Command', value: `\`\`\`${interaction}\`\`\`` })
    .addFields({ name: 'User', value: `${user} | ${userID}` })
    .setTimestamp()
    .setFooter({ 
      text: `Command Logger ${client.config.devBy}`, 
      iconURL: interaction.user.avatarURL({ dynamic: true })
    });

  await channel.send({ embeds: [embed] });
  console.log(
    `${color.torquise}[${getTimestamp()}]${color.reset} [SLASH_COMMAND_USED] ${user} has used a command. \n` +
    `${color.torquise}> Server: ${server} \n> Command: ${interaction} \n> User: ${user} \n> UserID: ${userID}`
  );
});

// -------------------------------
// Premium System
// -------------------------------
cron.schedule('0 6 * * *', async () => {
  try {
    const currentDate = new Date();
    
    const allPremiumUsers = await Premium.find({});
    const expiredPremiumUsers = allPremiumUsers.filter(user => user.premium.expiresAt < currentDate);

    for (const user of expiredPremiumUsers) {
      await Premium.deleteOne({ _id: user._id });
      client.logs.info(`Deleted premium from: <@${user.id}>`);
    }

    const activePremiumUsers = allPremiumUsers.filter(user => user.premium.expiresAt >= currentDate);
    activePremiumUsers.forEach(user => {
      client.logs.info(`Active premium: <@${user.id}>, expires: ${user.premium.expiresAt}`);
    });

    client.logs.info('Expired premiums deleted.');
  } catch (error) {
    client.logs.error(`Error checking premium expiry: ${error}`);
  }
});

// -------------------------------
// Premium Guild System
// -------------------------------
cron.schedule('0 6 * * *', async () => {
  try {
    const currentDate = new Date();
    const allPremiumGuilds = await PremiumGuild.find({});
    const expiredPremiumGuilds = allPremiumGuilds.filter(guild => guild.premium.expiresAt < currentDate);

    for (const guild of expiredPremiumGuilds) {
      await PremiumGuild.deleteOne({ _id: guild._id });
      client.logs.info(`Deleted premium from: ${guild.id}`);
    }

    const activePremiumGuilds = allPremiumGuilds.filter(guild => guild.premium.expiresAt >= currentDate);
    activePremiumGuilds.forEach(guild => {
      client.logs.info(`Active PremiumGuild: ${guild.id}, expires: ${guild.premium.expiresAt}`);
    });

    client.logs.info('Expired PremiumGuilds deleted.');
  } catch (error) {
    client.logs.error(`Error checking PremiumGuild expiry: ${error}`);
  }
});


// -------------------------------
// Initialize Bot
// -------------------------------
(async () => {
  for (const file of functions) {
    require(`./Functions/${file}`)(client);
  }
  await client.handleEvents(path.join(__dirname, './Events'));
  await client.handleTriggers(triggerFiles, './Triggers');
  await client.handleCommands(commandFolders, './Commands');
  client.login(process.env.token).then(() => {
    handleLogs(client);
  });
})();

// -------------------------------
// Snipe Command System
// -------------------------------
client.on("messageDelete", (message) => {
  require("./Commands/Moderation/snipe.js").onMessageDelete(message);
});

// -------------------------------
// Export Client
// -------------------------------
module.exports = client;

/*
setTimeout(() => {
  console.clear();
  client.logs.logging(`[CONSOLE] | Console cleared!`);
}, 5000); // 5000 milliseconds = 5 seconds
*/