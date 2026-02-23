# PhantomBot Spotify Song Request Script

## Project Overview

This is a **Spotify API music bot script** that runs on [PhantomBot](https://phantombot.github.io/). It allows Twitch viewers to add songs to the queue via Spotify links or search terms.

**Bot Details:**
- Bot User: `KonzuBot`
- Twitch Channel: [yellow_junky](https://www.twitch.tv/yellow_junky)

---

## Service Management

PhantomBot runs as a systemd service and can be managed as follows:

```bash
service phantombot-junky status
service phantombot-junky restart
service phantombot-junky stop
service phantombot-junky start
```

---

## Logging & Debugging

### Main Log File
Script execution logs are located at:
```
/home/botuser/phantombot-junky/logs/js-error/YYYY-MM-DD.txt
```

**Example log entries:**
```
[02-23-2026 @ 05:00:22.735 GMT] [songRequest.js:408] 🚀 Spotify Song Request Skript erfolgreich initialisiert.
[02-23-2026 @ 05:00:19.415 GMT] [heizoelCommand.js:92] 🛢 Heizölpreis-Checker geladen. Nutze !heizöl im Chat.
```

> **Note:** Only entries from `songRequest.js` are relevant for this script.

### Custom Log Function (for Testing)

The script has its own logging function for testing purposes:

```javascript
function log(type, message) {
    createLogFolder();
    var logFile = new java.io.File(getLogFileName());
    var writer = new java.io.BufferedWriter(new java.io.FileWriter(logFile, true));
    var timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
    writer.write("[" + timestamp + "] ["+type.toUpperCase()+"]: " + message + "\n");
    writer.close();
}
```

**Log file path:** `/home/botuser/phantombot-junky/logs/spotify/YYYY-MM-DD.txt`

> ⚠️ **IMPORTANT:** This `log()` function should be used **exclusively** for testing new features. Do not use any other internal logging methods!

---

## Technical Details

### Rhino JavaScript Engine (Java + JavaScript Hybrid)

PhantomBot uses the **Rhino JavaScript Engine**, meaning the code is a mix of JavaScript and Java. This requires special syntax:

- Java classes are referenced via `Packages` or `java`
- Example: `new java.io.File()`, `new java.text.SimpleDateFormat()`
- HTTP requests use PhantomBot's internal HttpClient API:
  ```javascript
  let uri = Packages.com.gmt2001.httpclient.URIUtil.create(url);
  let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
  let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);
  ```

### Configuration Files

| File | Path | Description |
|------|------|-------------|
| Spotify Config | `/home/botuser/phantombot-junky/addons/spotifyConfig.json` | API credentials, redirect URI |
| Spotify Tokens | `/home/botuser/phantombot-junky/addons/spotifyTokens.json` | Access/Refresh tokens |
| Translations | `/home/botuser/phantombot-junky/addons/spotifyLang.json` | Language strings for chat output |
| Account Code | `/home/botuser/phantombot-junky/addons/spotifyAccountCode.txt` | OAuth authorization code |

### Translation System

Texts are stored translatable in a JSON file:

```javascript
var lang = loadConfig("./addons/spotifyLang.json");

function translate(key, replacements) {
    var str = lang[key] || key;
    if (replacements) {
        for (var k in replacements) {
            str = str.replace(new RegExp("{{" + k + "}}", "g"), replacements[k]);
        }
    }
    return str;
}
```

---

## Spotify API Integration

> ✅ **The Spotify API config, connection, and token refresh are already working and should NOT be modified!**

### Available Chat Commands

| Command | Permission | Description |
|---------|------------|-------------|
| `!song` | All Users | Shows the currently playing song |
| `!queue` | All Users | Shows upcoming songs in the queue |
| `!spotify <link/search>` | Mods | Adds a song to the queue |
| `!spotifyAuth` | Mods | Initiates OAuth flow for Spotify |

---

## Helper Functions

The script contains several helper functions for various tasks:

- `convertToBase64(input)` - Base64 encoding
- `readFromFile(path)` - Read file
- `saveToFile(path, data)` - Write file
- `loadConfig(path)` - Load and parse JSON file
- `loadTokens()` / `saveTokens()` - Token management
- `extractSpotifyId(url)` - Extract track ID from URL
- `createLogFolder()` / `getLogFileName()` / `log()` - Logging utilities
- `getTrackInfo(trackId)` - Fetch track info from API
- `getCurrentTrack()` - Currently playing track
- `getUpcomingTracks()` - Queue preview
- `addToQueue(spotifyInput, sender)` - Add song to queue
- `refreshAccessToken()` / `requestAccessToken(code)` - OAuth token management

---

## Important Notes for Changes

### Do Not Modify Special Cases

Some "special cases" in the code are intentionally implemented and should **not** be changed:

```javascript
loadTokens(); // Doppelt hält besser
```

These comments mark deliberate design decisions.

### Song Duration Limit

Songs longer than 10 minutes (600,000ms) are not added:
```javascript
if (trackInfo && trackInfo.duration >= 600000) {
    // Song is rejected
}
```

---

## Git Commit Standards

When committing to this repository, we follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>
```

**Examples:**
```
fix(api): adjusted endpoint configuration
feat(queue): added song duration limit
docs(readme): updated installation instructions
refactor(log): improved logging function
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance, build changes

---

## File Structure

```
/home/botuser/phantombot-junky/
├── scripts/
│   └── custom/
│       ├── songRequest.js      # Main script (this repository)
│       ├── .gitignore
│       ├── .git/               # Git repository
│       └── AGENTS.md           # This file
├── addons/
│   ├── spotifyConfig.json      # API configuration
│   ├── spotifyTokens.json      # OAuth tokens
│   ├── spotifyLang.json        # Translations
│   └── spotifyAccountCode.txt  # Auth code
└── logs/
    ├── js-error/               # PhantomBot logs
    └── spotify/                # Custom Spotify logs