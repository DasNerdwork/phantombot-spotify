(function() {
    const API_URL = "https://www.heizoel24.de/api/chartapi/GetAveragePriceHistory";

    function getFormattedDate(offsetDays) {
        const date = new java.util.Date();
        date.setDate(date.getDate() + offsetDays);
        const sdf = new java.text.SimpleDateFormat("MM-dd-yyyy");
        return sdf.format(date);
    }

    // Erstellt den benutzerdefinierten Spotify Log ordner
    function createLogFolder() {
        var logFolder = new java.io.File("/home/botuser/phantombot-junky/logs/heizoel/");
        if (!logFolder.exists()) {
            logFolder.mkdirs();
        }
    }
    
    // Funktion zum Erstellen der Spotify Log-Datei mit aktuellem Datum
    function getLogFileName() {
        var date = new java.util.Date();
        var sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        return "/home/botuser/phantombot-junky/logs/heizoel/" + sdf.format(date) + ".txt";
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

    function fetchOilPrice() {
        const minDate = getFormattedDate(-1);
        const maxDate = getFormattedDate(0);

        const fullUrl = `${API_URL}?countryId=1&minDate=${minDate}&maxDate=${maxDate}`;

        let uri = Packages.com.gmt2001.httpclient.URIUtil.create(fullUrl);
        let headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders();
        headers.add("Origin", "https://www.heizoel24.de");
        headers.add("Referer", "https://www.heizoel24.de/");
        headers.add("User-Agent", "Mozilla/5.0");

        let response = Packages.com.gmt2001.httpclient.HttpClient.get(uri, headers);

        if (response.hasException()) {
            log("info","❌ Fehler beim Abrufen des Heizölpreises: " + response.exception().toString());
            $.say("Fehler beim Abrufen des Heizölpreises.");
            return;
        } else if (response.isSuccess()) {
            let apiResponse = JSON.parse($.jsString(response.responseBody()));
            if (!apiResponse.Values || apiResponse.Values.length < 2) {
                $.say("Nicht genügend Preisdaten gefunden.");
                return;
            }

            let yesterday = apiResponse.Values[0].value;
            let today = apiResponse.Values[1].value;

            let change = ((today - yesterday) / yesterday) * 100;
            let pricePerLiter = today / 100;

            $.say(`⛽ Aktueller Heizölpreis: ${pricePerLiter.toFixed(3)} €/l (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)`);
            log("info","Heizölpreis erfolgreich abgerufen: " + pricePerLiter.toFixed(3) + " €/l, Änderung: " + change.toFixed(2) + "%");
        } else {
            log("info","❌ Fehler beim HTTP-Aufruf mit Statuscode: " + response.responseCode().code());
            $.say("Konnte Heizölpreis nicht abrufen.");
        }
    }

    $.bind('initReady', function () {
        $.registerChatCommand('./custom/heizoelCommand.js', 'heizöl', $.PERMISSION.Mod);
        $.registerChatCommand('./custom/heizoelCommand.js', 'heizoel', $.PERMISSION.Mod);
        log('info','🛢️ Heizöl Preis Skript erfolgreich initialisiert.');
        $.log.error('🛢️ Heizöl Preis Skript erfolgreich initialisiert.');
    });

    $.bind('command', function(event) {
        var sender = event.getSender();
        var command = event.getCommand();
        var tags = event.getTags();

        if (command.equalsIgnoreCase("heizöl") || command.equalsIgnoreCase("heizoel")) {
            fetchOilPrice();
        }
    });

    $.log.error("🛢 Heizölpreis-Checker geladen. Nutze !heizöl im Chat.");
})();