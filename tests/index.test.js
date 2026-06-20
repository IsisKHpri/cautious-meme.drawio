const {
  TwitchClient,
  TwitchAuth,
  TwitchStreams,
  TwitchChannels,
  TwitchChat,
  TwitchUsers,
  loadConfig,
} = require('../src/index');

describe('TwitchClient', () => {
  it('initializes all sub-clients from config', () => {
    const config = {
      clientId: 'id',
      clientSecret: 'secret',
      apiBase: 'https://api.twitch.tv/helix',
      authBase: 'https://id.twitch.tv/oauth2',
    };

    const client = new TwitchClient({ config });

    expect(client.auth).toBeInstanceOf(TwitchAuth);
    expect(client.streams).toBeInstanceOf(TwitchStreams);
    expect(client.channels).toBeInstanceOf(TwitchChannels);
    expect(client.chat).toBeInstanceOf(TwitchChat);
    expect(client.users).toBeInstanceOf(TwitchUsers);
  });

  it('accepts a custom httpClient', () => {
    const mockHttp = { get: jest.fn(), post: jest.fn() };
    const config = {
      clientId: 'id',
      clientSecret: 'secret',
      apiBase: 'https://api.twitch.tv/helix',
      authBase: 'https://id.twitch.tv/oauth2',
    };

    const client = new TwitchClient({ config, httpClient: mockHttp });

    expect(client.auth).toBeInstanceOf(TwitchAuth);
  });
});

describe('module exports', () => {
  it('exports all expected classes and functions', () => {
    expect(TwitchClient).toBeDefined();
    expect(TwitchAuth).toBeDefined();
    expect(TwitchStreams).toBeDefined();
    expect(TwitchChannels).toBeDefined();
    expect(TwitchChat).toBeDefined();
    expect(TwitchUsers).toBeDefined();
    expect(loadConfig).toBeDefined();
  });
});
