const { TwitchChat } = require('../src/chat');

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
  return { get: jest.fn(), patch: jest.fn(), post: jest.fn() };
}

describe('TwitchChat', () => {
  let chat;
  let mockHttp;
  let mockAuth;

  beforeEach(() => {
    mockHttp = makeMockHttp();
    mockAuth = makeAuth();
    chat = new TwitchChat(makeConfig(), mockAuth, mockHttp);
  });

  describe('getChatters', () => {
    it('fetches chatters with default params', async () => {
      mockHttp.get.mockResolvedValue({
        data: { data: [{ user_id: '1', user_login: 'viewer1' }], total: 1 },
      });

      const result = await chat.getChatters('broadcaster1', 'mod1', 'user-token');

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/chatters',
        expect.objectContaining({
          params: expect.objectContaining({
            broadcaster_id: 'broadcaster1',
            moderator_id: 'mod1',
            first: 100,
          }),
        })
      );
    });

    it('supports pagination params', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });

      await chat.getChatters('b1', 'm1', 'token', { first: 50, after: 'cursor123' });

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/chatters',
        expect.objectContaining({
          params: expect.objectContaining({ first: 50, after: 'cursor123' }),
        })
      );
    });
  });

  describe('getChatSettings', () => {
    it('returns chat settings for a channel', async () => {
      const settingsData = {
        emote_mode: false,
        follower_mode: true,
        slow_mode: false,
      };
      mockHttp.get.mockResolvedValue({ data: { data: [settingsData] } });

      const result = await chat.getChatSettings('123');

      expect(result).toEqual(settingsData);
    });

    it('returns null when no settings found', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [] } });
      const result = await chat.getChatSettings('123');
      expect(result).toBeNull();
    });
  });

  describe('updateChatSettings', () => {
    it('sends only allowed fields', async () => {
      mockHttp.patch.mockResolvedValue({ data: { data: [] } });

      await chat.updateChatSettings('b1', 'm1', 'token', {
        slow_mode: true,
        slow_mode_wait_time: 30,
        invalid_field: 'ignored',
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/settings',
        { slow_mode: true, slow_mode_wait_time: 30 },
        expect.objectContaining({
          params: { broadcaster_id: 'b1', moderator_id: 'm1' },
        })
      );
    });
  });

  describe('sendChatMessage', () => {
    it('sends a message to the chat', async () => {
      mockHttp.post.mockResolvedValue({
        data: { data: [{ message_id: 'msg1', is_sent: true }] },
      });

      const result = await chat.sendChatMessage('b1', 'sender1', 'token', 'Hello!');

      expect(result.data).toHaveLength(1);
      expect(mockHttp.post).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/messages',
        {
          broadcaster_id: 'b1',
          sender_id: 'sender1',
          message: 'Hello!',
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('getChatBadges', () => {
    it('fetches badges for a channel', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [{ set_id: 'subscriber' }] } });

      const result = await chat.getChatBadges('123');

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/badges',
        expect.objectContaining({
          params: { broadcaster_id: '123' },
        })
      );
    });
  });

  describe('getGlobalBadges', () => {
    it('fetches global badges', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [{ set_id: 'vip' }] } });

      const result = await chat.getGlobalBadges();

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/badges/global',
        expect.anything()
      );
    });
  });

  describe('getEmotes', () => {
    it('fetches emotes for a channel', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [{ id: 'emote1' }] } });

      const result = await chat.getEmotes('123');

      expect(result.data).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/chat/emotes',
        expect.objectContaining({
          params: { broadcaster_id: '123' },
        })
      );
    });
  });

  describe('getGlobalEmotes', () => {
    it('fetches global emotes', async () => {
      mockHttp.get.mockResolvedValue({ data: { data: [{ id: 'global1' }] } });

      const result = await chat.getGlobalEmotes();

      expect(result.data).toHaveLength(1);
    });
  });

  describe('formatChatSettings', () => {
    it('formats raw settings data', () => {
      const raw = {
        emote_mode: true,
        follower_mode: false,
        follower_mode_duration: 0,
        slow_mode: true,
        slow_mode_wait_time: 30,
        subscriber_mode: false,
        unique_chat_mode: false,
      };

      expect(chat.formatChatSettings(raw)).toEqual({
        emoteMode: true,
        followerMode: false,
        followerModeDuration: 0,
        slowMode: true,
        slowModeWait: 30,
        subscriberMode: false,
        uniqueChatMode: false,
      });
    });

    it('returns null for null input', () => {
      expect(chat.formatChatSettings(null)).toBeNull();
    });
  });
});
