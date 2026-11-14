"use strict";

const extensionApi = globalThis.browser ?? globalThis.chrome;
const WIDGET_ATTRIBUTE = "data-interactive-readme-widget";
const DEBOUNCE_MS = 150;
const REQUEST_LINE =
  /^\s*(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)\s+(https:\/\/\S+)\s*$/im;
const WIDGET_TYPES = new Set([
  "api-request",
  "api-chart",
  "api-status",
  "api-tabs",
  "html-live",
  "code-editor",
  "dotnet"
]);
const LIVE_PREVIEW_MARKER = /<!--\s*github-live-preview\s*-->/i;
const DOTNET_RUN_MARKER = /^\s*\/\/\s*github-dotnet-run\s*(?:\r?\n)?/i;
const MAX_LIVE_CODE_LENGTH = 100_000;
const MISSING_WEBHOOK_ERROR =
  "Richte zuerst in den Erweiterungsoptionen eine Discord-Webhook-URL ein.";
const LANGUAGE_STORAGE_KEY = "uiLanguage";
const TRANSLATIONS = {
  en: {
    liveTest: "Run request",
    previewReload: "Reload preview",
    execute: "Run",
    executing: "Running…",
    testing: "Testing…",
    sendDiscord: "Send to Discord",
    sending: "Sending…",
    preview: "Preview",
    code: "Code",
    executionMode: "Run mode",
    htmlJavaScript: "HTML / CSS / JS",
    javascript: "JavaScript",
    codeEditorLabel: "Code editor",
    runSandbox: "Run in sandbox",
    sandboxReady: "The isolated preview starts after you click “Run preview”.",
    jsSandboxReady: "JavaScript sandbox ready.",
    statusNotChecked: "Not checked yet",
    statusUnavailable: "Unavailable",
    statusOperational: "Operational",
    statusPrefix: "Status:",
    apiAvailability: "API availability",
    sendDiscordLabel: (type) => `Send ${type} Markdown code and the latest result to Discord`,
    typeApiRequest: "API request",
    typeApiChart: "API chart",
    typeApiStatus: "API status",
    typeApiTabs: "API tabs",
    typeHtmlLive: "HTML live preview",
    typeCodeEditor: "Code editor",
    typeDotnet: "C# / .NET",
    htmlLiveTitle: "HTML live preview",
    htmlLiveDescription: "Runs HTML, CSS, and JavaScript in a sandboxed iframe using the github-live-preview marker.",
    codeEditorTitle: "Live code editor",
    codeEditorDescription: "Edit HTML or JavaScript and run it inside the isolated preview.",
    responseEmpty: "(Empty response)",
    noResultYet: "No result has been produced yet.",
    discordCode: "Code snippet",
    discordResponse: "Latest result / response",
    optionsMissing: "Open extension settings to configure a Discord webhook.",
    sentDiscord: "Markdown code sent to Discord.",
    htmlReloaded: "Preview reloaded in the isolated sandbox.",
    codeExecuted: "Code ran in the isolated sandbox.",
    tabsAvailable: (count) => `${count} tab(s) available.`,
    chartValidated: "Chart configuration validated.",
    statusChecked: (status) => `Status check complete: HTTP ${status}.`,
    chartLoaded: (status) => `Chart data loaded: HTTP ${status}.`,
    noServerResponse: "No response from the API server.",
    http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
    invalidConfig: "Widget configuration is invalid.",
    openOptionsFailed: "Could not open extension settings.",
    optionsAction: "Open extension options",
    errorRequest: "Expected a line such as: GET https://api.example.com/endpoint",
    errorJson: (type) => `${type} requires a valid JSON configuration.`,
    errorJsonObject: "Widget configuration must be a JSON object.",
    errorUrl: "This widget requires an HTTPS URL in its JSON configuration.",
    errorChart: "API Chart requires equally sized `labels` and numeric `values` arrays.",
    errorCodeSize: (limit) => `This code block exceeds the ${limit}-character limit.`,
    errorEditorSize: (limit) => `The code exceeds the ${limit}-character limit.`,
    errorResponse: "The extension did not return a response.",
    errorChartData: "The API did not return valid chart data.",
    errorConfig: "Configure a Discord webhook in extension options first.",
    tabsOverview: "Overview",
    runtimeErrorPrefix: "Error:",
    errorPrefix: "Error",
    runDotnet: "Run C#",
    dotnetLoading: "Loading the .NET WebAssembly runtime…",
    dotnetReady: "C# runtime ready. Click “Run C#” to execute this block.",
    dotnetTitle: "C# / .NET Playground",
    dotnetDescription: "Compiles and runs C# locally in a sandboxed WebAssembly runtime. The compiler and runtime are loaded from the extension package.",
    dotnetNoOutput: "(No console output)",
    dotnetTimedOut: "The .NET runtime did not respond within 120 seconds.",
    dotnetLoadFailed: "Could not load the local .NET WebAssembly runtime."
  },
  de: {
    liveTest: "Live testen",
    previewReload: "Vorschau neu laden",
    execute: "Ausführen",
    executing: "Wird ausgeführt…",
    testing: "Wird getestet…",
    sendDiscord: "An Discord senden",
    sending: "Wird gesendet…",
    preview: "Vorschau",
    code: "Code",
    executionMode: "Ausführungsmodus",
    htmlJavaScript: "HTML / CSS / JS",
    javascript: "JavaScript",
    codeEditorLabel: "Code-Editor",
    runSandbox: "Im Sandbox-Frame ausführen",
    sandboxReady: "Die isolierte Vorschau startet nach einem Klick auf „Vorschau ausführen“.",
    jsSandboxReady: "JavaScript-Sandbox bereit.",
    statusNotChecked: "Noch nicht geprüft",
    statusUnavailable: "Nicht erreichbar",
    statusOperational: "Betriebsbereit",
    statusPrefix: "Status:",
    apiAvailability: "API-Verfügbarkeit",
    sendDiscordLabel: (type) => `Markdown-Code für ${type} und letztes Ergebnis an Discord senden`,
    typeApiRequest: "API-Anfrage",
    typeApiChart: "API-Diagramm",
    typeApiStatus: "API-Status",
    typeApiTabs: "API-Tabs",
    typeHtmlLive: "HTML-Live-Vorschau",
    typeCodeEditor: "Code-Editor",
    typeDotnet: "C# / .NET",
    htmlLiveTitle: "HTML-Live-Vorschau",
    htmlLiveDescription: "Führt HTML, CSS und JavaScript mit dem github-live-preview-Marker in einem Sandbox-iframe aus.",
    codeEditorTitle: "Live-Code-Editor",
    codeEditorDescription: "Bearbeite HTML oder JavaScript und führe es in der isolierten Vorschau aus.",
    responseEmpty: "(Leere Antwort)",
    noResultYet: "Es wurde noch kein Ergebnis erzeugt.",
    discordCode: "Codeausschnitt",
    discordResponse: "Letztes Ergebnis / Antwort",
    optionsMissing: "Richte zuerst in den Erweiterungsoptionen eine Discord-Webhook-URL ein.",
    sentDiscord: "Markdown-Code wurde an Discord gesendet.",
    htmlReloaded: "HTML-Vorschau wurde isoliert neu geladen.",
    codeExecuted: "Code wurde im isolierten Sandbox-Frame ausgeführt.",
    tabsAvailable: (count) => `${count} Tab(s) sind verfügbar.`,
    chartValidated: "Chart-Konfiguration wurde geprüft.",
    statusChecked: (status) => `Statusprüfung abgeschlossen: HTTP ${status}.`,
    chartLoaded: (status) => `Chart-Daten geladen: HTTP ${status}.`,
    noServerResponse: "Keine Antwort vom API-Server.",
    http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
    invalidConfig: "Die Widget-Konfiguration ist ungültig.",
    openOptionsFailed: "Die Erweiterungseinstellungen konnten nicht geöffnet werden.",
    optionsAction: "Erweiterungsoptionen öffnen",
    errorRequest: "Erwartet wird eine Zeile wie: GET https://api.example.com/endpoint",
    errorJson: (type) => `${type} erwartet eine gültige JSON-Konfiguration.`,
    errorJsonObject: "Die Widget-Konfiguration muss ein JSON-Objekt sein.",
    errorUrl: "Für diesen Widget-Typ muss die JSON-Konfiguration eine HTTPS-URL enthalten.",
    errorChart: "API-Chart benötigt gleich lange `labels`- und `values`-Arrays mit Zahlen.",
    errorCodeSize: (limit) => `Dieser Codeblock überschreitet das Limit von ${limit} Zeichen.`,
    errorEditorSize: (limit) => `Der Code überschreitet das Limit von ${limit} Zeichen.`,
    errorResponse: "Die Erweiterung hat keine Antwort geliefert.",
    errorChartData: "Die API lieferte keine gültigen Chart-Daten.",
    errorConfig: "Richte zuerst in den Erweiterungsoptionen eine Discord-Webhook-URL ein.",
    tabsOverview: "Übersicht",
    runtimeErrorPrefix: "Fehler:",
    errorPrefix: "Fehler",
    runDotnet: "C# ausführen",
    dotnetLoading: ".NET-WebAssembly-Laufzeit wird geladen…",
    dotnetReady: "C#-Laufzeit bereit. Klicke auf „C# ausführen“, um den Code zu starten.",
    dotnetTitle: "C# / .NET Playground",
    dotnetDescription: "Kompiliert und startet C# lokal in einer WebAssembly-Sandbox. Compiler und Laufzeit werden aus dem Erweiterungspaket geladen.",
    dotnetNoOutput: "(Keine Konsolenausgabe)",
    dotnetTimedOut: "Die .NET-Laufzeit hat innerhalb von 120 Sekunden nicht geantwortet.",
    dotnetLoadFailed: "Die lokale .NET-WebAssembly-Laufzeit konnte nicht geladen werden."
    },
    es: {
      liveTest: "Probar solicitud",
      previewReload: "Recargar vista previa",
      execute: "Ejecutar",
      executing: "Ejecutando…",
      testing: "Probando…",
      sendDiscord: "Enviar a Discord",
      sending: "Enviando…",
      preview: "Vista previa",
      code: "Código",
      executionMode: "Modo de ejecución",
      htmlJavaScript: "HTML / CSS / JS",
      javascript: "JavaScript",
      codeEditorLabel: "Editor de código",
      runSandbox: "Ejecutar en sandbox",
      sandboxReady: "La vista previa aislada se inicia al pulsar «Ejecutar vista previa».",
      jsSandboxReady: "Sandbox de JavaScript preparado.",
      statusNotChecked: "Aún no comprobado",
      statusUnavailable: "No disponible",
      statusOperational: "Operativo",
      statusPrefix: "Estado:",
      apiAvailability: "Disponibilidad de la API",
      sendDiscordLabel: (type) => `Enviar el código Markdown de ${type} y el último resultado a Discord`,
      typeApiRequest: "solicitud API",
      typeApiChart: "gráfico API",
      typeApiStatus: "estado API",
      typeApiTabs: "pestañas API",
      typeHtmlLive: "vista HTML en vivo",
      typeCodeEditor: "editor de código",
      typeDotnet: "C# / .NET",
      htmlLiveTitle: "Vista HTML en vivo",
      htmlLiveDescription: "Ejecuta HTML, CSS y JavaScript en un iframe aislado con el marcador github-live-preview.",
      codeEditorTitle: "Editor de código en vivo",
      codeEditorDescription: "Edita HTML o JavaScript y ejecútalo en la vista previa aislada.",
      responseEmpty: "(Respuesta vacía)",
      noResultYet: "Aún no se ha generado ningún resultado.",
      discordCode: "Fragmento de código",
      discordResponse: "Último resultado / respuesta",
      optionsMissing: "Abre las opciones de la extensión para configurar un webhook de Discord.",
      sentDiscord: "Código Markdown enviado a Discord.",
      htmlReloaded: "Vista HTML recargada en el sandbox aislado.",
      codeExecuted: "Código ejecutado en el sandbox aislado.",
      tabsAvailable: (count) => `Hay ${count} pestaña(s) disponible(s).`,
      chartValidated: "Configuración del gráfico validada.",
      statusChecked: (status) => `Comprobación de estado completada: HTTP ${status}.`,
      chartLoaded: (status) => `Datos del gráfico cargados: HTTP ${status}.`,
      noServerResponse: "El servidor API no respondió.",
      http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
      invalidConfig: "La configuración del widget no es válida.",
      openOptionsFailed: "No se pudieron abrir las opciones de la extensión.",
      optionsAction: "Abrir opciones de la extensión",
      errorRequest: "Se esperaba una línea como: GET https://api.example.com/endpoint",
      errorJson: (type) => `${type} requiere una configuración JSON válida.`,
      errorJsonObject: "La configuración del widget debe ser un objeto JSON.",
      errorUrl: "La configuración JSON de este widget requiere una URL HTTPS.",
      errorChart: "El gráfico API requiere arrays labels y values numéricos del mismo tamaño.",
      errorCodeSize: (limit) => `Este bloque supera el límite de ${limit} caracteres.`,
      errorEditorSize: (limit) => `El código supera el límite de ${limit} caracteres.`,
      errorResponse: "La extensión no devolvió una respuesta.",
      errorChartData: "La API no devolvió datos de gráfico válidos.",
      errorConfig: "Configura primero un webhook de Discord en las opciones de la extensión.",
      tabsOverview: "Resumen",
      runtimeErrorPrefix: "Error:",
      errorPrefix: "Error",
      runDotnet: "Ejecutar C#",
      dotnetLoading: "Cargando el runtime .NET WebAssembly…",
      dotnetReady: "Runtime C# listo. Pulsa «Ejecutar C#» para ejecutar este bloque.",
      dotnetTitle: "Entorno C# / .NET",
      dotnetDescription: "Compila y ejecuta C# localmente en un sandbox WebAssembly. El compilador y el runtime se cargan desde la extensión.",
      dotnetNoOutput: "(Sin salida de consola)",
      dotnetTimedOut: "El runtime .NET no respondió en 120 segundos.",
      dotnetLoadFailed: "No se pudo cargar el runtime .NET WebAssembly local."
    },
    fr: {
      liveTest: "Tester la requête",
      previewReload: "Actualiser l’aperçu",
      execute: "Exécuter",
      executing: "Exécution…",
      testing: "Test en cours…",
      sendDiscord: "Envoyer à Discord",
      sending: "Envoi…",
      preview: "Aperçu",
      code: "Code",
      executionMode: "Mode d’exécution",
      htmlJavaScript: "HTML / CSS / JS",
      javascript: "JavaScript",
      codeEditorLabel: "Éditeur de code",
      runSandbox: "Exécuter dans le bac à sable",
      sandboxReady: "L’aperçu isolé démarre après un clic sur « Exécuter l’aperçu ».",
      jsSandboxReady: "Bac à sable JavaScript prêt.",
      statusNotChecked: "Pas encore vérifié",
      statusUnavailable: "Indisponible",
      statusOperational: "Opérationnel",
      statusPrefix: "État :",
      apiAvailability: "Disponibilité de l’API",
      sendDiscordLabel: (type) => `Envoyer le code Markdown de ${type} et le dernier résultat à Discord`,
      typeApiRequest: "requête API",
      typeApiChart: "graphique API",
      typeApiStatus: "état de l’API",
      typeApiTabs: "onglets API",
      typeHtmlLive: "aperçu HTML en direct",
      typeCodeEditor: "éditeur de code",
      typeDotnet: "C# / .NET",
      htmlLiveTitle: "Aperçu HTML en direct",
      htmlLiveDescription: "Exécute HTML, CSS et JavaScript dans un iframe isolé avec le marqueur github-live-preview.",
      codeEditorTitle: "Éditeur de code en direct",
      codeEditorDescription: "Modifiez du HTML ou du JavaScript et exécutez-le dans l’aperçu isolé.",
      responseEmpty: "(Réponse vide)",
      noResultYet: "Aucun résultat n’a encore été généré.",
      discordCode: "Extrait de code",
      discordResponse: "Dernier résultat / réponse",
      optionsMissing: "Ouvrez les paramètres de l’extension pour configurer un webhook Discord.",
      sentDiscord: "Code Markdown envoyé à Discord.",
      htmlReloaded: "Aperçu HTML rechargé dans le bac à sable isolé.",
      codeExecuted: "Code exécuté dans le bac à sable isolé.",
      tabsAvailable: (count) => `${count} onglet(s) disponible(s).`,
      chartValidated: "Configuration du graphique validée.",
      statusChecked: (status) => `Vérification terminée : HTTP ${status}.`,
      chartLoaded: (status) => `Données du graphique chargées : HTTP ${status}.`,
      noServerResponse: "Le serveur API n’a pas répondu.",
      http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
      invalidConfig: "La configuration du widget est invalide.",
      openOptionsFailed: "Impossible d’ouvrir les paramètres de l’extension.",
      optionsAction: "Ouvrir les options de l’extension",
      errorRequest: "Une ligne telle que GET https://api.example.com/endpoint est attendue.",
      errorJson: (type) => `${type} nécessite une configuration JSON valide.`,
      errorJsonObject: "La configuration du widget doit être un objet JSON.",
      errorUrl: "Ce widget nécessite une URL HTTPS dans sa configuration JSON.",
      errorChart: "Le graphique API nécessite des tableaux labels et values numériques de même taille.",
      errorCodeSize: (limit) => `Ce bloc dépasse la limite de ${limit} caractères.`,
      errorEditorSize: (limit) => `Le code dépasse la limite de ${limit} caractères.`,
      errorResponse: "L’extension n’a pas renvoyé de réponse.",
      errorChartData: "L’API n’a pas renvoyé de données de graphique valides.",
      errorConfig: "Configurez d’abord un webhook Discord dans les options de l’extension.",
      tabsOverview: "Aperçu",
      runtimeErrorPrefix: "Erreur :",
      errorPrefix: "Erreur",
      runDotnet: "Exécuter C#",
      dotnetLoading: "Chargement du runtime .NET WebAssembly…",
      dotnetReady: "Runtime C# prêt. Cliquez sur « Exécuter C# » pour lancer ce bloc.",
      dotnetTitle: "Terrain de jeu C# / .NET",
      dotnetDescription: "Compile et exécute C# localement dans un bac à sable WebAssembly. Le compilateur et le runtime sont chargés depuis l’extension.",
      dotnetNoOutput: "(Aucune sortie console)",
      dotnetTimedOut: "Le runtime .NET n’a pas répondu en 120 secondes.",
      dotnetLoadFailed: "Impossible de charger le runtime .NET WebAssembly local."
    },
    cs: {
      liveTest: "Otestovat požadavek",
      previewReload: "Obnovit náhled",
      execute: "Spustit",
      executing: "Spouštění…",
      testing: "Testování…",
      sendDiscord: "Odeslat na Discord",
      sending: "Odesílání…",
      preview: "Náhled",
      code: "Kód",
      executionMode: "Režim spuštění",
      htmlJavaScript: "HTML / CSS / JS",
      javascript: "JavaScript",
      codeEditorLabel: "Editor kódu",
      runSandbox: "Spustit v sandboxu",
      sandboxReady: "Izolovaný náhled se spustí po kliknutí na „Spustit náhled“.",
      jsSandboxReady: "JavaScriptový sandbox je připraven.",
      statusNotChecked: "Zatím nezkontrolováno",
      statusUnavailable: "Nedostupné",
      statusOperational: "V provozu",
      statusPrefix: "Stav:",
      apiAvailability: "Dostupnost API",
      sendDiscordLabel: (type) => `Odeslat Markdown kód ${type} a poslední výsledek na Discord`,
      typeApiRequest: "požadavek API",
      typeApiChart: "graf API",
      typeApiStatus: "stav API",
      typeApiTabs: "záložky API",
      typeHtmlLive: "živý náhled HTML",
      typeCodeEditor: "editor kódu",
      typeDotnet: "C# / .NET",
      htmlLiveTitle: "Živý náhled HTML",
      htmlLiveDescription: "Spustí HTML, CSS a JavaScript v izolovaném iframe pomocí značky github-live-preview.",
      codeEditorTitle: "Živý editor kódu",
      codeEditorDescription: "Upravte HTML nebo JavaScript a spusťte jej v izolovaném náhledu.",
      responseEmpty: "(Prázdná odpověď)",
      noResultYet: "Zatím nebyl vytvořen žádný výsledek.",
      discordCode: "Ukázka kódu",
      discordResponse: "Poslední výsledek / odpověď",
      optionsMissing: "Nastavte webhook Discord v nastavení rozšíření.",
      sentDiscord: "Markdown kód byl odeslán na Discord.",
      htmlReloaded: "Náhled HTML byl znovu načten v izolovaném sandboxu.",
      codeExecuted: "Kód byl spuštěn v izolovaném sandboxu.",
      tabsAvailable: (count) => `K dispozici je ${count} záložek.`,
      chartValidated: "Konfigurace grafu byla ověřena.",
      statusChecked: (status) => `Kontrola stavu dokončena: HTTP ${status}.`,
      chartLoaded: (status) => `Data grafu načtena: HTTP ${status}.`,
      noServerResponse: "Server API neodpověděl.",
      http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
      invalidConfig: "Konfigurace widgetu není platná.",
      openOptionsFailed: "Nastavení rozšíření se nepodařilo otevřít.",
      optionsAction: "Otevřít nastavení rozšíření",
      errorRequest: "Očekává se řádek, například: GET https://api.example.com/endpoint",
      errorJson: (type) => `${type} vyžaduje platnou konfiguraci JSON.`,
      errorJsonObject: "Konfigurace widgetu musí být objekt JSON.",
      errorUrl: "Konfigurace JSON tohoto widgetu musí obsahovat HTTPS URL.",
      errorChart: "Graf API vyžaduje stejně dlouhá pole labels a číselných values.",
      errorCodeSize: (limit) => `Tento blok překračuje limit ${limit} znaků.`,
      errorEditorSize: (limit) => `Kód překračuje limit ${limit} znaků.`,
      errorResponse: "Rozšíření nevrátilo odpověď.",
      errorChartData: "API nevrátilo platná data grafu.",
      errorConfig: "Nejprve nastavte webhook Discord v nastavení rozšíření.",
      tabsOverview: "Přehled",
      runtimeErrorPrefix: "Chyba:",
      errorPrefix: "Chyba",
      runDotnet: "Spustit C#",
      dotnetLoading: "Načítání .NET WebAssembly runtime…",
      dotnetReady: "C# runtime je připraven. Kliknutím na „Spustit C#“ spusťte tento blok.",
      dotnetTitle: "C# / .NET playground",
      dotnetDescription: "Kompiluje a spouští C# místně v izolovaném WebAssembly sandboxu. Kompilátor a runtime se načtou z rozšíření.",
      dotnetNoOutput: "(Žádný výstup konzole)",
      dotnetTimedOut: ".NET runtime neodpověděl do 120 sekund.",
      dotnetLoadFailed: "Místní .NET WebAssembly runtime se nepodařilo načíst."
    },
    nl: {
      liveTest: "Verzoek testen",
      previewReload: "Voorbeeld vernieuwen",
      execute: "Uitvoeren",
      executing: "Bezig met uitvoeren…",
      testing: "Bezig met testen…",
      sendDiscord: "Naar Discord sturen",
      sending: "Verzenden…",
      preview: "Voorbeeld",
      code: "Code",
      executionMode: "Uitvoermodus",
      htmlJavaScript: "HTML / CSS / JS",
      javascript: "JavaScript",
      codeEditorLabel: "Code-editor",
      runSandbox: "Uitvoeren in sandbox",
      sandboxReady: "De geïsoleerde preview start nadat je op ‘Preview uitvoeren’ klikt.",
      jsSandboxReady: "JavaScript-sandbox gereed.",
      statusNotChecked: "Nog niet gecontroleerd",
      statusUnavailable: "Niet beschikbaar",
      statusOperational: "Operationeel",
      statusPrefix: "Status:",
      apiAvailability: "API-beschikbaarheid",
      sendDiscordLabel: (type) => `Stuur de Markdown-code van ${type} en het laatste resultaat naar Discord`,
      typeApiRequest: "API-verzoek",
      typeApiChart: "API-grafiek",
      typeApiStatus: "API-status",
      typeApiTabs: "API-tabbladen",
      typeHtmlLive: "HTML-livepreview",
      typeCodeEditor: "code-editor",
      typeDotnet: "C# / .NET",
      htmlLiveTitle: "HTML-livepreview",
      htmlLiveDescription: "Voert HTML, CSS en JavaScript uit in een geïsoleerde iframe met de marker github-live-preview.",
      codeEditorTitle: "Live code-editor",
      codeEditorDescription: "Bewerk HTML of JavaScript en voer het uit in de geïsoleerde preview.",
      responseEmpty: "(Leeg antwoord)",
      noResultYet: "Er is nog geen resultaat gemaakt.",
      discordCode: "Codefragment",
      discordResponse: "Laatste resultaat / antwoord",
      optionsMissing: "Open de extensie-instellingen om een Discord-webhook in te stellen.",
      sentDiscord: "Markdown-code naar Discord verzonden.",
      htmlReloaded: "HTML-preview opnieuw geladen in de geïsoleerde sandbox.",
      codeExecuted: "Code uitgevoerd in de geïsoleerde sandbox.",
      tabsAvailable: (count) => `${count} tabblad(en) beschikbaar.`,
      chartValidated: "Grafiekconfiguratie gecontroleerd.",
      statusChecked: (status) => `Statuscontrole voltooid: HTTP ${status}.`,
      chartLoaded: (status) => `Grafiekgegevens geladen: HTTP ${status}.`,
      noServerResponse: "De API-server heeft niet gereageerd.",
      http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
      invalidConfig: "De widgetconfiguratie is ongeldig.",
      openOptionsFailed: "De extensie-instellingen konden niet worden geopend.",
      optionsAction: "Extensie-instellingen openen",
      errorRequest: "Verwacht een regel zoals: GET https://api.example.com/endpoint",
      errorJson: (type) => `${type} vereist een geldige JSON-configuratie.`,
      errorJsonObject: "De widgetconfiguratie moet een JSON-object zijn.",
      errorUrl: "Dit widget vereist een HTTPS-URL in de JSON-configuratie.",
      errorChart: "API-grafiek vereist even lange labels- en numerieke values-arrays.",
      errorCodeSize: (limit) => `Dit codeblok overschrijdt de limiet van ${limit} tekens.`,
      errorEditorSize: (limit) => `De code overschrijdt de limiet van ${limit} tekens.`,
      errorResponse: "De extensie heeft geen antwoord teruggegeven.",
      errorChartData: "De API heeft geen geldige grafiekgegevens teruggegeven.",
      errorConfig: "Stel eerst een Discord-webhook in bij de extensie-instellingen.",
      tabsOverview: "Overzicht",
      runtimeErrorPrefix: "Fout:",
      errorPrefix: "Fout",
      runDotnet: "C# uitvoeren",
      dotnetLoading: ".NET WebAssembly-runtime laden…",
      dotnetReady: "C#-runtime gereed. Klik op ‘C# uitvoeren’ om dit blok uit te voeren.",
      dotnetTitle: "C# / .NET-speelomgeving",
      dotnetDescription: "Compileert en voert C# lokaal uit in een geïsoleerde WebAssembly-sandbox. Compiler en runtime worden uit de extensie geladen.",
      dotnetNoOutput: "(Geen console-uitvoer)",
      dotnetTimedOut: "De .NET-runtime reageerde niet binnen 120 seconden.",
      dotnetLoadFailed: "De lokale .NET WebAssembly-runtime kon niet worden geladen."
    },
    tlh: {
      liveTest: "QIn yI'ol",
      previewReload: "HaSta yIchenmoHqa'",
      execute: "yI-lu'",
      executing: "lu'taH…",
      testing: "'oltaH…",
      sendDiscord: "DiscordDaq ngeH",
      sending: "ngeHtaH…",
      preview: "HaSta",
      code: "ghItlh",
      executionMode: "luchu' mIw",
      htmlJavaScript: "HTML / CSS / JS",
      javascript: "JavaScript",
      codeEditorLabel: "ghItlh choHwI'",
      runSandbox: "SandboxDaq yI-lu'",
      sandboxReady: "ngaQlu'bogh HaSta chu'lu'meH «Run preview» yI-click.",
      jsSandboxReady: "JavaScript Sandbox ready.",
      statusNotChecked: "wej'ol",
      statusUnavailable: "tu'be'lu'",
      statusOperational: "Qap",
      statusPrefix: "Dotlh:",
      apiAvailability: "API Dotlh",
      sendDiscordLabel: (type) => `${type} ghItlh je QIn wa'DIch DiscordDaq ngeH`,
      typeApiRequest: "API QIn",
      typeApiChart: "API DIvI'",
      typeApiStatus: "API Dotlh",
      typeApiTabs: "API tabs",
      typeHtmlLive: "HTML yIn HaSta",
      typeCodeEditor: "ghItlh choHwI'",
      typeDotnet: "C# / .NET",
      htmlLiveTitle: "HTML yIn HaSta",
      htmlLiveDescription: "HTML, CSS, JavaScript sandbox iframeDaq Qap; github-live-preview marker yIlo'.",
      codeEditorTitle: "yIn ghItlh choH",
      codeEditorDescription: "HTML pagh JavaScript choH, ngaQlu'bogh previewDaq yI-lu'.",
      responseEmpty: "(QIn pagh)",
      noResultYet: "wej Qapta' pagh.",
      discordCode: "ghItlh 'ay'",
      discordResponse: "QIn wa'DIch / jangghom",
      optionsMissing: "Discord webhook DaHutlh. Extension options yIpoS.",
      sentDiscord: "Markdown ghItlh DiscordDaq ngeHlu'ta'.",
      htmlReloaded: "HTML HaSta ngaQlu'bogh sandboxDaq chu'lu'ta'.",
      codeExecuted: "ghItlh ngaQlu'bogh sandboxDaq Qapta'.",
      tabsAvailable: (count) => `${count} tabs lutu'lu'.`,
      chartValidated: "Chart configuration lujatlhlu'.",
      statusChecked: (status) => `Dotlh poqlu'ta': HTTP ${status}.`,
      chartLoaded: (status) => `Chart data qellu'ta': HTTP ${status}.`,
      noServerResponse: "API Server jangbe'.",
      http: (status, statusText) => `HTTP ${status} ${statusText}`.trim(),
      invalidConfig: "Widget configuration muj.",
      openOptionsFailed: "Extension options poSlaHbe'.",
      optionsAction: "Extension options yIpoS",
      errorRequest: "QInvam rurghach: GET https://api.example.com/endpoint",
      errorJson: (type) => `${type} JSON configuration qaq poQ.`,
      errorJsonObject: "Widget configuration JSON Doch 'oHnIS.",
      errorUrl: "Widgetvam HTTPS URL poQ.",
      errorChart: "API chart labels je numeric values nIbHa' 'ay' poQ.",
      errorCodeSize: (limit) => `ghItlhvam ${limit} characters pIq.`,
      errorEditorSize: (limit) => `ghItlh ${limit} characters pIq.`,
      errorResponse: "Extension QIn nobbe'.",
      errorChartData: "API chart data valid nobbe'.",
      errorConfig: "Discord webhook yIchenmoH: extension options yIpoS.",
      tabsOverview: "tlhIngan",
      runtimeErrorPrefix: "Qagh:",
      errorPrefix: "Qagh",
      runDotnet: "C# yI-lu'",
      dotnetLoading: ".NET WebAssembly runtime vIHtaH…",
      dotnetReady: "C# runtime ready. C# yI-lu'meH «Run C#» yI-click.",
      dotnetTitle: "C# / .NET Playground",
      dotnetDescription: "C# locally WebAssembly sandboxDaq compile je Qap. Runtime/compiler payloadmey extensionvo' load.",
      dotnetNoOutput: "(console pagh)",
      dotnetTimedOut: ".NET runtime 120 secondsDaq jangbe'.",
      dotnetLoadFailed: "local .NET WebAssembly runtime vIlaHbe'."
    },
    upside: {}
  };
