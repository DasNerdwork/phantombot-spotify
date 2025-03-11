# Phantombot - Spotify

Ein kleines Skript zur Verbindung vom Twitchbot 'Phantombot' mit Spotify, wodurch die Nutzung der `!spotify` und `!spotifyAuth` Befehle ermöglicht wird.

## Spotify API Daten

Für die Nutzung des Spotify-Features werden Spotify API-Daten benötigt. Diese Daten müssen in einer Datei namens `./addons/spotifyConfig.json` im folgenden Format gespeichert werden:

```json
{
    "filePath": "./addons/spotifyAccountCode.txt",
    "tokenFilePath": "./addons/spotifyTokens.json",
    "clientId": "12345678901234567890",
    "clientSecret": "12345678901234567890",
    "redirectUri": "https://127.0.0.1:8888/callback"
}
```

### Wie man die API-Daten erhält:

1. Gehe auf [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).
2. Melde dich mit deinem Spotify-Konto an.
3. Erstelle eine neue Anwendung, um deine `clientId` und `clientSecret` zu erhalten.
4. Verwende die `redirectUri` deiner Wahl, z. B. `https://127.0.0.1:8888/callback` für lokale Tests.

## Einrichtungsprozess

Um Phantombot mit Spotify zu verbinden, befolge die folgenden Schritte:

1. Gib im Twitch-Chat den Befehl `!spotifyAuth` ein, um den Link zur Spotify-Freigabe zu erhalten.
2. Gehe auf den Link und autorisiere die Anwendung.
3. Kopiere den erhaltenen Code aus der Weiterleitungs-URL.
4. Füge den Code entweder manuell in die Datei `./addons/spotifyAccountCode.txt` ein oder verwende den Befehl `!spotifyAuth <code>`, um den Code direkt zu setzen.
5. Wenn alles erfolgreich war, kannst du nun mit dem Befehl `!spotify <track_url>` Tracks in die Warteschlange stellen. Zum Beispiel:

`!spotify https://open.spotify.com/intl-de/track/2PnlsTsOTLE5jnBnNe2K0A?si=824aa38c87364da5`

Dies fügt den angegebenen Track zur Spotify-Warteschlange hinzu.

Viel Spaß beim Musikhören! 🎶
