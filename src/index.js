const { loadConfig } = require('./config');
const { TwitchAuth } = require('./auth');
const { TwitchStreams } = require('./streams');
const { TwitchChannels } = require('./channels');
const { TwitchChat } = require('./chat');
const { TwitchUsers } = require('./users');

class TwitchClient {
  constructor(options = {}) {
    const config = options.config || loadConfig(options.env);
    const httpClient = options.httpClient;

    this.auth = new TwitchAuth(config, httpClient);
    this.streams = new TwitchStreams(config, this.auth, httpClient);
    this.channels = new TwitchChannels(config, this.auth, httpClient);
    this.chat = new TwitchChat(config, this.auth, httpClient);
    this.users = new TwitchUsers(config, this.auth, httpClient);
  }
}

module.exports = {
  TwitchClient,
  TwitchAuth,
  TwitchStreams,
  TwitchChannels,
  TwitchChat,
  TwitchUsers,
  loadConfig,
};