let activeLanguage = "en";
const languageUpdaters = new Set();

function upsideDown(text) {
  const source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?()[]{}<>_'\"";
  const flipped = "ɐqɔpǝɟɓɥıɾʞןɯuodbɹsʇnʌʍxʎz∀𐐒Ɔ◖ƎℲפHIſ⋊˥WNOԀΌᴚS⊥∩ΛMX⅄Z0ƖᄅƐㄣϛ9ㄥ86˙'¡¿)(][}{><‾,„";
  const map = new Map(Array.from(source, (character, index) => [
    character,
    Array.from(flipped)[index] || character
  ]));
  return Array.from(text).reverse().map((character) => map.get(character) ?? character).join("");
}

const EASTER_EGG_TRANSLATIONS = {
  statusOperational: "Operational — Qapla'!",
  sentDiscord: "Transmission sent to Discord. Qapla'!",
  dotnetReady: "C# runtime ready. Your code awaits, warrior. Qapla'!"
};
const OUTPUT_TRUNCATION_LABELS = {
  en: (limit) => `[Output truncated at ${limit.toLocaleString("en-US")} characters.]`,
  de: (limit) => `[Ausgabe nach ${limit.toLocaleString("de-DE")} Zeichen gekürzt.]`,
  es: (limit) => `[Salida truncada después de ${limit.toLocaleString("es-ES")} caracteres.]`,
  fr: (limit) => `[Sortie tronquée après ${limit.toLocaleString("fr-FR")} caractères.]`,
  cs: (limit) => `[Výstup zkrácen po ${limit.toLocaleString("cs-CZ")} znacích.]`,
  nl: (limit) => `[Uitvoer afgekapt na ${limit.toLocaleString("nl-NL")} tekens.]`,
  tlh: (limit) => `[Output truncated at ${limit.toLocaleString("en-US")} characters. Qapla'!]`
};

