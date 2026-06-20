const { TwitchStreams } = require('../src/streams');

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
  return { get: jest.fn() };
}

describe('TwitchStreams', () => {
  let streams;
  let mockHttp;
  let mockAuth;

  beforeEach(() => {
    mockHttp = makeMockHttp();
    mockAuth = makeAuth();
    streams = new TwitchStreams(makeConfig(), mockAuth, mockHttp);
  });

  describe('getStreams', () => {
    it('fetches streams with default params', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ id: '1', user_name: 'streamer1' }] },
      });

      const result = await streams.getStreams();

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/streams',
        expect.objectContaining({
          params: expect.objectContaining({ first: 20 }),
        })
      );
    });

    it('passes custom params', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      await streams.getStreams({ first: 5, gameId: '123', language: 'en' });

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/streams',
        expect.objectContaining({
          params: expect.objectContaining({
            first: 5,
            game_id: '123',
            language: 'en',
          }),
        })
      );
    });
  });

  describe('getStreamByUser', () => {
    it('returns stream data for a user', async () => {
      const streamData = { id: '1', user_name: 'streamer1', type: 'live' };
      mockHttp.get.mockResolvedValue({ data: { data: [streamData] } });

      const result = await streams.getStreamByUser('12345');

      expect(result).toEqual(streamData);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/streams',
        expect.objectContaining({
          params: { user_id: '12345' },
        })
      );
    });

    it('returns null when user is not streaming', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      const result = await streams.getStreamByUser('12345');

      expect(result).toBeNull();
    });
  });

  describe('getStreamsByGame', () => {
    it('fetches streams for a game with a limit', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ id: '1', game_name: 'Minecraft' }] },
      });

      await streams.getStreamsByGame('456', 10);

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/streams',
        expect.objectContaining({
          params: { game_id: '456', first: 10 },
        })
      );
    });
  });

  describe('getFollowedStreams', () => {
    it('fetches followed streams with user access token', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ id: '1' }] },
      });

      await streams.getFollowedStreams('user1', 'user-token');

      expect(mockAuth.getAuthHeaders).toHaveBeenCalledWith('user-token');
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/streams/followed',
        expect.objectContaining({
          params: { user_id: 'user1' },
        })
      );
    });
  });

  describe('formatStreamInfo', () => {
    it('formats stream data into a clean object', () => {
      const raw = {
        id: '1',
        user_name: 'TestStreamer',
        title: 'Playing games',
        game_name: 'Minecraft',
        viewer_count: 1234,
        started_at: '2024-01-01T00:00:00Z',
        thumbnail_url: 'https://example.com/thumb.jpg',
        type: 'live',
      };

      const formatted = streams.formatStreamInfo(raw);

      expect(formatted).toEqual({
        id: '1',
        user: 'TestStreamer',
        title: 'Playing games',
        game: 'Minecraft',
        viewers: 1234,
        startedAt: '2024-01-01T00:00:00Z',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        isLive: true,
      });
    });

    it('returns null for null input', () => {
      expect(streams.formatStreamInfo(null)).toBeNull();
    });

    it('sets isLive to false for non-live streams', () => {
      const raw = {
        id: '1',
        user_name: 'Test',
        title: 'VOD',
        game_name: 'Game',
        viewer_count: 0,
        started_at: '',
        thumbnail_url: '',
        type: 'rerun',
      };
      expect(streams.formatStreamInfo(raw).isLive).toBe(false);
    });
  });
});
