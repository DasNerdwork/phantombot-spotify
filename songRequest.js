(function() {
    var config = loadConfig("./addons/spotifyConfig.json");
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
    
    // Initialisierung der Variablen aus der Konfiguration
    var filePath = config.filePath || './addons/spotifyAccountCode.txt';
    var tokenFilePath = config.tokenFilePath || './addons/spotifyTokens.json';
    var CLIENT_ID = config.clientId;
    var CLIENT_SECRET = config.clientSecret;
    var BASE64_CODE = convertToBase64(CLIENT_ID + ":" + CLIENT_SECRET);
    var REDIRECT_URI = config.redirectUri || "https://127.0.0.1:8888/callback";
    // Initialisierung der Variablen zu Skriptstart
    var ACCESS_TOKEN = null;
    var REFRESH_TOKEN = null;
    var EXPIRES_AT = 0;
    var attempt = 1;

    // --- Kleinere Helperfunktionen ---
    // Konvertiert den übergebenen Input in einen Base64 kodierten String.
    function convertToBase64(input) {
        var Base64 = Packages.java.util.Base64;
        var encoder = Base64.getEncoder();
        var encoded = encoder.encodeToString(new java.lang.String(input).getBytes("UTF-8"));
        return encoded;
    }

    // Liest den Inhalt einer Datei und gibt die Datei zurück.
    function readFromFile(path) {
        var file = new java.io.File(path);
        if (!file.exists()) {
            return null;
        }
        var reader = new java.io.BufferedReader(new java.io.FileReader(file));
        var line;
        var content = "";
        while ((line = reader.readLine()) != null) {
            content += line + "\n";
        }
        reader.close();
        return content.trim();
    }
    

    // Speichert die übergebenen Daten in einer Datei.
    function saveToFile(path, data) {
        var file = new java.io.File(path);
        var writer = new java.io.BufferedWriter(new java.io.FileWriter(file));
        writer.write(data);
        writer.close();
    }

    // Liefert eine .json Dateie als geparstes JSON Objekt zurück.
    function loadConfig(path) {
        var json = readFromFile(path);
        if (json) {
            var config = JSON.parse(json);
            return config;
        }
        return {};
    }

    // Lädt die Variablen vom konfigurierten Dateipfad in die Laufzeitumgebung (Variablen Anpassung während das Skript läuft).
    function loadTokens() {
        var json = readFromFile(tokenFilePath);
        if (json) {
            var tokens = JSON.parse(json);
            ACCESS_TOKEN = tokens.access_token;
            REFRESH_TOKEN = tokens.refresh_token;
            EXPIRES_AT = tokens.expires_at;
        }
    }

    // Speichert die erhaltenen API Tokens im konfigurierten Dateipfad.
    function saveTokens(accessToken, refreshToken, expiresIn) {
        var expiresAt = Date.now() + expiresIn * 1000;
        var data = JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
        });
        saveToFile(tokenFilePath, data);
    }
  
    // Regex zum extrahieren des ID Parts der Spotify URL
    function extractSpotifyId(url) {
        var match = url.match(/track\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    // Erstellt den benutzerdefinierten Spotify Log ordner
    function createLogFolder() {
        var logFolder = new java.io.File("/home/botuser/phantombot2/logs/spotify/");
        if (!logFolder.exists()) {
            logFolder.mkdirs();
        }
    }
    
    // Funktion zum Erstellen der Spotify Log-Datei mit aktuellem Datum
    function getLogFileName() {
        var date = new java.util.Date();
        var sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        return "/home/botuser/phantombot2/logs/spotify/" + sdf.format(date) + ".txt";
    }
    
    // Funktion zum Hinzufügen eines Logs in die Datei
    function log(type, message) {
        createLogFolder();
        var logFile = new java.io.File(getLogFileName());
        var writer = new java.io.BufferedWriter(new java.io.FileWriter(logFile, true));
        var timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
        writer.write("[" + timestamp + "] ["+type.toUpperCase()+"]: " + message + "\n");
        writer.close();
    }

    // --- Hauptfunktionen ---
    /**
     * Ruft Informationen zu einem bestimmten Track von der Spotify API ab.
     * @function getTrackInfo
     * @param {string} trackId - Die ID des Tracks, dessen Informationen abgerufen werden sollen
     * @returns {Object|null} - Ein Objekt mit den Track-Infos oder null bei einem Fehler
     */
    function getTrackInfo(trackId) {
        var apiUrl = "https://api.spotify.com/v1/tracks/" + trackId;
    
        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(apiUrl);
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Authorization", "Bearer " + ACCESS_TOKEN);
    
        let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);
    
        if (response.hasException()) {
            log("error","❌ Fehler beim Abrufen der Track-Infos: " + response.exception().toString());
            return null;
        } else if (response.isSuccess()) {
            let apiResponse = JSON.parse($.jsString(response.responseBody()));
            let trackName = apiResponse.name;
            let artistName = apiResponse.artists[0].name;
            let duration = apiResponse.duration_ms;
            return { trackName, artistName, duration };
        } else {
            log("error","❌ Fehler beim Abrufen der Track-Infos mit Statuscode: " + response.responseCode().code());
            let apiResponse = JSON.parse($.jsString(response.responseBody()));
            log("info",apiResponse);
            return null;
        }
    }

    /**
     * Fügt einen Track zur Spotify-Warteschlange hinzu.
     * @function addToQueue
     * @param {string} spotifyInput - Die Spotify-URL des Tracks, der hinzugefügt werden soll
     * @param {string} sender - Der Benutzer, der den Befehl ausgeführt hat
     */
    function addToQueue(spotifyInput, sender) {
        if (Date.now() >= EXPIRES_AT){
            log("warning","⚠️ Spotify Access Token abgelaufen, versuche zu aktualisieren!");
            refreshAccessToken();
        }

        var trackId = extractSpotifyId(spotifyInput);
        if (!trackId) {
            log("info", "🔍 Kein gültiger Spotify-Link erkannt, versuche " + spotifyInput + " über die Spotify-Suche zu finden...");

            let searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(spotifyInput)}&type=track&limit=3`;

            let uri = Packages.com.gmt2001.httpclient.URIUtil.create(searchUrl);
            let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
            headers.add("Authorization", "Bearer " + ACCESS_TOKEN);
            let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);

            if (response.hasException() || !response.isSuccess()) {
                log("error", "❌ Fehler bei der Spotify-Suche: " + response.exception().toString());
                $.say("Es gab ein Problem bei der Spotify-Suche.");
                return;
            }

            let responseBody = $.jsString(response.responseBody());
            log("debug", "Antwort von Spotify-Suche: " + responseBody);

            let body;
            try {
                body = JSON.parse(responseBody);
            } catch (e) {
                log("error", "❌ Fehler beim Parsen der Spotify-Antwort: " + e.message);
                $.say("Die Antwort von Spotify konnte nicht gelesen werden.");
                return;
            }
            if (!body.tracks || !body.tracks.items || body.tracks.items.length === 0) {
                $.say("Kein passender Song auf Spotify gefunden.");
                return;
            }

            trackId = body.tracks.items[0].id;
            log("info", "🎯 Gefundener Track: " + body.tracks.items[0].name + " von " + body.tracks.items[0].artists[0].name);
        } else {
            log("info", "🎵 Track-ID extrahiert: " + trackId);
        }

        let trackInfo = getTrackInfo(trackId);
        if (!trackInfo) {
            log("error", "❌ Konnte Track-Infos nicht abrufen.");
            $.say(translate("invalid_link"));
            return;
        }

        if (trackInfo && trackInfo.duration >= 600000) {
            log("info", "⏱️ Track '" + trackInfo.trackName + "' ist länger als 10 Minuten (" + Math.round(trackInfo.duration / 60000) + "min) — wird nicht hinzugefügt.");
            $.say(translate("song_too_long", {track: trackInfo.trackName, artist: trackInfo.artistName, duration: Math.round(trackInfo.duration / 60000) }));
            return;
        }

        var apiUrl = "https://api.spotify.com/v1/me/player/queue?uri=spotify:track:" + trackId;
        log("info","🕒 Versuche Song der Spotify Warteschlange hinzuzufügen...");

        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(apiUrl);
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Authorization", "Bearer " + ACCESS_TOKEN);
        let response = Packages.com.gmt2001.httpclient.HttpClient.post(uri, headers, '');

        if (response.hasException()) {
            log("error","❌ Fehler beim Hinzufügen zur Warteschlange: " + response.exception().toString());
            $.say($.whisperPrefix(sender) + translate("add_to_queue_exception"));
        } else if (response.isSuccess()) {
            let trackInfo = getTrackInfo(trackId);
            attempt = 1;
            if (trackInfo) {
                log("info","✅ Der Song '" + trackInfo.trackName + "' von " + trackInfo.artistName + " wurde zur Warteschlange hinzugefügt!");
                $.say(translate("song_added", {track: trackInfo.trackName, artist: trackInfo.artistName}));
            } else {
                $.say(translate("song_added_simple"));
            }
        } else if(response.responseCode().code() === 401){
            log("warning","⚠️ AddToQueue fehlgeschlagen, AccessToken invalide -> Versuche RefreshAccessToken()");
            let apiResponse = $.jsString(response.responseBody());
            log("info",apiResponse);
            refreshAccessToken();
            
            if (attempt < 4) {
                log("info","🔄 Versuche erneut... (" + attempt + "/3)");
                attempt++;
                addToQueue(spotifyInput, sender);
            } else {
                log("error","❌ Nach 3 Versuchen konnte der Song nicht zur Warteschlange hinzugefügt werden.");
            }
        }
    }

    function getUpcomingTracks() {
        if (Date.now() >= EXPIRES_AT){
            log("warning","⚠️ Spotify Access Token abgelaufen, versuche zu aktualisieren!");
            refreshAccessToken();
        }

        var apiUrl = "https://api.spotify.com/v1/me/player/queue";
        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(apiUrl);
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Authorization", "Bearer " + ACCESS_TOKEN);
        let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);

        if (response.hasException()) {
            log("error","❌ Fehler beim Abrufen der Player-Infos: " + response.exception().toString());
            $.say(translate("fetch_player_exception"));
            return;
        } else if (response.isSuccess()) {
            let apiResponse = JSON.parse($.jsString(response.responseBody()));
            let queuePreview = [];

            if (apiResponse && apiResponse.currently_playing) {
                let currentTrack = apiResponse.currently_playing;
                queuePreview.push("🎶 1. " + currentTrack.name + " - " + currentTrack.artists[0].name);
            } else {
                queuePreview.push("❌ Es wird derzeit kein Song gespielt.");
            }

            if (apiResponse && apiResponse.queue && apiResponse.queue.length > 0) {
                for (var i = 1; i < Math.min(5, apiResponse.queue.length); i++) {
                    let track = apiResponse.queue[i];
                    queuePreview.push((i+1) + ". " + track.name + " - " + track.artists[0].name);
                }
            } else {
                queuePreview.push("ℹ️ Keine weiteren Tracks in der Warteschlange sichtbar.");
            }

            $.say(queuePreview.join(" -> "));
        } else {
            log("error","❌ Fehler beim Abrufen der Player-Infos mit Statuscode: " + response.responseCode().code());
            $.say(translate("fetch_player_error"));
        }
    }

    /**
     * Leitet den Benutzer zur Spotify-Authentifizierung weiter.
     * @function redirectToSpotifyAuth
     */
    function redirectToSpotifyAuth() {
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&&scope=user-modify-playback-state%20user-read-currently-playing%20user-read-playback-state`;
        log("info","Bitte gehe zu diesem Link und autorisiere die App: " + authUrl);
        $.say(translate("auth_link" , {url: authUrl}));
    }

    /**
     * Erneuert das Access Token, wenn es abgelaufen ist.
     * @function refreshAccessToken
     */
    function refreshAccessToken() {
        log("info","🔄 Access Token wird erneuert...");
        const url = "https://accounts.spotify.com/api/token";
        const data = `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}`;
        
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Authorization", "Basic " + BASE64_CODE);
        headers.add("Content-Type", "application/x-www-form-urlencoded"); 
        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(url);
        let response = Packages.com.gmt2001.httpclient.HttpClient.post(uri, headers, data);
        
        if (response.hasException()) {
            log("error","❌ Fehler beim Aktualisieren des Access Tokens: " + response.exception().toString());
        } else if (response.isSuccess()) {
            let apiResponse = $.jsString(response.responseBody());
            var res = JSON.parse(apiResponse);
            saveTokens(res.access_token, res.refresh_token || REFRESH_TOKEN, res.expires_in);   //  || REFRESH_TOKEN notwendig weil wegen möglichem fehlenden refresh token in antwort
            loadTokens(); 
            log("info","✅ Access Token erfolgreich aktualisiert!");
        } else {
            log("error","❌ HTTP Request fehlgeschlagen mit Statuscode: " + response.responseCode().code());
            log("info",$.jsString(response.responseBody()));
        }
    }

    /**
     * Fordert ein neues Access Token mit dem gegebenen Autorisierungs-Code an.
     * @function requestAccessToken
     * @param {string} code - Der Autorisierungs-Code, der von Spotify zurückgegeben wurde
     */
    function requestAccessToken(code) {
        const url = "https://accounts.spotify.com/api/token";
        const data = `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

        log("info","🕒 Versuche Access Token via Account Code zu erhalten...");
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Authorization", "Basic " + BASE64_CODE);
        headers.add("Content-Type", "application/x-www-form-urlencoded");
        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(url);
        let response = Packages.com.gmt2001.httpclient.HttpClient.post(uri, headers, data);

        if (response.hasException()) {
            log("error","❌ Fehler beim Abrufen des Access Tokens: " + response.exception().toString());
        } else if (response.isSuccess()) {
            let apiResponse = $.jsString(response.responseBody());
            log("info","✅ Access Token erfolgreich erhalten!");
            var res = JSON.parse(apiResponse);
            saveTokens(res.access_token, res.refresh_token, res.expires_in);
            loadTokens();
        } else {
            log("error","❌ HTTP Request fehlgeschlagen mit Statuscode: " + response.responseCode().code());
            var apiResponse = $.jsString(response.responseBody());
            log("info",apiResponse);
        }
    }

    function getCurrentTrack() {
        if (Date.now() >= EXPIRES_AT){
            log("warning","⚠️ Spotify Access Token abgelaufen, versuche zu aktualisieren!");
            refreshAccessToken();
        }
    
        var apiUrl = "https://api.spotify.com/v1/me/player/currently-playing";
        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(apiUrl);
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Authorization", "Bearer " + ACCESS_TOKEN);
        
        let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);
    
        if (response.hasException()) {
            log("error","❌ Fehler beim Abrufen des aktuellen Songs: " + response.exception().toString());
            return null;
        } else if (response.isSuccess()) {
            let apiResponse = JSON.parse($.jsString(response.responseBody()));
            if (!apiResponse || !apiResponse.item) {
                return null;
            }
            let trackName = apiResponse.item.name;
            let artistName = apiResponse.item.artists[0].name;
            return { trackName, artistName };
        } else {
            log("error","❌ Fehler beim Abrufen des aktuellen Songs mit Statuscode: " + response.responseCode().code());
            return null;
        }
    }

    $.bind('initReady', function () {
        $.registerChatCommand('./custom/songRequest.js', 'spotify', $.PERMISSION.Mod);
        $.registerChatCommand('./custom/songRequest.js', 'spotifyauth', $.PERMISSION.Mod);
        $.registerChatCommand('./custom/songRequest.js', 'song', $.PERMISSION.User);
        $.registerChatCommand('./custom/songRequest.js', 'queue', $.PERMISSION.User);
        loadTokens(); // Doppelt hält besser
        log("info",'🚀 Spotify Song Request Skript erfolgreich initialisiert.');
        $.log.error('🚀 Spotify Song Request Skript erfolgreich initialisiert.');
    });

    $.bind('command', function (event) {
        var sender = event.getSender();
        var command = event.getCommand();
        var args = event.getArgs();
        var tags = event.getTags();

        if (command.equalsIgnoreCase('spotifyAuth')) {
            if (!$.checkUserPermission(sender, tags, $.PERMISSION.Mod)) {
                $.say($.whisperPrefix(sender) + translate("invalid_permission"));
                return;
            }
            if (args.length === 0) {
                redirectToSpotifyAuth();
                return;
            }
            if (args[0].equalsIgnoreCase('connect')) {
                redirectToSpotifyAuth();
            } else {
                var code = args[0];
                saveToFile(filePath, code);
                requestAccessToken(code);
                $.say($.whisperPrefix(sender) + translate("auth_saved"));

            }
        }

        if (command.equalsIgnoreCase('spotify')) {
            if (!$.checkUserPermission(sender, tags, $.PERMISSION.Mod)) {
                $.say($.whisperPrefix(sender)  + translate("invalid_permission"));
                return;
            }
            var input = args.join('+');
            if (!ACCESS_TOKEN) {
                if (readFromFile(filePath)) {
                    requestAccessToken(readFromFile(filePath));
                } else {
                    $.say($.whisperPrefix(sender) + 'Bitte autorisiere dein Spotify-Konto mit !spotifyAuth <code>');
                    $.say($.whisperPrefix(sender)  + translate("auth_hint"));
                }
            } else {
                addToQueue(input, sender);
            }
        }

        if (command.equalsIgnoreCase("song")) {
            var currentTrack = getCurrentTrack();
            if (currentTrack) {
                $.say(translate("song_current", {track: currentTrack.trackName, artist: currentTrack.artistName}));
            } else {
                $.say(translate("song_null"));
            }
        }

        if (command.equalsIgnoreCase("queue")) {
            getUpcomingTracks();
            var currentTrack = getCurrentTrack();
        }
    });

    loadTokens(); // Doppelt hält besser
})();
