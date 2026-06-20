const axios = require('axios');

class TwitchChannels {
  constructor(config, auth, httpClient = axios) {
    this.apiBase = config.apiBase;
    this.auth = auth;
    this.httpClient = httpClient;
  }

  async getChannelInfo(broadcasterId) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/channels`, {
      headers: this.auth.getAuthHeaders(token),
      params: { broadcaster_id: broadcasterId },
    });
    const channels = response.data.data;
    return channels.length > 0 ? channels[0] : null;
  }

  async modifyChannelInfo(broadcasterId, accessToken, updates) {
    const allowedFields = ['game_id', 'broadcaster_language', 'title', 'delay', 'tags'];
    const body = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        body[field] = updates[field];
      }
    }

    await this.httpClient.patch(`${this.apiBase}/channels`, body, {
      headers: {
        ...this.auth.getAuthHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      params: { broadcaster_id: broadcasterId },
    });
  }

  async getChannelEditors(broadcasterId, accessToken) {
    const response = await this.httpClient.get(`${this.apiBase}/channels/editors`, {
      headers: this.auth.getAuthHeaders(accessToken),
      params: { broadcaster_id: broadcasterId },
    });
    return response.data;
  }

  async searchChannels(query, params = {}) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/search/channels`, {
      headers: this.auth.getAuthHeaders(token),
      params: {
        query,
        first: params.first || 20,
        live_only: params.liveOnly || false,
        after: params.after,
      },
    });
    return response.data;
  }

  formatChannelInfo(channel) {
    if (!channel) return null;
    return {
      id: channel.broadcaster_id,
      name: channel.broadcaster_name,
      language: channel.broadcaster_language,
      game: channel.game_name,
      title: channel.title,
      tags: channel.tags || [],
    };
  }
}

module.exports = { TwitchChannels };
