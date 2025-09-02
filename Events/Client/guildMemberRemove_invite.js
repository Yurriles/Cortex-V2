const InviteStats = require('../../Schemas/inviteSchema');
const GuildConfig = require('../../Schemas/guildInviteConfig');
const JoinModel = require('../../Schemas/inviteJoinRecord');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    try {
      const guildId = member.guild.id;
      const guildConfig = await GuildConfig.findOne({ guildId });
      if (guildConfig?.ignoreBots && member.user.bot) return;

      const joinRecord = await JoinModel.findOne({ guildId, joinedId: member.id });
      if (!joinRecord) return;

      const inviterId = joinRecord.inviterId;
      if (!inviterId) return;

      const dec = guildConfig.countLeavesAsNegative ? -1 : 0;
      if (dec === 0) return;

      await InviteStats.findOneAndUpdate({ guildId, userId: inviterId }, { $inc: { invites: dec, left: 1 }, $set: { lastUpdated: Date.now() } });

      if (guildConfig?.logChannelId) {
        const log = member.guild.channels.cache.get(guildConfig.logChannelId);
        if (log) log.send({ content: `${member.user.tag} left — decrementing invites of <@${inviterId}>` }).catch(() => null);
      }

    } catch (err) {
      client?.logs?.error && client.logs.error('guildMemberRemove invite error', err);
    }
  }
};
