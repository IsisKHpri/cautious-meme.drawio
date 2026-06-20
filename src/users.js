const axios = require('axios');

class TwitchUsers {
  constructor(config, auth, httpClient = axios) {
    this.apiBase = config.apiBase;
    this.auth = auth;
    this.httpClient = httpClient;
  }

  async getUsers(params = {}) {
    const token = await this.auth.getAppAccessToken();
    const queryParams = {};
    if (params.ids) queryParams.id = params.ids;
    if (params.logins) queryParams.login = params.logins;

    const response = await this.httpClient.get(`${this.apiBase}/users`, {
      headers: this.auth.getAuthHeaders(token),
      params: queryParams,
    });
    return response.data;
  }

  async getUserById(userId) {
    const result = await this.getUsers({ ids: [userId] });
    const users = result.data;
    return users.length > 0 ? users[0] : null;
  }

  async getUserByLogin(login) {
    const result = await this.getUsers({ logins: [login] });
    const users = result.data;
    return users.length > 0 ? users[0] : null;
  }

  async getFollowedChannels(userId, accessToken, params = {}) {
    const response = await this.httpClient.get(`${this.apiBase}/channels/followed`, {
      headers: this.auth.getAuthHeaders(accessToken),
      params: {
        user_id: userId,
        first: params.first || 20,
        after: params.after,
      },
    });
    return response.data;
  }

  async getBlockList(broadcasterId, accessToken, params = {}) {
    const response = await this.httpClient.get(`${this.apiBase}/users/blocks`, {
      headers: this.auth.getAuthHeaders(accessToken),
      params: {
        broadcaster_id: broadcasterId,
        first: params.first || 20,
        after: params.after,
      },
    });
    return response.data;
  }

  formatUserInfo(user) {
    if (!user) return null;
    return {
      id: user.id,
      login: user.login,
      displayName: user.display_name,
      type: user.type,
      broadcasterType: user.broadcaster_type,
      description: user.description,
      profileImageUrl: user.profile_image_url,
      createdAt: user.created_at,
    };
  }
}

module.exports = { TwitchUsers };
