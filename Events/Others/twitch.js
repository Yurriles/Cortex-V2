const { Events, EmbedBuilder } = require('discord.js');
const TwitchNotification = require('../../Schemas/twitchSchema');
const fetch = require('node-fetch');

const liveStatusMap = new Map();
let oauth = { token: null, expiresAt: 0 };

const clientId = process.env.TWITCH_CLIENT_ID || 'fhstgm61oj9kqercl2ual1osz8w3yx';
const clientSecret = process.env.TWITCH_CLIENT_SECRET || '0qo9dutrrt8vdp5o2gny4uiq83ifd7';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, options = {}, tries = 3) {
  let attempt = 0;
  let lastErr;
  while (attempt < tries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt >= tries) break;
      await sleep(300 * Math.pow(2, attempt - 1));
    }
  }
  throw lastErr;
}

async function getAccessToken() {
  const now = Date.now();
  if (oauth.token && now < oauth.expiresAt) return oauth.token;

  const data = await fetchWithRetry(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' });
  oauth.token = data.access_token;
  const ttl = (data.expires_in || 3600) * 1000;
  oauth.expiresAt = Date.now() + ttl - 60_000;
  return oauth.token;
}

async function isStreamerLive(streamer) {
  const accessToken = await getAccessToken();
  const data = await fetchWithRetry(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(streamer)}`, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return Array.isArray(data.data) && data.data.length > 0;
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const loop = async () => {
      let configs;
      try {
        configs = await TwitchNotification.find();
      } catch {
        return;
      }

      for (let idx = 0; idx < configs.length; idx++) {
        const config = configs[idx];
        await sleep(250 * idx);

        const streamerName = (config.Streamer || '').split('/').pop();
        if (!streamerName) continue;

        let isLive = false;
        try {
          isLive = await isStreamerLive(streamerName);
        } catch {
          continue;
        }

        const lastStatus = liveStatusMap.get(streamerName) || false;
        const now = new Date();
        const lastNotified = config.LastNotified ? new Date(config.LastNotified) : null;
        const notifyThreshold = 30 * 60 * 1000;

        if (isLive && !lastStatus && (!lastNotified || now - lastNotified > notifyThreshold)) {
          try {
            const channel = await client.channels.fetch(config.Channel);
            if (channel) {
              const customMessage = config.Message || '';
              await channel.send({ content: `${customMessage} \n>>> [**${streamerName} is live here**](${config.Streamer})` });
              config.LastNotified = now;
              await config.save();
            }
          } catch {}
        }

        liveStatusMap.set(streamerName, isLive);
      }
    };

    setTimeout(loop, Math.floor(Math.random() * 2000));
    setInterval(loop, 60_000);
  },
};
