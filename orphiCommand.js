(function() {
    // Sicherstellen, dass $ korrekt initialisiert ist
    if (typeof $ === 'undefined') {
        $.log.error('Fehler: $ ist nicht definiert!');
        return;
    }

    // Zählerdatei-Pfad
    var filePath = './addons/orphiCommandCount.txt';

    // Funktion zum Lesen der Datei
    function readFromFile(path) {
        var file = new java.io.File(path);
        if (file.exists()) {
            var reader = new java.io.BufferedReader(new java.io.FileReader(file));
            var line = reader.readLine();
            reader.close();
            return line;  // Gibt den Inhalt der Datei zurück
        }
        return null;  // Falls die Datei nicht existiert
    }

    // Funktion zum Speichern der Zahl in die Datei
    function saveToFile(path, data) {
        var file = new java.io.File(path);
        var writer = new java.io.BufferedWriter(new java.io.FileWriter(file));
        writer.write(data);
        writer.close();
    }

    // Initialisieren des Zählers und des Zeitstempels
    var commandCount = 0;
    var lastTimestamp = 0;

    // Zähler und Timestamp aus der Datei laden
    try {
        var storedData = readFromFile(filePath);
        if (storedData) {
            var parts = storedData.split(',');
            commandCount = parseInt(parts[0]);
            lastTimestamp = parseInt(parts[1]);
        }
    } catch (e) {
        $.log.error('Fehler beim Laden des Zählers: ' + e);
    }

    // Sicherstellen, dass das Script korrekt geladen wurde
    $.bind('initReady', function () {
        if ($.registerChatCommand && $.say) {
            $.registerChatCommand('./custom/orphiCommand.js', 'orphi', $.PERMISSION.Viewer);
            $.log.error('🚀 Orphi Command Skript erfolgreich initialisiert.');
        } else {
            $.log.error('❌ Fehler: Orphi Command Skript Funktion nicht verfügbar');
        }
    });

    // Command-Event Handling
    $.bind('command', function(event) {
        var sender = event.getSender();
        var command = event.getCommand();
        var args = event.getArgs();

        if (command.equalsIgnoreCase('orphi')) {
            // Überprüfen, ob der Befehl korrekt ausgeführt wird
            if (sender.toLowerCase() == "orpheusdeluxe") {
                var currentTimestamp = new Date().getTime();
                var timeDifference = currentTimestamp - lastTimestamp;

                // Prüfen, ob 12 Stunden (43200000 ms) vergangen sind
                if (timeDifference >= 43200000) {
                    commandCount++; // Zähler erhöhen
                    lastTimestamp = currentTimestamp; // Zeitstempel aktualisieren
                    saveToFile(filePath, commandCount + ',' + lastTimestamp); // Zähler und Zeitstempel speichern

                    $.say('Orphi war bereits ' + commandCount + ' Mal hier!');
                } else {
                    var remainingTime = 43200000 - timeDifference;
                    var remainingHours = Math.floor(remainingTime / 3600000);
                    $.say('Dieser Befehl kann erst in ' + remainingHours + ' Stunden wieder verwendet werden.');
                }
            }
        }
    });
})();