function t(key, ...args) {
  if (key === "outputTruncated") {
    const text = (OUTPUT_TRUNCATION_LABELS[activeLanguage] || OUTPUT_TRUNCATION_LABELS.en)(...args);
    return activeLanguage === "upside" ? upsideDown(OUTPUT_TRUNCATION_LABELS.en(...args)) : text;
  }
  const sourceLanguage = activeLanguage === "tlh" || activeLanguage === "upside"
    ? "en"
    : activeLanguage;
  const value = TRANSLATIONS[sourceLanguage][key] ?? TRANSLATIONS.en[key];
  const text = typeof value === "function" ? value(...args) : value;
  if (activeLanguage === "tlh") return EASTER_EGG_TRANSLATIONS[key] || text;
  return activeLanguage === "upside" ? upsideDown(text) : text;
}

function getTypeLabel(type) {
  const keys = {
    "api-request": "typeApiRequest",
    "api-chart": "typeApiChart",
    "api-status": "typeApiStatus",
    "api-tabs": "typeApiTabs",
    "html-live": "typeHtmlLive",
    "code-editor": "typeCodeEditor",
    dotnet: "typeDotnet"
  };
  return t(keys[type]);
}

function getStoredLanguage() {
  if (globalThis.browser) {
    return extensionApi.storage.local.get(LANGUAGE_STORAGE_KEY)
      .then((stored) => stored[LANGUAGE_STORAGE_KEY]);
  }
  return new Promise((resolve, reject) => {
    extensionApi.storage.local.get(LANGUAGE_STORAGE_KEY, (stored) => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(stored[LANGUAGE_STORAGE_KEY]);
    });
  });
}

