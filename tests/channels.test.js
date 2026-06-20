const { TwitchChannels } = require('../src/channels');

function makeAuth() {
  return {
    getAppAccessToken: jest.fn().mockResolvedValue('test-token'),
    getAuthHeaders: jest.fn().mockReturnValue({
      'Client-ID': 'test-id',
      Authorization: 'Bearer test-token',
    }),
  };
}

function makeConfig() {
  return { apiBase: 'https://api.twitch.tv/helix' };
}

function makeMockHttp() {
  return { get: jest.fn(), patch: jest.fn() };
}

describe('TwitchChannels', () => {
  let channels;
  let mockHttp;
  let mockAuth;

  beforeEach(() => {
    mockHttp = makeMockHttp();
    mockAuth = makeAuth();
    channels = new TwitchChannels(makeConfig(), mockAuth, mockHttp);
  });

  describe('getChannelInfo', () => {
    it('returns channel info for a broadcaster', async () => {
      const channelData = {
        broadcaster_id: '123',
        broadcaster_name: 'TestChannel',
        game_name: 'Minecraft',
      };
      mockHttp.get.mockResolvedValue({ data: { data: [channelData] } });

      const result = await channels.getChannelInfo('123');

      expect(result).toEqual(channelData);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/channels',
        expect.objectContaining({
          params: { broadcaster_id: '123' },
        })
      );
    });

    it('returns null when channel not found', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });
      const result = await channels.getChannelInfo('999');
      expect(result).toBeNull();
    });
  });

  describe('modifyChannelInfo', () => {
    it('sends only allowed fields in the patch request', async () => {
      mockHttp.patch.mockResolvedValue({});

      await channels.modifyChannelInfo('123', 'user-token', {
        title: 'New Title',
        game_id: '456',
        not_allowed: 'should be filtered',
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/channels',
        { title: 'New Title', game_id: '456' },
        expect.objectContaining({
          params: { broadcaster_id: '123' },
        })
      );
    });

    it('sends empty body when no allowed fields provided', async () => {
      mockHttp.patch.mockResolvedValue({});

      await channels.modifyChannelInfo('123', 'user-token', {
        invalid_field: 'value',
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/channels',
        {},
        expect.anything()
      );
    });
  });

  describe('getChannelEditors', () => {
    it('fetches editors for a channel', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ user_id: '1', user_name: 'editor1' }] },
      });

      const result = await channels.getChannelEditors('123', 'user-token');

      expect(result.data).toHaveLength(1);
      expect(mockAuth.getAuthHeaders).toHaveBeenCalledWith('user-token');
    });
  });

  describe('searchChannels', () => {
    it('searches with default params', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      await channels.searchChannels('minecraft');

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/search/channels',
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'minecraft',
            first: 20,
            live_only: false,
          }),
        })
      );
    });

    it('passes custom search params', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      await channels.searchChannels('fortnite', { first: 5, liveOnly: true });

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/search/channels',
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'fortnite',
            first: 5,
            live_only: true,
          }),
        })
      );
    });
  });

  describe('formatChannelInfo', () => {
    it('formats raw channel data', () => {
      const raw = {
        broadcaster_id: '123',
        broadcaster_name: 'TestChannel',
        broadcaster_language: 'en',
        game_name: 'Minecraft',
        title: 'Playing stuff',
        tags: ['English', 'Gaming'],
      };

      expect(channels.formatChannelInfo(raw)).toEqual({
        id: '123',
        name: 'TestChannel',
        language: 'en',
        game: 'Minecraft',
        title: 'Playing stuff',
        tags: ['English', 'Gaming'],
      });
    });

    it('defaults tags to empty array', () => {
      const raw = {
        broadcaster_id: '123',
        broadcaster_name: 'Test',
        broadcaster_language: 'en',
        game_name: 'Game',
        title: 'Title',
      };
      expect(channels.formatChannelInfo(raw).tags).toEqual([]);
    });

    it('returns null for null input', () => {
      expect(channels.formatChannelInfo(null)).toBeNull();
    });
  });
});
