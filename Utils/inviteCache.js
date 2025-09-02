class InviteCache {
  constructor() {
    this._cache = new Map();
  }
  set(guildId, invitesMap) {
    this._cache.set(guildId, invitesMap);
  }
  get(guildId) {
    return this._cache.get(guildId) || new Map();
  }
  removeGuild(guildId) {
    this._cache.delete(guildId);
  }
}
module.exports = new InviteCache();
