const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionsBitField,
    ButtonStyle,
  } = require('discord.js');
  const aiConfig = require("../Schemas/aiSchema.js");
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const messageHistory = new Map();
  
  module.exports = (client) => {
    client.on("messageCreate", async (message) => {
        if (!message || !message.guild) return;
        let data = await aiConfig.findOne({ guildId: message.guild.id });
      
        if (message.author.bot) return;
      
        if (!data) return;
      
        const channelId = data.channelId;
      
        if (data.blacklists.includes(message.author.id)) {
          await message.reply(`You cannot use AI here as you are blacklisted.`);
          return;
        }
      
        if (message.channel.id !== channelId) return;
        else {
          let input = message.content;
      
          if (!messageHistory.has(message.guild.id)) {
            messageHistory.set(message.guild.id, []);
          }
      
          const history = messageHistory.get(message.guild.id);
          history.push(`:User   ${input}`);
          
          if (history.length > 5) {
            history.shift(); 
          }
          const prompt = history.join('\n') + '\nAI:';
          
          const ai = new GoogleGenerativeAI(client.config.gemini_api);
          const generationConfig = {
            maxOutputTokens: 500,
          };
  
          const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig,
          });
          const result = await model.generateContent(prompt);
          const sanitizedResponse = result.response.text().replace(/@everyone/g, '@\u200Beveryone').replace(/@here/g, '@\u200Bhere');
  
          history.push(`AI: ${sanitizedResponse}`);
  
          await message.reply(sanitizedResponse);
        }
      });
  };
  
  /**
  * Credits: Arpan | @arpandevv
  * Buy: https://razorbot.buzz/buy
  */