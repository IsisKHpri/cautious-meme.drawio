const { TwitchUsers } = require('../src/users');

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

describe('TwitchUsers', () => {
  let users;
  let mockHttp;
  let mockAuth;

  beforeEach(() => {
    mockHttp = makeMockHttp();
    mockAuth = makeAuth();
    users = new TwitchUsers(makeConfig(), mockAuth, mockHttp);
  });

  describe('getUsers', () => {
    it('fetches users by IDs', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ id: '1', login: 'user1' }] },
      });

      const result = await users.getUsers({ ids: ['1'] });

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        expect.objectContaining({
          params: { id: ['1'] },
        })
      );
    });

    it('fetches users by logins', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ id: '1', login: 'testuser' }] },
      });

      const result = await users.getUsers({ logins: ['testuser'] });

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        expect.objectContaining({
          params: { login: ['testuser'] },
        })
      );
    });

    it('sends empty params when no filters given', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      await users.getUsers();

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        expect.objectContaining({ params: {} })
      );
    });
  });

  describe('getUserById', () => {
    it('returns a single user by ID', async () => {
      const userData = { id: '123', login: 'testuser', display_name: 'TestUser' };
      mockHttp.get.mockResolvedValue({ data: { data: [userData] } });

      const result = await users.getUserById('123');

      expect(result).toEqual(userData);
    });

    it('returns null when user not found', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      const result = await users.getUserById('999');

      expect(result).toBeNull();
    });
  });

  describe('getUserByLogin', () => {
    it('returns a single user by login name', async () => {
      const userData = { id: '123', login: 'testuser' };
      mockHttp.get.mockResolvedValue({ data: { data: [userData] } });

      const result = await users.getUserByLogin('testuser');

      expect(result).toEqual(userData);
    });

    it('returns null when user not found', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      const result = await users.getUserByLogin('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getFollowedChannels', () => {
    it('fetches followed channels with default params', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ broadcaster_id: '1' }], total: 1 },
      });

      const result = await users.getFollowedChannels('user1', 'user-token');

      expect(result.total).toBe(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/channels/followed',
        expect.objectContaining({
          params: expect.objectContaining({
            user_id: 'user1',
            first: 20,
          }),
        })
      );
    });

    it('supports custom pagination params', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      await users.getFollowedChannels('user1', 'token', { first: 5, after: 'abc' });

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/channels/followed',
        expect.objectContaining({
          params: { user_id: 'user1', first: 5, after: 'abc' },
        })
      );
    });
  });

  describe('getBlockList', () => {
    it('fetches block list with default params', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ user_id: '999' }] },
      });

      const result = await users.getBlockList('broadcaster1', 'token');

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users/blocks',
        expect.objectContaining({
          params: expect.objectContaining({
            broadcaster_id: 'broadcaster1',
            first: 20,
          }),
        })
      );
    });
  });

  describe('formatUserInfo', () => {
    it('formats raw user data', () => {
      const raw = {
        id: '123',
        login: 'testuser',
        display_name: 'TestUser',
        type: '',
        broadcaster_type: 'affiliate',
        description: 'Hello world',
        profile_image_url: 'https://example.com/photo.jpg',
        created_at: '2020-01-01T00:00:00Z',
      };

      expect(users.formatUserInfo(raw)).toEqual({
        id: '123',
        login: 'testuser',
        displayName: 'TestUser',
        type: '',
        broadcasterType: 'affiliate',
        description: 'Hello world',
        profileImageUrl: 'https://example.com/photo.jpg',
        createdAt: '2020-01-01T00:00:00Z',
      });
    });

    it('returns null for null input', () => {
      expect(users.formatUserInfo(null)).toBeNull();
    });
  });
});
