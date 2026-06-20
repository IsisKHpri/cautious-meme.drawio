const { TwitchAuth } = require('../src/auth');

function makeConfig() {
  return {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authBase: 'https://id.twitch.tv/oauth2',
  };
}

function makeMockHttp() {
  return {
    post: jest.fn(),
    get: jest.fn(),
  };
}

describe('TwitchAuth', () => {
  let auth;
  let mockHttp;

  beforeEach(() => {
    mockHttp = makeMockHttp();
    auth = new TwitchAuth(makeConfig(), mockHttp);
  });

  describe('getAppAccessToken', () => {
    it('fetches a new token from the auth endpoint', async () => {
      mockHttp.post.mockResolvedValue({
        data: { access_token: 'abc123', expires_in: 3600 },
      });

      const token = await auth.getAppAccessToken();

      expect(token).toBe('abc123');
      expect(mockHttp.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            grant_type: 'client_credentials',
          },
        }
      );
    });

    it('returns cached token if not expired', async () => {
      mockHttp.post.mockResolvedValue({
        data: { access_token: 'abc123', expires_in: 3600 },
      });

      await auth.getAppAccessToken();
      const token = await auth.getAppAccessToken();

      expect(token).toBe('abc123');
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
    });

    it('fetches new token when cached token is expired', async () => {
      mockHttp.post
        .mockResolvedValueOnce({ data: { access_token: 'old', expires_in: 0 } })
        .mockResolvedValueOnce({ data: { access_token: 'new', expires_in: 3600 } });

      await auth.getAppAccessToken();
      auth.tokenExpiry = Date.now() - 1000;
      const token = await auth.getAppAccessToken();

      expect(token).toBe('new');
      expect(mockHttp.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateToken', () => {
    it('validates a token against the auth endpoint', async () => {
      mockHttp.get.mockResolvedValue({
        data: { client_id: 'test-client-id', login: 'testuser', scopes: [] },
      });

      const result = await auth.validateToken('my-token');

      expect(result.client_id).toBe('test-client-id');
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/validate',
        { headers: { Authorization: 'OAuth my-token' } }
      );
    });
  });

  describe('revokeToken', () => {
    it('revokes the token and clears cached state', async () => {
      mockHttp.post.mockResolvedValue({});

      auth.accessToken = 'cached';
      auth.tokenExpiry = Date.now() + 10000;

      await auth.revokeToken('cached');

      expect(auth.accessToken).toBeNull();
      expect(auth.tokenExpiry).toBeNull();
      expect(mockHttp.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/revoke',
        null,
        { params: { client_id: 'test-client-id', token: 'cached' } }
      );
    });
  });

  describe('getAuthHeaders', () => {
    it('returns correct headers', () => {
      const headers = auth.getAuthHeaders('my-token');
      expect(headers).toEqual({
        'Client-ID': 'test-client-id',
        Authorization: 'Bearer my-token',
      });
    });
  });

  describe('isTokenExpired', () => {
    it('returns true when no token expiry is set', () => {
      expect(auth.isTokenExpired()).toBe(true);
    });

    it('returns true when token is expired', () => {
      auth.tokenExpiry = Date.now() - 1000;
      expect(auth.isTokenExpired()).toBe(true);
    });

    it('returns false when token is still valid', () => {
      auth.tokenExpiry = Date.now() + 60000;
      expect(auth.isTokenExpired()).toBe(false);
    });
  });
});
