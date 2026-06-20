const { TwitchClient } = require('../src/index');

function makeMockHttp() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  };
}

describe('TwitchClient integration', () => {
  let client;
  let mockHttp;

  beforeEach(() => {
    mockHttp = makeMockHttp();
    client = new TwitchClient({
      config: {
        clientId: 'integration-test-id',
        clientSecret: 'integration-test-secret',
        apiBase: 'https://api.twitch.tv/helix',
        authBase: 'https://id.twitch.tv/oauth2',
      },
      httpClient: mockHttp,
    });
  });

  it('authenticates and fetches a user by login', async () => {
    mockHttp.post.mockResolvedValue({
      data: { access_token: 'app-token-123', expires_in: 3600 },
    });
    mockHttp.get.mockResolvedValue({
      data: {
        data: [{
          id: '141981764',
          login: 'twitchdev',
          display_name: 'TwitchDev',
          type: '',
          broadcaster_type: 'partner',
          description: 'Supporting third-party developers',
          profile_image_url: 'https://example.com/twitchdev.png',
          created_at: '2016-12-14T20:32:28Z',
        }],
      },
    });

    const user = await client.users.getUserByLogin('twitchdev');

    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith(
      'https://id.twitch.tv/oauth2/token',
      null,
      expect.objectContaining({
        params: expect.objectContaining({ grant_type: 'client_credentials' }),
      })
    );
    expect(user.login).toBe('twitchdev');
    expect(user.display_name).toBe('TwitchDev');

    const formatted = client.users.formatUserInfo(user);
    expect(formatted.displayName).toBe('TwitchDev');
    expect(formatted.broadcasterType).toBe('partner');
  });

  it('reuses cached token across multiple API calls', async () => {
    mockHttp.post.mockResolvedValue({
      data: { access_token: 'cached-token', expires_in: 3600 },
    });
    mockHttp.get.mockResolvedValue({ data: { data: [] } });

    await client.users.getUsers();
    await client.streams.getStreams();
    await client.channels.searchChannels('test');

    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.get).toHaveBeenCalledTimes(3);
  });

  it('performs a full channel lookup and update workflow', async () => {
    mockHttp.post.mockResolvedValue({
      data: { access_token: 'app-token', expires_in: 3600 },
    });
    mockHttp.get.mockResolvedValue({
      data: {
        data: [{
          broadcaster_id: '123',
          broadcaster_name: 'TestChannel',
          broadcaster_language: 'en',
          game_name: 'Just Chatting',
          title: 'Old Title',
          tags: ['English'],
        }],
      },
    });
    mockHttp.patch.mockResolvedValue({});

    const channel = await client.channels.getChannelInfo('123');
    expect(channel.title).toBe('Old Title');

    const formatted = client.channels.formatChannelInfo(channel);
    expect(formatted.name).toBe('TestChannel');
    expect(formatted.game).toBe('Just Chatting');

    await client.channels.modifyChannelInfo('123', 'user-oauth-token', {
      title: 'New Stream Title',
      game_id: '509658',
    });

    expect(mockHttp.patch).toHaveBeenCalledWith(
      'https://api.twitch.tv/helix/channels',
      { title: 'New Stream Title', game_id: '509658' },
      expect.anything()
    );
  });

  it('sends a chat message and retrieves chat settings', async () => {
    mockHttp.post
      .mockResolvedValueOnce({
        data: { access_token: 'app-token', expires_in: 3600 },
      })
      .mockResolvedValueOnce({
        data: { data: [{ message_id: 'msg-001', is_sent: true }] },
      });
    mockHttp.get.mockResolvedValue({
      data: {
        data: [{
          emote_mode: false,
          follower_mode: true,
          follower_mode_duration: 10,
          slow_mode: false,
          slow_mode_wait_time: 0,
          subscriber_mode: false,
          unique_chat_mode: false,
        }],
      },
    });

    const settings = await client.chat.getChatSettings('broadcaster1');
    expect(settings.follower_mode).toBe(true);

    const formatted = client.chat.formatChatSettings(settings);
    expect(formatted.followerMode).toBe(true);
    expect(formatted.followerModeDuration).toBe(10);

    const msgResult = await client.chat.sendChatMessage(
      'broadcaster1', 'sender1', 'user-token', 'Hello from integration test!'
    );
    expect(msgResult.data[0].is_sent).toBe(true);
  });

  it('searches for live streams and formats results', async () => {
    mockHttp.post.mockResolvedValue({
      data: { access_token: 'app-token', expires_in: 3600 },
    });
    mockHttp.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'stream-1',
            user_name: 'PopularStreamer',
            title: 'Playing Minecraft!',
            game_name: 'Minecraft',
            viewer_count: 15000,
            started_at: '2024-06-01T12:00:00Z',
            thumbnail_url: 'https://example.com/thumb1.jpg',
            type: 'live',
          },
          {
            id: 'stream-2',
            user_name: 'AnotherStreamer',
            title: 'Building stuff',
            game_name: 'Minecraft',
            viewer_count: 3000,
            started_at: '2024-06-01T13:00:00Z',
            thumbnail_url: 'https://example.com/thumb2.jpg',
            type: 'live',
          },
        ],
        pagination: { cursor: 'next-page-cursor' },
      },
    });

    const result = await client.streams.getStreamsByGame('27471', 10);
    expect(result.data).toHaveLength(2);

    const formatted = client.streams.formatStreamInfo(result.data[0]);
    expect(formatted.user).toBe('PopularStreamer');
    expect(formatted.viewers).toBe(15000);
    expect(formatted.isLive).toBe(true);
    expect(formatted.game).toBe('Minecraft');
  });

  it('validates and revokes tokens', async () => {
    mockHttp.post.mockResolvedValue({
      data: { access_token: 'token-to-revoke', expires_in: 3600 },
    });
    mockHttp.get.mockResolvedValue({
      data: { client_id: 'integration-test-id', login: 'testuser', scopes: ['chat:read'] },
    });

    const token = await client.auth.getAppAccessToken();
    expect(token).toBe('token-to-revoke');

    const validation = await client.auth.validateToken(token);
    expect(validation.client_id).toBe('integration-test-id');

    mockHttp.post.mockResolvedValue({});
    await client.auth.revokeToken(token);

    expect(client.auth.isTokenExpired()).toBe(true);
  });
});
