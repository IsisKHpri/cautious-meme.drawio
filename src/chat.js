const axios = require('axios');

class TwitchChat {
  constructor(config, auth, httpClient = axios) {
    this.apiBase = config.apiBase;
    this.auth = auth;
    this.httpClient = httpClient;
  }

  async getChatters(broadcasterId, moderatorId, accessToken, params = {}) {
    const response = await this.httpClient.get(`${this.apiBase}/chat/chatters`, {
      headers: this.auth.getAuthHeaders(accessToken),
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
        first: params.first || 100,
        after: params.after,
      },
    });
    return response.data;
  }

  async getChatSettings(broadcasterId) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/chat/settings`, {
      headers: this.auth.getAuthHeaders(token),
      params: { broadcaster_id: broadcasterId },
    });
    const settings = response.data.data;
    return settings.length > 0 ? settings[0] : null;
  }

  async updateChatSettings(broadcasterId, moderatorId, accessToken, settings) {
    const allowedFields = [
      'emote_mode',
      'follower_mode',
      'follower_mode_duration',
      'slow_mode',
      'slow_mode_wait_time',
      'subscriber_mode',
      'unique_chat_mode',
    ];
    const body = {};
    for (const field of allowedFields) {
      if (settings[field] !== undefined) {
        body[field] = settings[field];
      }
    }

    const response = await this.httpClient.patch(`${this.apiBase}/chat/settings`, body, {
      headers: {
        ...this.auth.getAuthHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
      },
    });
    return response.data;
  }

  async sendChatMessage(broadcasterId, senderId, accessToken, message) {
    const response = await this.httpClient.post(
      `${this.apiBase}/chat/messages`,
      {
        broadcaster_id: broadcasterId,
        sender_id: senderId,
        message,
      },
      {
        headers: {
          ...this.auth.getAuthHeaders(accessToken),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  async getChatBadges(broadcasterId) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/chat/badges`, {
      headers: this.auth.getAuthHeaders(token),
      params: { broadcaster_id: broadcasterId },
    });
    return response.data;
  }

  async getGlobalBadges() {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/chat/badges/global`, {
      headers: this.auth.getAuthHeaders(token),
    });
    return response.data;
  }

  async getEmotes(broadcasterId) {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/chat/emotes`, {
      headers: this.auth.getAuthHeaders(token),
      params: { broadcaster_id: broadcasterId },
    });
    return response.data;
  }

  async getGlobalEmotes() {
    const token = await this.auth.getAppAccessToken();
    const response = await this.httpClient.get(`${this.apiBase}/chat/emotes/global`, {
      headers: this.auth.getAuthHeaders(token),
    });
    return response.data;
  }

  formatChatSettings(settings) {
    if (!settings) return null;
    return {
      emoteMode: settings.emote_mode,
      followerMode: settings.follower_mode,
      followerModeDuration: settings.follower_mode_duration,
      slowMode: settings.slow_mode,
      slowModeWait: settings.slow_mode_wait_time,
      subscriberMode: settings.subscriber_mode,
      uniqueChatMode: settings.unique_chat_mode,
    };
  }
}

module.exports = { TwitchChat };
