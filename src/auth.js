const axios = require('axios');

class TwitchAuth {
  constructor(config, httpClient = axios) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.authBase = config.authBase;
    this.httpClient = httpClient;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAppAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await this.httpClient.post(`${this.authBase}/token`, null, {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      },
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return this.accessToken;
  }

  async validateToken(token) {
    const response = await this.httpClient.get(`${this.authBase}/validate`, {
      headers: { Authorization: `OAuth ${token}` },
    });
    return response.data;
  }

  async revokeToken(token) {
    await this.httpClient.post(`${this.authBase}/revoke`, null, {
      params: {
        client_id: this.clientId,
        token,
      },
    });
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  getAuthHeaders(token) {
    return {
      'Client-ID': this.clientId,
      Authorization: `Bearer ${token}`,
    };
  }

  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }
}

module.exports = { TwitchAuth };
