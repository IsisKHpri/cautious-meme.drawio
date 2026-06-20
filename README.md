# cautious-meme.drawio

Twitch API integration client for Node.js, wrapping the [Twitch Helix API](https://dev.twitch.tv/docs/api/).

## Features

- **Authentication** – App access token management with automatic caching and expiry
- **Streams** – List live streams, look up by user/game, followed streams
- **Channels** – Channel info, search, modify settings, list editors
- **Chat** – Chat settings, chatters, messages, badges, emotes
- **Users** – User lookup by ID/login, followed channels, block lists

## Setup

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
```

Get credentials from the [Twitch Developer Console](https://dev.twitch.tv/console/apps).

## Usage

```js
const { TwitchClient } = require('./src');

const client = new TwitchClient();

// Search channels
const results = await client.channels.searchChannels('minecraft', { liveOnly: true });

// Get a user
const user = await client.users.getUserByLogin('twitchdev');

// Get live streams
const streams = await client.streams.getStreams({ first: 10 });
```

## Tests

```bash
npm test
```

Runs all unit tests with coverage report.