function applyLanguage(language) {
  activeLanguage = Object.hasOwn(TRANSLATIONS, language) ? language : "en";
  for (const update of languageUpdaters) {
    if (!update.widget.isConnected) {
      languageUpdaters.delete(update);
      continue;
    }
    update(activeLanguage);
  }
}

function openOptionsPage() {
  return extensionApi.runtime.sendMessage({ type: "openOptions" });
}
const SUCCESS_STATES = new Set([
  "ok",
  "up",
  "healthy",
  "operational",
  "success",
  "available"
]);
const FAILURE_STATES = new Set([
  "error",
  "down",
  "failed",
  "failure",
  "degraded",
  "outage",
  "unavailable"
]);

function createElement(tagName, text, styles = {}) {
  const element = document.createElement(tagName);
  if (text !== undefined) element.textContent = text;
  for (const [property, value] of Object.entries(styles)) {
    element.style.setProperty(
      property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      value
    );
  }
  return element;
}

function parseJsonConfig(rawCode, type) {
  let value;
  try {
    value = JSON.parse(rawCode);
  } catch {
    throw new Error(t("errorJson", getTypeLabel(type)));
  }
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(t("errorJsonObject"));
  }
  return value;
}

function parseRequest(rawCode) {
  const match = rawCode.match(REQUEST_LINE);
  if (!match) {
    throw new Error(t("errorRequest"));
  }
  return { method: match[1].toUpperCase(), url: match[2] };
}

function parseWidgetType(codeElement, preElement, rawCode) {
  if (DOTNET_RUN_MARKER.test(rawCode)) return "dotnet";
  if (LIVE_PREVIEW_MARKER.test(rawCode.replace(/^\uFEFF/, ""))) return "html-live";
  const classNames = [
    ...codeElement.classList,
    ...preElement.classList,
    ...(codeElement.parentElement ? codeElement.parentElement.classList : [])
  ];

  for (const className of classNames) {
    const match = className.match(
      /(?:language|highlight-source)-?(api-(?:request|chart|status|tabs)|html-live|code-editor|dotnet-run|csharp-run|cs-run)/
    );
    if (match) {
      if (["dotnet-run", "csharp-run", "cs-run"].includes(match[1])) return "dotnet";
      if (WIDGET_TYPES.has(match[1])) return match[1];
    }
  }

  return REQUEST_LINE.test(rawCode) ? "api-request" : null;
}

function normalizeRequest(config) {
  if (typeof config.url !== "string" || !config.url.trim()) {
    throw new Error(t("errorUrl"));
  }
  return {
    method: typeof config.method === "string" ? config.method.toUpperCase() : "GET",
    url: config.url.trim()
  };
}

