# PhantomBot Spotify Song Request Skript

## Projektübersicht

Dies ist ein **Spotify-API-Musikbot-Skript**, das über [PhantomBot](https://phantombot.github.io/) läuft. Es ermöglicht Twitch-Zuschauern, Songs über Spotify-Links oder Suchbegriffe zur Warteschlange hinzuzufügen.

**Bot-Details:**
- Bot-User: `KonzuBot`
- Twitch-Kanal: [yellow_junky](https://www.twitch.tv/yellow_junky)

---

## Service Management

Der PhantomBot läuft als Systemd-Service und kann wie folgt verwaltet werden:

```bash
service phantombot-junky status
service phantombot-junky restart
service phantombot-junky stop
service phantombot-junky start
```

---

## Logging & Debugging

### Haupt-Logdatei
Die Logs der Skript-Ausführung befinden sich unter:
```
/home/botuser/phantombot-junky/logs/js-error/YYYY-MM-DD.txt
```

**Beispiel-Logeinträge:**
```
[02-23-2026 @ 05:00:22.735 GMT] [songRequest.js:408] 🚀 Spotify Song Request Skript erfolgreich initialisiert.
[02-23-2026 @ 05:00:19.415 GMT] [heizoelCommand.js:92] 🛢 Heizölpreis-Checker geladen. Nutze !heizöl im Chat.
```

> **Wichtig:** Für dieses Skript sind nur die Einträge von `songRequest.js` relevant.

### Eigene Log-Funktion (für Tests)

Das Skript verfügt über eine eigene Logging-Funktion für Testzwecke:

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

**Log-Dateipfad:** `/home/botuser/phantombot-junky/logs/spotify/YYYY-MM-DD.txt`

> ⚠️ **WICHTIG:** Diese `log()` Funktion soll **ausschließlich** zum Testen von neuen Features verwendet werden. Keine andere interne Logging-Methode nutzen!

---

## Technische Besonderheiten

### Rhino JavaScript Engine (Java + JavaScript Hybrid)

PhantomBot verwendet die **Rhino JavaScript Engine**, was bedeutet, dass der Code eine Mischung aus JavaScript und Java ist. Dies erfordert spezielle Syntax:

- Java-Klassen werden über `Packages` oder `java` referenziert
- Beispiel: `new java.io.File()`, `new java.text.SimpleDateFormat()`
- HTTP-Requests nutzen PhantomBot's interne HttpClient-API:
  ```javascript
  let uri = Packages.com.gmt2001.httpclient.URIUtil.create(url);
  let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
  let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);
  ```

### Konfigurationsdateien

| Datei | Pfad | Beschreibung |
|-------|------|--------------|
| Spotify Config | `/home/botuser/phantombot-junky/addons/spotifyConfig.json` | API-Credentials, Redirect-URI |
| Spotify Tokens | `/home/botuser/phantombot-junky/addons/spotifyTokens.json` | Access/Refresh Tokens |
| Übersetzungen | `/home/botuser/phantombot-junky/addons/spotifyLang.json` | Sprachstrings für Chat-Ausgaben |
| Account Code | `/home/botuser/phantombot-junky/addons/spotifyAccountCode.txt` | OAuth-Authorization-Code |

### Übersetzungssystem

Texte werden übersetzbar in einer JSON-Datei gespeichert:

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

> ✅ **Die Spotify API Config, Verbindung und Token-Erneuerung funktionieren bereits und sollen NICHT angepasst werden!**

### Verfügbare Chat-Befehle

| Befehl | Berechtigung | Beschreibung |
|--------|--------------|--------------|
| `!song` | Alle User | Zeigt den aktuell gespielten Song |
| `!queue` | Alle User | Zeigt die nächsten Songs in der Warteschlange |
| `!spotify <link/suche>` | Mods | Fügt einen Song zur Queue hinzu |
| `!spotifyAuth` | Mods | Startet OAuth-Flow für Spotify |

---

## Helper-Funktionen

Das Skript enthält mehrere Helper-Funktionen für verschiedene Aufgaben:

- `convertToBase64(input)` - Base64-Kodierung
- `readFromFile(path)` - Datei lesen
- `saveToFile(path, data)` - Datei schreiben
- `loadConfig(path)` - JSON-Datei laden und parsen
- `loadTokens()` / `saveTokens()` - Token-Management
- `extractSpotifyId(url)` - Track-ID aus URL extrahieren
- `createLogFolder()` / `getLogFileName()` / `log()` - Logging-Utilities
- `getTrackInfo(trackId)` - Track-Infos von API abrufen
- `getCurrentTrack()` - Aktuell spielender Track
- `getUpcomingTracks()` - Queue-Vorschau
- `addToQueue(spotifyInput, sender)` - Song zur Queue hinzufügen
- `refreshAccessToken()` / `requestAccessToken(code)` - OAuth-Token-Management

---

## Wichtige Hinweise für Änderungen

### Sonderfälle nicht ändern

Manche "Sonderfälle" im Code sind bewusst so implementiert und sollen **nicht** geändert werden:

```javascript
loadTokens(); // Doppelt hält besser
```

Diese Kommentare markieren bewusste Design-Entscheidungen.

### Song-Längen-Limit

Songs länger als 10 Minuten (600.000ms) werden nicht hinzugefügt:
```javascript
if (trackInfo && trackInfo.duration >= 600000) {
    // Song wird abgelehnt
}
```

---

## Git Commit Standards

Bei Commits in dieses Repository halten wir uns an die **Conventional Commits** Spezifikation:

```
<type>(<scope>): <description>
```

**Beispiele:**
```
fix(api): adjusted endpoint configuration
feat(queue): added song duration limit
docs(readme): updated installation instructions
refactor(log): improved logging function
```

**Types:**
- `feat` - Neue Features
- `fix` - Bugfixes
- `docs` - Dokumentation
- `refactor` - Code-Refactoring
- `test` - Tests
- `chore` - Wartung, Build-Änderungen

---

## Dateistruktur

```
/home/botuser/phantombot-junky/
├── scripts/
│   └── custom/
│       ├── songRequest.js      # Hauptskript (dieses Repository)
│       ├── .gitignore
│       ├── .git/               # Git-Repository
│       └── AGENTS.md           # Diese Datei
├── addons/
│   ├── spotifyConfig.json      # API-Konfiguration
│   ├── spotifyTokens.json      # OAuth-Tokens
│   ├── spotifyLang.json        # Übersetzungen
│   └── spotifyAccountCode.txt  # Auth-Code
└── logs/
    ├── js-error/               # PhantomBot Logs
    └── spotify/                # Eigene Spotify-Logs