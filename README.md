# PhantomBot - Spotify Integration

A script that connects the Twitch bot [PhantomBot](https://phantombot.github.io/) with Spotify, enabling `!spotify` and `!spotifyAuth` commands for song requests.

## Bot Details

- **Bot User:** `KonzuBot`
- **Twitch Channel:** [yellow_junky](https://www.twitch.tv/yellow_junky)

---

## Configuration

### Spotify API Credentials

Create a file at `./addons/spotifyConfig.json`:

```json
{
    "filePath": "./addons/spotifyAccountCode.txt",
    "tokenFilePath": "./addons/spotifyTokens.json",
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUri": "https://127.0.0.1:8888/callback"
}
```

### Language File

Create a file at `./addons/spotifyLang.json` for customizable chat messages:

```json
{
    "song_added": "✅ '{{track}}' - {{artist}}",
    "song_added_simple": "✅ +1",
    "invalid_link": "❌ Format: https://open.spotify.com/intl-de/track/...",
    "add_to_queue_exception": "❌ There was a problem adding to the queue.",
    "auth_link": "🔗 Spotify Auth Link: {{url}}",
    "auth_saved": "🔐 Auth code saved successfully.",
    "auth_hint": "🔑 Please authorize your Spotify account with !spotifyAuth <code>",
    "error": "❌ Error: {{error}}",
    "invalid_permission": "❌ You must be a moderator to use this command!",
    "song_null": "❌ No song playing",
    "song_current": "🎶 {{track}} - {{artist}}",
    "song_too_long": "⏱️ '{{track}}' by {{artist}} is too long ({{duration}} min). Maximum is 10 minutes."
}
```

---

## Setup Guide

### Step 1: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Log in with your Spotify account
3. Create a new application to get your `clientId` and `clientSecret`
4. Set a `redirectUri` (e.g., `https://127.0.0.1:8888/callback` for local testing)
5. **Important:** Add the Spotify account email as a user in the app's "User Management" section

### Step 2: Connect PhantomBot to Spotify

1. Type `!spotifyAuth` in Twitch chat to get the authorization link
2. Open the link and authorize the application
3. Copy the code from the redirect URL
4. Either:
   - Manually paste it into `./addons/spotifyAccountCode.txt`, or
   - Use `!spotifyAuth <code>` in chat

### Step 3: Use It!

Add songs to the queue:

```
!spotify https://open.spotify.com/track/2PnlsTsOTLE5jnBnNe2K0A
```

Or search by name:

```
!spotify Never Gonna Give You Up
```

---

## Available Commands

| Command | Permission | Description |
|---------|------------|-------------|
| `!song` | Everyone | Shows the currently playing song |
| `!queue` | Everyone | Shows upcoming songs in the queue |
| `!spotify <link/search>` | Moderators | Adds a song to the queue |
| `!spotifyAuth` | Moderators | Initiates Spotify OAuth flow |
| `!spotifyAuth <code>` | Moderators | Saves the OAuth authorization code |

---

## Notes

- Songs longer than 10 minutes are automatically rejected
- The Spotify API integration handles token refresh automatically
- For issues, check the logs at `/home/botuser/phantombot-junky/logs/js-error/YYYY-MM-DD.txt`

Happy listening! 🎶