function createResultPanel(reduceMotion) {
  const panel = createElement("div", undefined, {
    borderTop: "none",
    marginTop: "0",
    maxHeight: "0",
    opacity: "0",
    overflow: "hidden",
    transition: reduceMotion
      ? "none"
      : "max-height 240ms ease, opacity 180ms ease, margin-top 180ms ease",
    visibility: "hidden"
  });
  panel.setAttribute("aria-hidden", "true");
  panel.setAttribute("aria-live", "polite");
  return panel;
}

function revealResultPanel(panel, content) {
  content.replaceChildren();
  panel.setAttribute("aria-hidden", "false");
  panel.style.visibility = "visible";
  panel.style.borderTop = "1px solid var(--color-border-default)";
  panel.style.marginTop = "12px";
  requestAnimationFrame(() => {
    panel.style.maxHeight = "390px";
    panel.style.opacity = "1";
  });
}

function showMessage(panel, content, message, isError = false) {
  revealResultPanel(panel, content);
  if (
    message === MISSING_WEBHOOK_ERROR ||
    Object.values(TRANSLATIONS).some((translation) => message === translation.errorConfig)
  ) {
    const action = createElement("button", t("optionsMissing"), {
      background: "transparent",
      border: "0",
      color: "var(--color-accent-fg)",
      cursor: "pointer",
      font: "inherit",
      padding: "12px",
      textAlign: "left",
      textDecoration: "underline",
      textUnderlineOffset: "3px"
    });
    action.type = "button";
    action.addEventListener("click", async () => {
      action.disabled = true;
      try {
        const response = await openOptionsPage();
        if (response?.error) {
          action.disabled = false;
          action.textContent = t("openOptionsFailed");
        }
      } catch {
        action.disabled = false;
        action.textContent = t("openOptionsFailed");
      }
    });
    content.append(action);
    return;
  }
  content.append(createElement("p", message, {
    color: isError ? "var(--color-danger-fg)" : "var(--color-fg-muted)",
    margin: "0",
    padding: "12px"
  }));
}

function showApiResponse(panel, content, response) {
  revealResultPanel(panel, content);
  if (response.error) {
    content.append(createElement("p", response.error, {
      color: "var(--color-danger-fg)",
      margin: "0",
      padding: "12px"
    }));
    return;
  }

  const succeeded = response.status >= 200 && response.status < 300;
  content.append(createElement("p", `HTTP ${response.status} ${response.statusText}`.trim(), {
    color: succeeded ? "var(--color-success-fg)" : "var(--color-danger-fg)",
    fontWeight: "600",
    margin: "0",
    padding: "12px 12px 0"
  }));
  const output = createElement("pre", undefined, {
    backgroundColor: "var(--color-canvas-inset)",
    borderRadius: "6px",
    color: "var(--color-fg-default)",
    fontFamily: "var(--fontStack-monospace)",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "8px 0 0",
    maxHeight: "300px",
    overflowY: "auto",
    padding: "12px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere"
  });
  const code = document.createElement("code");
  code.textContent = response.text || t("responseEmpty");
  output.append(code);
  content.append(output);
}

function showCodeOutput(panel, content, text) {
  revealResultPanel(panel, content);
  const output = createElement("pre", undefined, {
    backgroundColor: "var(--color-canvas-inset)",
    borderRadius: "6px",
    color: "var(--color-fg-default)",
    fontFamily: "var(--fontStack-monospace)",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    maxHeight: "300px",
    overflow: "auto",
    padding: "12px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere"
  });
  const code = document.createElement("code");
  code.textContent = text;
  output.append(code);
  content.append(output);
}

function getStatusValue(data, path) {
  if (typeof path !== "string" || !path.trim()) return undefined;
  return path.split(".").reduce((value, part) => {
    return value && typeof value === "object" ? value[part] : undefined;
  }, data);
}

function makeStatusWidget(config) {
  let lastResponse = null;
  const statusLabel = createElement("span", t("statusNotChecked"), {
    backgroundColor: "var(--color-neutral-muted)",
    borderRadius: "999px",
    color: "var(--color-fg-default)",
    display: "inline-flex",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px"
  });
  const description = createElement(
    "p",
    typeof config.label === "string" ? config.label : t("apiAvailability"),
    { color: "var(--color-fg-muted)", margin: "10px 0 0" }
  );
  const body = createElement("div");
  body.append(statusLabel, description);
  return {
    body,
    setLanguage() {
      if (lastResponse) {
        this.update(lastResponse);
      } else {
        statusLabel.textContent = t("statusNotChecked");
        if (typeof config.label !== "string") description.textContent = t("apiAvailability");
      }
    },
    update(response) {
      lastResponse = response;
      if (response.error) {
        statusLabel.textContent = t("statusUnavailable");
        statusLabel.style.backgroundColor = "var(--color-danger-subtle)";
        statusLabel.style.color = "var(--color-danger-fg)";
        description.textContent = response.error;
        return;
      }

      let payload;
      try {
        payload = JSON.parse(response.text);
      } catch {
        payload = null;
      }
      const stateValue = getStatusValue(payload, config.statusPath || "status");
      const state = typeof stateValue === "string" ? stateValue.toLowerCase() : "";
      const stateIsKnown = SUCCESS_STATES.has(state) || FAILURE_STATES.has(state);
      const isHealthy = response.status >= 200 &&
        response.status < 300 &&
        (stateIsKnown ? SUCCESS_STATES.has(state) : !FAILURE_STATES.has(state));
      const label = typeof stateValue === "string"
        ? `${t("statusPrefix")} ${stateValue}`
        : isHealthy ? t("statusOperational") : `HTTP ${response.status}`;
      statusLabel.textContent = label;
      statusLabel.style.backgroundColor = isHealthy
        ? "var(--color-success-subtle)"
        : "var(--color-danger-subtle)";
      statusLabel.style.color = isHealthy
        ? "var(--color-success-fg)"
        : "var(--color-danger-fg)";
      if (typeof config.label === "string") description.textContent = config.label;
    }
  };
}

function validateChartData(config) {
  if (
    !Array.isArray(config.labels) ||
    !Array.isArray(config.values) ||
    config.labels.length === 0 ||
    config.labels.length !== config.values.length ||
    !config.values.every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    throw new Error(t("errorChart"));
  }
  return {
    labels: config.labels.map((label) => String(label)),
    values: config.values
  };
}

function renderChart(config, chartContainer) {
  const { labels, values } = validateChartData(config);
  chartContainer.replaceChildren();
  if (typeof config.title === "string" && config.title.trim()) {
    chartContainer.append(createElement("h3", config.title, {
      color: "var(--color-fg-default)",
      fontSize: "14px",
      margin: "0 0 12px"
    }));
  }

  const maximum = Math.max(1, ...values);
  const list = createElement("div", undefined, {
    display: "grid",
    gap: "10px"
  });
  labels.forEach((label, index) => {
    const row = createElement("div", undefined, {
      display: "grid",
      gap: "5px",
      gridTemplateColumns: "minmax(70px, 1fr) minmax(80px, 3fr) auto",
      alignItems: "center"
    });
    const name = createElement("span", label, {
      color: "var(--color-fg-muted)",
      fontSize: "12px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    });
    const track = createElement("div", undefined, {
      backgroundColor: "var(--color-border-default)",
      borderRadius: "999px",
      height: "9px",
      overflow: "hidden"
    });
    const bar = createElement("div", undefined, {
      backgroundColor: "var(--color-accent-fg)",
      borderRadius: "inherit",
      height: "100%",
      width: `${Math.max(0, Math.min(100, values[index] / maximum * 100))}%`
    });
    const value = createElement("strong", String(values[index]), {
      color: "var(--color-fg-default)",
      fontSize: "12px",
      fontVariantNumeric: "tabular-nums"
    });
    track.append(bar);
    row.append(name, track, value);
    list.append(row);
  });
  chartContainer.append(list);
}

function parseTabs(rawCode) {
  const tabs = [];
  let activeTab = null;
  for (const line of rawCode.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      activeTab = { title: heading[1], content: [] };
      tabs.push(activeTab);
    } else if (activeTab) {
      activeTab.content.push(line);
    }
  }
  if (!tabs.length) {
    tabs.push({ title: t("tabsOverview"), content: rawCode.split(/\r?\n/) });
  }
  return tabs.map((tab) => ({ ...tab, text: tab.content.join("\n").trim() }));
}

function makeTabsWidget(rawCode) {
  const tabs = parseTabs(rawCode);
  const container = createElement("div");
  const tabList = createElement("div", undefined, {
    borderBottom: "1px solid var(--color-border-default)",
    display: "flex",
    flexWrap: "wrap",
    gap: "4px"
  });
  tabList.setAttribute("role", "tablist");
  const panel = createElement("pre", undefined, {
    backgroundColor: "var(--color-canvas-inset)",
    borderRadius: "6px",
    color: "var(--color-fg-default)",
    fontFamily: "var(--fontStack-monospace)",
    fontSize: "12px",
    lineHeight: "1.6",
    margin: "12px 0 0",
    maxHeight: "300px",
    overflow: "auto",
    padding: "14px",
    whiteSpace: "pre-wrap"
  });
  panel.setAttribute("role", "tabpanel");
  const tabButtons = [];

  function activate(index) {
    tabButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      button.style.borderBottomColor = active
        ? "var(--color-accent-fg)"
        : "transparent";
      button.style.color = active
        ? "var(--color-fg-default)"
        : "var(--color-fg-muted)";
    });
    panel.textContent = tabs[index].text || t("responseEmpty");
    panel.setAttribute("aria-labelledby", tabButtons[index].id);
  }

  tabs.forEach((tab, index) => {
    const button = createElement("button", tab.title, {
      background: "transparent",
      border: "0",
      borderBottom: "2px solid transparent",
      color: "var(--color-fg-muted)",
      cursor: "pointer",
      font: "inherit",
      padding: "8px 10px"
    });
    button.type = "button";
    button.id = `readme-widget-tab-${globalThis.crypto.randomUUID()}`;
    button.setAttribute("role", "tab");
    button.addEventListener("click", () => activate(index));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + direction + tabs.length) % tabs.length;
      activate(next);
      tabButtons[next].focus();
    });
    tabButtons.push(button);
    tabList.append(button);
  });
  container.append(tabList, panel);
  activate(0);
  return container;
}

