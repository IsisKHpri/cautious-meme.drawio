const axios = require('axios');

class TwitchStreams {
  constructor(config, auth, httpClient = axios) {
    this.apiBase = config.apiBase;
    this.auth = auth;
    this.httpClient = httpClient;
  }

  async getStreams(params = {}) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/streams`, {
      headers: this.auth.getAuthHeaders(token),
      params: {
        first: params.first || 20,
        game_id: params.gameId,
        language: params.language,
        after: params.after,
      },
    });
    return response.data;
  }

  async getStreamByUser(userId) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/streams`, {
      headers: this.auth.getAuthHeaders(token),
      params: { user_id: userId },
    });
    const streams = response.data.data;
    return streams.length > 0 ? streams[0] : null;
  }

  async getStreamsByGame(gameId, limit = 20) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/streams`, {
      headers: this.auth.getAuthHeaders(token),
      params: { game_id: gameId, first: limit },
    });
    return response.data;
  }

  async getFollowedStreams(userId, accessToken) {
    const response = await this.httpClient.get(`${this.apiBase}/streams/followed`, {
      headers: this.auth.getAuthHeaders(accessToken),
      params: { user_id: userId },
    });
    return response.data;
  }

  formatStreamInfo(stream) {
    if (!stream) return null;
    return {
      id: stream.id,
      user: stream.user_name,
      title: stream.title,
      game: stream.game_name,
      viewers: stream.viewer_count,
      startedAt: stream.started_at,
      thumbnailUrl: stream.thumbnail_url,
      isLive: stream.type === 'live',
    };
  }
}

module.exports = { TwitchStreams };
