const InviteStats = require('../../Schemas/inviteSchema');
const GuildConfig = require('../../Schemas/guildInviteConfig');
const inviteCache = require('../../Utils/inviteCache');
const InviteJoin = require('../../Schemas/inviteJoinRecord');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      const guildId = member.guild.id;
      const guildConfig = await GuildConfig.findOne({ guildId });
      if (guildConfig && !guildConfig.enabled) return;
      if (guildConfig?.ignoreBots && member.user.bot) return;

      const before = inviteCache.get(guildId);
      const invites = await member.guild.invites.fetch().catch(() => null);
      if (!invites) return;

      const after = new Map();
      invites.forEach(inv => after.set(inv.code, { code: inv.code, uses: inv.uses ?? 0, inviterId: inv.inviter?.id ?? null }));

      let usedInvite = null;
      for (const [code, data] of after.entries()) {
        const b = before.get(code);
        if (!b && data.uses > 0) {
          usedInvite = data;
          break;
        }
        if (b && data.uses > b.uses) {
          usedInvite = data;
          break;
        }
      }
      if (!usedInvite) usedInvite = { code: null, inviterId: null };

      inviteCache.set(guildId, after);

      let isFake = false;
      const fakeThresholdDays = guildConfig?.fakeAccountAgeDays ?? 7;
      const accountAgeDays = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < fakeThresholdDays) isFake = true;

      const inviterId = usedInvite.inviterId;
      if (inviterId) {
        const filter = { guildId, userId: inviterId };
        const update = {
          $inc: {
            invites: isFake ? 0 : 1,
            regular: isFake ? 0 : 1,
            fake: isFake ? 1 : 0
          },
          $set: { lastUpdated: Date.now() }
        };
        await InviteStats.findOneAndUpdate(filter, update, { upsert: true, new: true });
      }

      // store join record
      await InviteJoin.findOneAndUpdate({ guildId, joinedId: member.id }, { guildId, joinedId: member.id, inviterId: inviterId ?? null, code: usedInvite.code ?? null, joinedAt: Date.now() }, { upsert: true });

      // welcome message
      if (guildConfig?.welcomeChannelId) {
        const ch = member.guild.channels.cache.get(guildConfig.welcomeChannelId);
        if (ch) {
          const inviterTag = inviterId ? (await client.users.fetch(inviterId).then(u => u.tag).catch(() => 'Unknown')) : 'Unknown';
          const stats = inviterId ? await InviteStats.findOne({ guildId, userId: inviterId }) : null;
          const inviteCount = stats ? stats.invites + (stats.bonus ?? 0) : 0;
          const inviteURL = usedInvite.code ? `.gg/${usedInvite.code}` : 'Unknown';
          let content = (guildConfig.welcomeMessage || "Welcome {user} — invited by {inviter}. Total invites: {invites}")
            .replaceAll('{user}', `<@${member.id}>`)
            .replaceAll('{username}', member.user.username)
            .replaceAll('{inviter}', inviterTag)
            .replaceAll('{inviterId}', inviterId ?? 'Unknown')
            .replaceAll('{invites}', String(inviteCount))
            .replaceAll('{fake}', isFake ? 'yes' : 'no')
            .replace('{url}', inviteURL);

          ch.send({ content }).catch(() => null);
        }
      }

      if (guildConfig?.logChannelId) {
        const log = member.guild.channels.cache.get(guildConfig.logChannelId);
        if (log) {
          const inviterTag = inviterId ? (await client.users.fetch(inviterId).then(u => u.tag).catch(() => 'Unknown')) : 'Unknown';
          const msg = `${member.user.tag} joined — invited by ${inviterTag} (${inviterId ?? 'none'}) ${isFake ? '(FAKE)' : ''}`;
          log.send({ content: msg }).catch(() => null);
        }
      }

    } catch (err) {
      client?.logs?.error && client.logs.error('guildMemberAdd invite error', err);
    }
  }
};