function getWidgetContent(codeElement, preElement, rawCode) {
  const type = parseWidgetType(codeElement, preElement, rawCode);
  if (!type) return null;

  if (type === "html-live" || type === "code-editor" || type === "dotnet") {
    if (rawCode.length > MAX_LIVE_CODE_LENGTH) {
      throw new Error(t("errorCodeSize", MAX_LIVE_CODE_LENGTH));
    }
    return {
      type,
      rawCode,
      runtimeCode: type === "html-live"
        ? rawCode.replace(LIVE_PREVIEW_MARKER, "")
        : type === "dotnet" ? rawCode.replace(DOTNET_RUN_MARKER, "") : rawCode
    };
  }
  if (type === "api-request") {
    const request = parseRequest(rawCode);
    return { type, request, rawCode };
  }
  if (type === "api-status") {
    const config = parseJsonConfig(rawCode, type);
    return { type, config, request: normalizeRequest(config), rawCode };
  }
  if (type === "api-chart") {
    const config = parseJsonConfig(rawCode, type);
    validateChartData(config);
    const request = config.url ? normalizeRequest(config) : null;
    return { type, config, request, rawCode };
  }
  return { type, tabs: parseTabs(rawCode), rawCode };
}

const LIVE_PREVIEW_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "media-src data: blob:",
  "font-src data:",
  "connect-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "object-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "navigate-to 'none'"
].join("; ");

function createSandboxFrame(title, sourceDocument, allowModals = false) {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", allowModals ? "allow-scripts allow-modals" : "allow-scripts");
  frame.setAttribute("title", title);
  frame.setAttribute("referrerpolicy", "no-referrer");
  frame.setAttribute("loading", "lazy");
  frame.style.cssText = [
    "display:block",
    "width:100%",
    "height:360px",
    "border:1px solid var(--color-border-default)",
    "border-radius:6px",
    "background:var(--color-canvas-default)"
  ].join(";");
  frame.srcdoc = sourceDocument;
  return frame;
}

function createHtmlPreviewDocument(source) {
  const html = source.replace(/^\uFEFF/, "").replace(LIVE_PREVIEW_MARKER, "").trimStart();
  return [
    "<!doctype html><meta charset=\"utf-8\">",
    `<meta http-equiv="Content-Security-Policy" content="${LIVE_PREVIEW_CSP}">`,
    html
  ].join("");
}

function createDotnetRunnerDocument(token) {
  const runtimeBaseUrl = extensionApi.runtime.getURL("vendor/blazor-wasm/");
  const extensionOrigin = new URL(runtimeBaseUrl).origin;
  const policy = [
    "default-src 'none'",
    `script-src 'unsafe-inline' 'wasm-unsafe-eval' ${extensionOrigin}`,
    `connect-src ${extensionOrigin}`,
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data:",
    `worker-src blob: ${extensionOrigin}`,
    "object-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
    "navigate-to 'none'"
  ].join("; ");
  const safeToken = JSON.stringify(token);
  const safeBaseUrl = JSON.stringify(runtimeBaseUrl);
  const labels = {
    loading: t("dotnetLoading"),
    ready: t("dotnetReady"),
    loadFailed: t("dotnetLoadFailed"),
    noOutput: t("dotnetNoOutput"),
    timedOut: t("dotnetTimedOut"),
    errorPrefix: t("runtimeErrorPrefix")
  };
  return `<!doctype html>
<html lang="${activeLanguage}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${policy}">
<style>
body{margin:0;padding:16px;background:#0d1117;color:#e6edf3;font:13px/1.5 ui-monospace,monospace}
pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}
.status{color:#8d96a0;margin-bottom:8px}
.error{color:#ff7b72}
</style>
</head>
<body>
<div class="status" id="runtime-status"></div>
<pre id="runtime-output"></pre>
<script src="${runtimeBaseUrl}blazor-wasm.js"></script>
<script>
(() => {
  const token = ${safeToken};
  const baseUrl = ${safeBaseUrl};
  const output = document.getElementById("runtime-output");
  const status = document.getElementById("runtime-status");
  let labels = ${JSON.stringify(labels)};
  let runnerPromise;

  function send(message) {
    parent.postMessage({ ...message, token }, "*");
  }

  window.addEventListener("message", async (event) => {
    const data = event.data;
    if (event.source !== parent || !data || data.token !== token) return;
    if (data.type === "language" && data.labels && typeof data.labels.ready === "string") {
      labels = data.labels;
      if (!runnerPromise) status.textContent = labels.ready;
      return;
    }
    if (data.type !== "run" || typeof data.source !== "string") return;

    output.textContent = "";
    output.classList.remove("error");
    status.textContent = labels.loading;
    try {
      if (!runnerPromise) {
        runnerPromise = (async () => {
          if (!globalThis.BlazorRunner) throw new Error(labels.loadFailed);
          const runner = globalThis.BlazorRunner.create({ baseUrl });
          await runner.ready();
          return runner;
        })();
      }
      const runner = await runnerPromise;
      const result = await runner.run(data.source);
      if (!result.success) {
        const diagnostics = (result.errors || [])
          .map((item) => item.line ? item.line + ":" + item.column + " " + item.message : item.message)
          .filter(Boolean)
          .join("\\n");
        throw new Error(diagnostics || labels.loadFailed);
      }
      const rawOutput = result.output || labels.noOutput;
      const text = rawOutput.length > 100000
        ? rawOutput.slice(0, 100000) + "\\n" + labels.outputTruncated
        : rawOutput;
      status.textContent = "";
      output.textContent = text;
      send({ type: "result", requestId: data.requestId, output: text });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      const text = message === labels.loadFailed
        ? labels.loadFailed
        : labels.errorPrefix + " " + message;
      status.textContent = "";
      output.textContent = text;
      output.classList.add("error");
      send({ type: "result", requestId: data.requestId, error: text });
    }
  });

  status.textContent = labels.ready;
  send({ type: "frame-ready" });
})();
</script>
</body>
</html>`;
}

function createDotnetBody(source) {
  const token = globalThis.crypto.randomUUID();
  const frame = createSandboxFrame(t("dotnetTitle"), "");
  const body = createElement("div", undefined, { display: "grid", gap: "10px" });
  let readyResolve;
  let isFrameReady = false;
  const frameReady = new Promise((resolve) => {
    readyResolve = resolve;
  });
  const handleReady = (event) => {
    if (
      event.source !== frame.contentWindow ||
      event.data?.type !== "frame-ready" ||
      event.data?.token !== token
    ) return;
    isFrameReady = true;
    window.removeEventListener("message", handleReady);
    readyResolve();
    frame.contentWindow.postMessage({
      type: "language",
      token,
      labels: getDotnetFrameLabels()
    }, "*");
  };
  window.addEventListener("message", handleReady);
  frame.srcdoc = createDotnetRunnerDocument(token);
  body.append(frame);
  let requestId = 0;
  let lastResult = "";

  return {
    body,
    getCode: () => source,
    getResult: () => lastResult,
    setLanguage() {
      if (!isFrameReady) return;
      frame.contentWindow.postMessage({
        type: "language",
        token,
        labels: getDotnetFrameLabels()
      }, "*");
    },
    async run() {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(t("dotnetLoadFailed"))), 15_000);
        frameReady.then(() => {
          clearTimeout(timeout);
          resolve();
        });
      });

      const currentRequestId = ++requestId;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handleResult);
          lastResult = t("dotnetTimedOut");
          reject(new Error(lastResult));
        }, 120_000);
        const handleResult = (event) => {
          if (
            event.source !== frame.contentWindow ||
            event.data?.type !== "result" ||
            event.data?.token !== token ||
            event.data?.requestId !== currentRequestId
          ) return;
          clearTimeout(timeout);
          window.removeEventListener("message", handleResult);
          if (typeof event.data.error === "string") {
            lastResult = event.data.error;
            reject(new Error(lastResult));
            return;
          }
          lastResult = typeof event.data.output === "string" ? event.data.output : "";
          resolve(lastResult || t("dotnetNoOutput"));
        };
        window.addEventListener("message", handleResult);
        frame.contentWindow.postMessage({
          type: "run",
          token,
          requestId: currentRequestId,
          source
        }, "*");
      });
    }
  };
}

function getDotnetFrameLabels() {
  return {
    loading: t("dotnetLoading"),
    ready: t("dotnetReady"),
    loadFailed: t("dotnetLoadFailed"),
    noOutput: t("dotnetNoOutput"),
    timedOut: t("dotnetTimedOut"),
    errorPrefix: t("runtimeErrorPrefix"),
    outputTruncated: t("outputTruncated", 100000)
  };
}

function createPreviewPlaceholderDocument() {
  const message = t("sandboxReady").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><html lang="${activeLanguage}"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${LIVE_PREVIEW_CSP}"><style>body{margin:0;padding:24px;background:#0d1117;color:#8d96a0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}</style><p>${message}</p></html>`;
}

