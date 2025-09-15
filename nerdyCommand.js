(function() {
    // Sicherstellen, dass $ korrekt initialisiert ist
    if (typeof $ === 'undefined') {
        $.log.error('Fehler: $ ist nicht definiert!');
        return;
    }

    // Zählerdatei-Pfad
    var filePath = './addons/nerdyCommandCount.txt';

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

    var messages = [
        "DasNerdwork hat bereits {count} Mal abgefuckt!",
        "I hob mi eingeschisse, DasNerdwork hat schon {count} Mal die Nerven verloren!",
        "Oops, wieder passiert! {count} Mal ist DasNerdwork auf die Nerven gegangen!",
        "Schon {count} Mal abgefuckt? Beeindruckend du Sack DasNerdwork!",
        "DasNerdwork hat Rage-Level {count} erreicht!",
        "Nur geschaffen um Space-Jesus zu nerven, DasNerdwork hat Abfuck-Level {count} erreicht!",
        "DasNerdwork hat {count} Mal so dermaßen reingeschissen, selbst Lotus hat die Verbindung abgebrochen.",
        "{count} Mal abgefuckt... Mojang hat dich auf die Blacklist gesetzt, Bruder.",
        "Wie ein Creeper auf Speed - DasNerdwork hat schon {count} Mal alles in den Arsch gejagt.",
        "Bei {count} Mal Abfuck fliegen dir in Warframe schon die Relikte aus dem Arsch!",
        "DasNerdwork hat {count} Mal gestresst - selbst der Enderdrache hat 'ne Burnout-Krankschreibung eingereicht.",
        "Du bist so toxisch - bei {count} Mal Abfuck hat selbst Stalker gesagt: 'Mir reicht's!'",
        "Grineer-Intelligenzlevel erreicht: {count} Mal abgefuckt und nichts gelernt!",
        "Mit {count} Mal Abfuck bist du offiziell härter als jede Riven-Mod zu rollen.",
        "{count} Mal abgefuckt - Not even Vor can handle that level of cringe.",
        "Du wurdest {count} Mal reported... von Villagern. Wegen Ruhestörung.",
        "DasNerdwork wurde {count} Mal von Minecraft gebannt - Grund: emotionale Zerstörung.",
        "Abfuck-Level {count}: Selbst Hunhow nennt dich 'problematisch'.",
        "Schon {count} Mal eskaliert? Deine Mutter ruft bald DEINEN Manager an.",
        "Ey, bei {count} Mal Abfuck hast du sogar einen Wallhack gegen den gesunden Menschenverstand gefunden.",
        "DasNerdwork hat {count} Mal gefailt - das ist mehr als die FPS beim Launch von Cyberpunk 2077.",
        "Mit {count} Mal Abfuck bist du offiziell ein PvP-Modus in einem PvE-Spiel.",
        "Niemand: ... DasNerdwork nach {count} Mal Abfuck: 'Ist Feature, kein Bug!'",
        "Bei {count} Mal will sogar Notepad++ dich nicht mehr öffnen.",
        "DasNerdwork hat {count} Mal auf den Knopf gedrückt - und jedes Mal war es der Selbstzerstörungsknopf.",
        "Statistisch gesehen bist du bei {count} Mal Abfuck toxischer als ein Discord-Mod mit Napoleon-Komplex.",
        "Nach {count} Mal Abfuck hat sogar Helminth dich aus dem Nidus gekotzt.",
        "DasNerdwork hat {count} Mal gefailt - selbst ein Warframe ohne Mods ist nützlicher.",
        "{count} Mal so hart verkackt, Mojang hat Minecraft in 'Minecringe' umbenannt.",
        "{count} Mal abgefuckt? Selbst Ballas will dich nicht mehr manipulieren. Und der steht auf alles was schimmelt.",
        "Bei {count} Mal Abfuck kriegt man in Warframe automatisch einen Debuff namens 'Existenz'.",
        "Nach {count} Mal auf die Kacke hauen... wurde das Klo evakuiert.",
        "{count} Mal zerstört - du bist basically der Wither auf Meth, nur weniger hilfreich.",
        "{count} Mal? Bruder, selbst Lotus hat dir die Mutti geschickt, damit du mal runterkommst.",
        "Du wurdest {count} Mal reported... auf einer LAN-Party, bei der nur du da warst.",
        "Mit {count} Mal Cringe bist du offiziell der Grund, warum Menschen lieber Podcasts mit True Crime hören als dir zuzuschauen.",
        "{count} Mal durchgezogen - und trotzdem wär ein leerer Stuhl unterhaltsamer als du.",
        "Das war Abfuck Nummer {count} - und trotzdem glaubt deine Familie noch an dich. Fragwürdig.",
        "Nach {count} Mal Fremdscham hat dein eigener Chat eine Petition gestartet, dich zu entpartnern.",
        "Bei {count} Mal hat sogar dein Stuhl Rückenschmerzen vom Fremdschämen bekommen.",
    ];

    function getRandomMessage(count) {
        var message = messages[Math.floor(Math.random() * messages.length)];
        return message.replace("{count}", count);
    }

    // Sicherstellen, dass das Script korrekt geladen wurde
    $.bind('initReady', function () {
        if ($.registerChatCommand && $.say) {
            $.registerChatCommand('./custom/nerdyCommand.js', 'nerdy', $.PERMISSION.Viewer);
            $.registerChatCommand('./custom/nerdyCommand.js', 'nerdi', $.PERMISSION.Viewer);
            $.log.error('🚀 Nerdy Command Skript erfolgreich initialisiert.');
        } else {
            $.log.error('❌ Fehler: Nerdy Command Skript Funktion nicht verfügbar!');
        }
    });

    // Command-Event Handling
    $.bind('command', function(event) {
        var sender = event.getSender();
        var command = event.getCommand();
        var args = event.getArgs();

        if (command.equalsIgnoreCase('nerdy') || command.equalsIgnoreCase('nerdi')) {
            // Überprüfen, ob der Befehl korrekt ausgeführt wird
            if (sender.toLowerCase() == "the_nerdwork") {
                var currentTimestamp = new Date().getTime();
                var timeDifference = currentTimestamp - lastTimestamp;

                // Prüfen, ob 12 Stunden (43200000 ms) vergangen sind
                if (timeDifference >= 43200000) {
                    commandCount++; // Zähler erhöhen
                    lastTimestamp = currentTimestamp; // Zeitstempel aktualisieren
                    saveToFile(filePath, commandCount + ',' + lastTimestamp); // Zähler und Zeitstempel speichern

                    $.say(getRandomMessage(commandCount));
                } else {
                    var remainingTime = 43200000 - timeDifference;
                    var remainingHours = Math.floor(remainingTime / 3600000);
                    $.say('Dieser Befehl kann erst in ' + remainingHours + ' Stunden wieder verwendet werden.');
                }
            }
        }
    });
})();
