const { loadConfig, TWITCH_API_BASE, TWITCH_AUTH_BASE } = require('../src/config');

describe('config', () => {
  describe('loadConfig', () => {
    it('returns config when credentials are provided', () => {
      const env = {
        TWITCH_CLIENT_ID: 'test-id',
        TWITCH_CLIENT_SECRET: 'test-secret',
      };
      const config = loadConfig(env);
      expect(config.clientId).toBe('test-id');
      expect(config.clientSecret).toBe('test-secret');
      expect(config.apiBase).toBe(TWITCH_API_BASE);
      expect(config.authBase).toBe(TWITCH_AUTH_BASE);
    });

    it('throws when TWITCH_CLIENT_ID is missing', () => {
      const env = { TWITCH_CLIENT_SECRET: 'test-secret' };
      expect(() => loadConfig(env)).toThrow('Missing Twitch credentials');
    });

    it('throws when TWITCH_CLIENT_SECRET is missing', () => {
      const env = { TWITCH_CLIENT_ID: 'test-id' };
      expect(() => loadConfig(env)).toThrow('Missing Twitch credentials');
    });

    it('throws when both credentials are missing', () => {
      expect(() => loadConfig({})).toThrow('Missing Twitch credentials');
    });

    it('allows overriding apiBase and authBase', () => {
      const env = {
        TWITCH_CLIENT_ID: 'test-id',
        TWITCH_CLIENT_SECRET: 'test-secret',
        TWITCH_API_BASE: 'https://custom-api.example.com',
        TWITCH_AUTH_BASE: 'https://custom-auth.example.com',
      };
      const config = loadConfig(env);
      expect(config.apiBase).toBe('https://custom-api.example.com');
      expect(config.authBase).toBe('https://custom-auth.example.com');
    });
  });

  describe('constants', () => {
    it('exports correct API base URL', () => {
      expect(TWITCH_API_BASE).toBe('https://api.twitch.tv/helix');
    });

    it('exports correct auth base URL', () => {
      expect(TWITCH_AUTH_BASE).toBe('https://id.twitch.tv/oauth2');
    });
  });
});