function createJavaScriptPreviewDocument(source) {
  const safeJson = JSON.stringify(source)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<!doctype html>
<html lang="${activeLanguage}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${LIVE_PREVIEW_CSP}">
<style>
body{margin:0;padding:16px;background:#0d1117;color:#e6edf3;font:13px/1.5 ui-monospace,monospace}
pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}
.error{color:#ff7b72}
</style>
</head>
<body>
<pre id="runtime-output">${t("jsSandboxReady")}\\n</pre>
<script type="application/json" id="runtime-source">${safeJson}</script>
<script>
(() => {
  const output = document.getElementById("runtime-output");
  const original = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  const stringify = (values) => values.map((value) => {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value, null, 2) ?? String(value); }
    catch { return String(value); }
  }).join(" ");
  for (const method of Object.keys(original)) {
    console[method] = (...values) => {
      output.textContent += stringify(values) + "\\n";
      original[method].apply(console, values);
    };
  }
  window.addEventListener("error", (event) => {
    output.textContent += ${JSON.stringify(t("runtimeErrorPrefix"))} + " " + event.message + "\\n";
    output.classList.add("error");
  });
  try {
    const source = JSON.parse(document.getElementById("runtime-source").textContent);
    const script = document.createElement("script");
    script.textContent = source;
    document.body.append(script);
    script.remove();
  } catch (error) {
    output.textContent += ${JSON.stringify(t("runtimeErrorPrefix"))} + " " + String(error) + "\\n";
    output.classList.add("error");
  }
})();
</script>
</body>
</html>`;
}

function createHtmlLiveBody(source) {
  const body = createElement("div", undefined, { display: "grid", gap: "12px" });
  const tabBar = createElement("div", undefined, {
    borderBottom: "1px solid var(--color-border-default)",
    display: "flex",
    gap: "4px"
  });
  tabBar.setAttribute("role", "tablist");
  const previewFrame = createSandboxFrame(
    t("typeHtmlLive"),
    createPreviewPlaceholderDocument(),
    true
  );
  const codePanel = createElement("pre", undefined, {
    backgroundColor: "var(--color-canvas-inset)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "6px",
    color: "var(--color-fg-default)",
    fontFamily: "var(--fontStack-monospace)",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    maxHeight: "360px",
    overflow: "auto",
    padding: "14px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere"
  });
  codePanel.hidden = true;
  const code = document.createElement("code");
  code.textContent = source;
  codePanel.append(code);

  const tabs = [];
  function activate(name) {
    const isPreview = name === "preview";
    previewFrame.hidden = !isPreview;
    previewFrame.style.display = isPreview ? "block" : "none";
    codePanel.hidden = isPreview;
    codePanel.style.display = isPreview ? "none" : "block";
    for (const [tabName, button] of tabs) {
      const active = tabName === name;
      button.setAttribute("aria-selected", String(active));
      button.style.color = active ? "var(--color-fg-default)" : "var(--color-fg-muted)";
      button.style.borderBottomColor = active ? "var(--color-accent-fg)" : "transparent";
    }
  }

  for (const [name, labelKey] of [["preview", "preview"], ["code", "code"]]) {
    const button = createElement("button", t(labelKey), {
      background: "transparent",
      border: "0",
      borderBottom: "2px solid transparent",
      color: "var(--color-fg-muted)",
      cursor: "pointer",
      font: "inherit",
      padding: "8px 12px"
    });
    button.type = "button";
    button.setAttribute("role", "tab");
    button.addEventListener("click", () => activate(name));
    tabs.push([name, button]);
    tabBar.append(button);
  }

  body.append(tabBar, previewFrame, codePanel);
  activate("preview");
  previewFrame.srcdoc = createHtmlPreviewDocument(source);
  return {
    body,
    getCode: () => source,
    setLanguage() {
      tabs[0][1].textContent = t("preview");
      tabs[1][1].textContent = t("code");
    },
    run: () => {
      previewFrame.srcdoc = createHtmlPreviewDocument(source);
      return t("htmlReloaded");
    }
  };
}

function createCodeEditorBody(initialSource) {
  const body = createElement("div", undefined, {
    display: "grid",
    gap: "10px"
  });
  const toolbar = createElement("div", undefined, {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between"
  });
  const modeLabel = createElement("label", undefined, {
    alignItems: "center",
    color: "var(--color-fg-muted)",
    display: "flex",
    fontSize: "13px",
    gap: "8px"
  });
  const modeText = document.createTextNode(t("executionMode"));
  modeLabel.append(modeText);
  const modeSelect = document.createElement("select");
  modeSelect.setAttribute("aria-label", t("executionMode"));
  modeSelect.style.cssText = [
    "background:var(--color-canvas-default)",
    "border:1px solid var(--color-border-default)",
    "border-radius:6px",
    "color:var(--color-fg-default)",
    "padding:6px 8px"
  ].join(";");
  const modeOptions = [
    ["html", "htmlJavaScript"],
    ["javascript", "javascript"]
  ];
  for (const [value, labelKey] of modeOptions) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = t(labelKey);
    modeSelect.append(option);
  }
  modeLabel.append(modeSelect);

  const runButton = createElement("button", t("runSandbox"), {
    backgroundColor: "var(--color-btn-bg)",
    border: "1px solid var(--color-btn-border)",
    borderRadius: "6px",
    color: "var(--color-btn-text)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "12px",
    fontWeight: "600",
    padding: "6px 12px"
  });
  runButton.type = "button";

  const editor = createElement("div", undefined, {
    backgroundColor: "var(--color-canvas-inset)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "6px",
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    maxHeight: "420px",
    minHeight: "180px",
    overflow: "hidden"
  });
  const lineNumbers = createElement("pre", "1", {
    backgroundColor: "var(--color-canvas-subtle)",
    borderRight: "1px solid var(--color-border-default)",
    color: "var(--color-fg-muted)",
    fontFamily: "var(--fontStack-monospace)",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    minWidth: "42px",
    overflow: "hidden",
    padding: "12px 8px",
    textAlign: "right",
    userSelect: "none"
  });
  const textarea = document.createElement("textarea");
  textarea.value = initialSource;
  textarea.setAttribute("aria-label", t("codeEditorLabel"));
  textarea.setAttribute("spellcheck", "false");
  textarea.setAttribute("autocapitalize", "off");
  textarea.setAttribute("autocomplete", "off");
  textarea.setAttribute("autocorrect", "off");
  textarea.style.cssText = [
    "background:transparent",
    "border:0",
    "color:var(--color-fg-default)",
    "font:12px/1.5 var(--fontStack-monospace)",
    "min-height:180px",
    "outline:0",
    "overflow:auto",
    "padding:12px",
    "resize:vertical",
    "tab-size:2",
    "white-space:pre",
    "width:100%"
  ].join(";");
  const lineNumberGutter = document.createElement("div");
  lineNumberGutter.append(lineNumbers);
  editor.append(lineNumberGutter, textarea);

  function updateLineNumbers() {
    const lineCount = Math.max(1, textarea.value.split("\n").length);
    lineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
    lineNumbers.scrollTop = textarea.scrollTop;
  }
  textarea.addEventListener("input", updateLineNumbers);
  textarea.addEventListener("scroll", () => {
    lineNumbers.scrollTop = textarea.scrollTop;
  });
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText("  ", start, end, "end");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  const frame = createSandboxFrame(
    t("typeCodeEditor"),
    createPreviewPlaceholderDocument(),
    true
  );
  toolbar.append(modeLabel, runButton);
  body.append(toolbar, editor, frame);
  updateLineNumbers();

  function runCode() {
    const source = textarea.value;
    if (source.length > MAX_LIVE_CODE_LENGTH) {
      throw new Error(t("errorEditorSize", MAX_LIVE_CODE_LENGTH));
    }
    frame.srcdoc = modeSelect.value === "javascript"
      ? createJavaScriptPreviewDocument(source)
      : createHtmlPreviewDocument(source);
  }

  runButton.addEventListener("click", () => {
    try {
      runCode();
    } catch (error) {
      runButton.title = error instanceof Error ? error.message : String(error);
    }
  });

  return {
    body,
    getCode: () => textarea.value,
    setLanguage() {
      modeText.textContent = t("executionMode");
      for (let index = 0; index < modeOptions.length; index += 1) {
        modeSelect.options[index].textContent = t(modeOptions[index][1]);
      }
      runButton.textContent = t("runSandbox");
    },
    run: () => {
      runCode();
      return t("codeExecuted");
    }
  };
}

function createWidget(model) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const widget = createElement("section", undefined, {
    backgroundColor: "var(--color-canvas-subtle)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "6px",
    boxSizing: "border-box",
    color: "var(--color-fg-default)",
    margin: "16px 0",
    maxWidth: "100%",
    padding: "12px",
    transition: reduceMotion ? "none" : "border-color 140ms ease, box-shadow 140ms ease"
  });
  widget.setAttribute(WIDGET_ATTRIBUTE, "true");

  const header = createElement("div", undefined, {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between"
  });
  const headingText = model.request
    ? `${model.request.method} ${model.request.url}`
    : getTypeLabel(model.type);
  const heading = createElement("code", headingText, {
    color: "var(--color-fg-default)",
    flex: "1 1 200px",
    fontFamily: "var(--fontStack-monospace)",
    lineHeight: "1.4",
    maxHeight: "3.2em",
    minWidth: "0",
    overflowX: "hidden",
    overflowY: "auto",
    overflowWrap: "anywhere",
    scrollbarWidth: "thin"
  });
  heading.title = headingText;
  const brandMark = createElement("img", undefined, {
    flex: "0 0 20px",
    height: "20px",
    width: "20px"
  });
  brandMark.alt = "GitHub README Widgets";
  brandMark.src = extensionApi.runtime.getURL("brand-mark.svg");
  const actions = createElement("div", undefined, {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    flexWrap: "wrap",
    gap: "8px"
  });
  const liveButton = createElement("button", t("liveTest"), {
    backgroundColor: "var(--color-btn-bg)",
    border: "1px solid var(--color-btn-border)",
    borderRadius: "6px",
    boxShadow: "var(--color-btn-shadow), var(--color-btn-inset-shadow)",
    color: "var(--color-btn-text)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "12px",
    fontWeight: "600",
    padding: "5px 12px"
  });
  if (model.type === "html-live") liveButton.textContent = t("previewReload");
  if (model.type === "code-editor") liveButton.textContent = t("execute");
  liveButton.type = "button";
  const discordButton = createElement("button", t("sendDiscord"), {
    background: "transparent",
    border: "1px solid var(--color-border-default)",
    borderRadius: "6px",
    color: "var(--color-fg-muted)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "12px",
    padding: "5px 10px",
    transition: reduceMotion ? "none" : "background-color 120ms ease, color 120ms ease"
  });
  discordButton.type = "button";
  discordButton.setAttribute(
    "aria-label",
    t("sendDiscordLabel", getTypeLabel(model.type))
  );

  const body = createElement("div", undefined, { marginTop: "12px" });
  let statusWidget = null;
  let chartContainer = null;
  let liveRuntime = null;
  let lastResultForDiscord = null;

  if (model.parseError) {
    body.append(createElement("p", model.parseError, {
      color: "var(--color-danger-fg)",
      margin: "0"
    }));
  } else if (model.type === "api-status") {
    statusWidget = makeStatusWidget(model.config);
    body.append(statusWidget.body);
  } else if (model.type === "api-chart") {
    chartContainer = createElement("div");
    renderChart(model.config, chartContainer);
    body.append(chartContainer);
  } else if (model.type === "api-tabs") {
    body.append(makeTabsWidget(model.rawCode));
  } else if (model.type === "html-live") {
    liveRuntime = createHtmlLiveBody(model.runtimeCode);
    body.append(liveRuntime.body);
  } else if (model.type === "code-editor") {
    liveRuntime = createCodeEditorBody(model.rawCode);
    body.append(liveRuntime.body);
  } else if (model.type === "dotnet") {
    liveRuntime = createDotnetBody(model.runtimeCode);
    body.append(liveRuntime.body);
  }

  const resultPanel = createResultPanel(reduceMotion);
  const resultContent = document.createElement("div");

  liveButton.addEventListener("pointerenter", () => {
    if (!liveButton.disabled) liveButton.style.backgroundColor = "var(--color-btn-hover-bg)";
  });
  liveButton.addEventListener("pointerleave", () => {
    liveButton.style.backgroundColor = "var(--color-btn-bg)";
  });
  discordButton.addEventListener("pointerenter", () => {
    discordButton.style.backgroundColor = "var(--color-canvas-default)";
    discordButton.style.color = "var(--color-fg-default)";
  });
  discordButton.addEventListener("pointerleave", () => {
    discordButton.style.backgroundColor = "transparent";
    discordButton.style.color = "var(--color-fg-muted)";
  });

  const updateWidgetLanguage = () => {
    liveButton.textContent = model.type === "html-live"
      ? t("previewReload")
      : model.type === "code-editor"
        ? t("execute")
        : model.type === "dotnet"
          ? t("runDotnet")
        : t("liveTest");
    discordButton.textContent = t("sendDiscord");
    discordButton.setAttribute(
      "aria-label",
      t("sendDiscordLabel", getTypeLabel(model.type))
    );
    if (liveRuntime?.setLanguage) liveRuntime.setLanguage();
    if (statusWidget?.setLanguage) statusWidget.setLanguage();
  };
  updateWidgetLanguage.widget = widget;
  languageUpdaters.add(updateWidgetLanguage);
  updateWidgetLanguage();

  liveButton.addEventListener("click", async () => {
    liveButton.disabled = true;
    liveButton.textContent = model.type === "code-editor" || model.type === "dotnet"
      ? t("executing")
      : t("testing");
    try {
      if (model.parseError) {
        lastResultForDiscord = model.parseError;
        showMessage(resultPanel, resultContent, model.parseError, true);
      } else if (model.type === "html-live" || model.type === "code-editor") {
        lastResultForDiscord = liveRuntime.run();
        showMessage(resultPanel, resultContent, lastResultForDiscord);
      } else if (model.type === "dotnet") {
        lastResultForDiscord = await liveRuntime.run();
        showCodeOutput(resultPanel, resultContent, lastResultForDiscord);
      } else if (model.type === "api-request" || model.type === "api-status" ||
          (model.type === "api-chart" && model.request)) {
        const response = await extensionApi.runtime.sendMessage({
          type: "README_WIDGET_REQUEST",
          method: model.request.method,
          url: model.request.url,
          language: activeLanguage
        });
        lastResultForDiscord = response || { error: t("errorResponse") };
        if (model.type === "api-status") {
          statusWidget.update(response || { error: t("noServerResponse") });
          showMessage(
            resultPanel,
            resultContent,
            response && !response.error
              ? t("statusChecked", response.status)
              : response?.error || t("noServerResponse"),
            !response || Boolean(response.error)
          );
        } else if (model.type === "api-chart") {
          if (response && !response.error) {
            try {
              const liveData = JSON.parse(response.text);
              renderChart(
                { ...model.config, ...liveData, title: model.config.title || liveData.title },
                chartContainer
              );
              showMessage(resultPanel, resultContent, t("chartLoaded", response.status));
            } catch (error) {
              showMessage(
                resultPanel,
                resultContent,
                error instanceof Error ? error.message : t("errorChartData"),
                true
              );
            }
          } else {
            showMessage(
              resultPanel,
              resultContent,
              response?.error || t("noServerResponse"),
              true
            );
          }
        } else {
          showApiResponse(resultPanel, resultContent, response || {
            error: t("errorResponse")
          });
        }
      } else {
        const message = model.type === "api-tabs"
          ? t("tabsAvailable", parseTabs(model.rawCode).length)
          : t("chartValidated");
        lastResultForDiscord = message;
        showMessage(resultPanel, resultContent, message);
      }
    } catch (error) {
      lastResultForDiscord = error instanceof Error ? error.message : String(error);
      showMessage(
        resultPanel,
        resultContent,
        error instanceof Error ? error.message : String(error),
        true
      );
    } finally {
      liveButton.disabled = false;
      updateWidgetLanguage();
    }
  });

  discordButton.addEventListener("click", async () => {
    discordButton.disabled = true;
    discordButton.textContent = t("sending");
    try {
      const response = await extensionApi.runtime.sendMessage({
        type: "sendToDiscord",
        widgetType: model.type,
        widgetLabel: getTypeLabel(model.type),
        language: activeLanguage,
        rawCode: model.type === "html-live" || model.type === "dotnet"
          ? model.rawCode
          : liveRuntime ? liveRuntime.getCode() : model.rawCode,
        hasResult: lastResultForDiscord !== null,
        response: lastResultForDiscord ?? undefined
      });
      showMessage(
        resultPanel,
        resultContent,
        response?.errorCode === "WEBHOOK_NOT_CONFIGURED"
          ? t("errorConfig")
          : response?.error || t("sentDiscord"),
        !response || Boolean(response.error)
      );
    } catch (error) {
      showMessage(
        resultPanel,
        resultContent,
        error instanceof Error ? error.message : String(error),
        true
      );
    } finally {
      discordButton.disabled = false;
      discordButton.textContent = t("sendDiscord");
    }
  });

  actions.append(liveButton, discordButton);
  header.append(brandMark, heading, actions);
  widget.append(header, body, resultPanel);
  resultPanel.append(resultContent);
  return widget;
}

function replaceRequestBlocks() {
  for (const preElement of document.querySelectorAll("pre")) {
    if (preElement.closest(`[${WIDGET_ATTRIBUTE}]`)) continue;
    const codeElement = preElement.querySelector("code") || preElement;

    const rawCode = codeElement.textContent || "";
    const type = parseWidgetType(codeElement, preElement, rawCode);
    if (!type) continue;
    let model;
    try {
      model = getWidgetContent(codeElement, preElement, rawCode);
    } catch (error) {
      model = {
        type,
        rawCode,
        parseError: error instanceof Error ? error.message : String(error)
      };
    }
    if (!model || !preElement.isConnected) continue;

    const widget = createWidget(model);
    preElement.replaceWith(widget);
  }
}

let scanTimer;
function scheduleScan() {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(replaceRequestBlocks, DEBOUNCE_MS);
}

function start() {
  const initializeObserver = () => {
    replaceRequestBlocks();
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    for (const eventName of ["turbo:load", "turbo:render", "pjax:end"]) {
      document.addEventListener(eventName, scheduleScan);
    }
    window.addEventListener("popstate", scheduleScan);
  };

  getStoredLanguage()
    .then((language) => applyLanguage(language))
    .catch((error) => {
      console.error("Could not load the widget language preference:", error);
      applyLanguage("en");
    })
    .finally(initializeObserver);

  extensionApi.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[LANGUAGE_STORAGE_KEY]) {
      applyLanguage(changes[LANGUAGE_STORAGE_KEY].newValue);
    }
  });
}

if (document.documentElement) {
  start();
} else {
  document.addEventListener("DOMContentLoaded", start, { once: true });
}
