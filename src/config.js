const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
const TWITCH_AUTH_BASE = 'https://id.twitch.tv/oauth2';

function loadConfig(env = process.env) {
  const clientId = env.TWITCH_CLIENT_ID;
  const clientSecret = env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Twitch credentials. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables.'
    );
  }

  return {
    clientId,
    clientSecret,
    apiBase: env.TWITCH_API_BASE || TWITCH_API_BASE,
    authBase: env.TWITCH_AUTH_BASE || TWITCH_AUTH_BASE,
  };
}

module.exports = { loadConfig, TWITCH_API_BASE, TWITCH_AUTH_BASE };
