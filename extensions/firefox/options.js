"use strict";

const extensionApi = globalThis.browser ?? globalThis.chrome;
const WEBHOOK_STORAGE_KEY = "discordWebhookUrl";
const LANGUAGE_STORAGE_KEY = "uiLanguage";
const form = document.querySelector("#webhook-form");
const input = document.querySelector("#webhook-url");
const saveButton = document.querySelector("#save-webhook");
const visibilityButton = document.querySelector("#toggle-visibility");
const feedback = document.querySelector("#webhook-feedback");
const languageSelect = document.querySelector("#ui-language");
const languageFeedback = document.querySelector("#language-feedback");

const OPTIONS_TEXT = {
  en: {
    documentTitle: "GitHub README Widgets – Settings",
    eyebrow: "Built for GitHub",
    appTitle: "GitHub README Widgets",
    intro: "Interactive code and API widgets, built to run directly inside GitHub repository READMEs.",
    languageHeading: "Extension language",
    languageDescription: "Choose the language used by the dashboard and widgets on GitHub.",
    languageLabel: "Language",
    discordHeading: "Discord webhook",
    discordDescription: "Save a webhook to manually send a widget's code and latest result to your Discord channel.",
    webhookLabel: "Discord webhook URL",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Save webhook",
    showWebhook: "Show",
    hideWebhook: "Hide",
    webhookHint: "The URL is stored locally and used only when you click “Send to Discord.” Treat it like a password.",
    galleryHeading: "Widget gallery",
    galleryDescription: "The code-block language selects the widget rendered on GitHub.",
    apiRequestTitle: "API request",
    apiRequestDescription: "Sends an HTTPS request and displays its HTTP status and response.",
    apiStatusTitle: "API status",
    apiStatusDescription: "Checks an HTTPS endpoint and displays its health as a status badge.",
    apiChartTitle: "API chart",
    apiChartDescription: "Visualizes numeric values from JSON configuration, optionally using live data.",
    apiTabsTitle: "API tabs",
    apiTabsDescription: "Splits a text block into selectable tabs using Markdown headings.",
    htmlLiveTitle: "HTML live preview",
    htmlLiveDescription: "Runs HTML, CSS, and JavaScript in a sandboxed iframe using the github-live-preview marker.",
    codeEditorTitle: "Live code editor",
    codeEditorDescription: "Edit HTML or JavaScript and run it inside the isolated preview.",
    dotnetTitle: "C# / .NET playground",
    dotnetDescription: "Run C# locally in a sandboxed .NET WebAssembly runtime. Execution is opt-in and requires the marker.",
    footer: "Interactive widgets · built by @alexgamingdev",
    languageSaved: "Language preference saved.",
    languageSaveFailed: "Could not save language preference",
    languageLoadFailed: "Could not load language preference.",
    webhookInvalid: "Enter a valid HTTPS Discord webhook URL.",
    webhookSaved: "Discord webhook saved locally.",
    webhookRemoved: "Discord webhook removed.",
    saveFailed: "Could not save",
    loadFailed: "Could not load settings"
  },
  de: {
    documentTitle: "GitHub README Widgets – Einstellungen",
    eyebrow: "Für GitHub",
    appTitle: "GitHub README Widgets",
    intro: "Interaktive Code- und API-Widgets, entwickelt für GitHub-Repository-READMEs.",
    languageHeading: "Sprache der Erweiterung",
    languageDescription: "Wähle die Sprache für das Dashboard und die Widgets auf GitHub.",
    languageLabel: "Sprache",
    discordHeading: "Discord-Webhook",
    discordDescription: "Speichere einen Webhook, um Code und letztes Ergebnis eines Widgets manuell an deinen Discord-Kanal zu senden.",
    webhookLabel: "Discord-Webhook-URL",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Webhook speichern",
    showWebhook: "Anzeigen",
    hideWebhook: "Verbergen",
    webhookHint: "Die URL wird lokal gespeichert und nur beim Klick auf „An Discord senden“ verwendet. Behandle sie wie ein Passwort.",
    galleryHeading: "Widget-Galerie",
    galleryDescription: "Die Codeblock-Sprache bestimmt das Widget, das auf GitHub angezeigt wird.",
    apiRequestTitle: "API-Anfrage",
    apiRequestDescription: "Sendet eine HTTPS-Anfrage und zeigt HTTP-Status und Antwort an.",
    apiStatusTitle: "API-Status",
    apiStatusDescription: "Prüft einen HTTPS-Endpunkt und zeigt den Zustand als Statusmarkierung.",
    apiChartTitle: "API-Diagramm",
    apiChartDescription: "Visualisiert Zahlen aus einer JSON-Konfiguration, optional mit Live-Daten.",
    apiTabsTitle: "API-Tabs",
    apiTabsDescription: "Teilt einen Text anhand von Markdown-Überschriften in auswählbare Tabs.",
    htmlLiveTitle: "HTML-Live-Vorschau",
    htmlLiveDescription: "Führt HTML, CSS und JavaScript mit dem github-live-preview-Marker in einem Sandbox-iframe aus.",
    codeEditorTitle: "Live-Code-Editor",
    codeEditorDescription: "Bearbeite HTML oder JavaScript und führe es in der isolierten Vorschau aus.",
    dotnetTitle: "C# / .NET-Playground",
    dotnetDescription: "Führe C# lokal in einer .NET-WebAssembly-Sandbox aus. Die Ausführung erfolgt nur mit dem Opt-in-Marker.",
    footer: "Interaktive Widgets · entwickelt von @alexgamingdev",
    languageSaved: "Spracheinstellung gespeichert.",
    languageSaveFailed: "Spracheinstellung konnte nicht gespeichert werden",
    languageLoadFailed: "Spracheinstellung konnte nicht geladen werden.",
    webhookInvalid: "Gib eine gültige HTTPS-Discord-Webhook-URL ein.",
    webhookSaved: "Discord-Webhook lokal gespeichert.",
    webhookRemoved: "Discord-Webhook entfernt.",
    saveFailed: "Speichern fehlgeschlagen",
    loadFailed: "Einstellungen konnten nicht geladen werden"
  },
  es: {
    documentTitle: "GitHub README Widgets – Configuración",
    eyebrow: "Para GitHub",
    appTitle: "GitHub README Widgets",
    intro: "Widgets interactivos de código y API, diseñados para los README de repositorios de GitHub.",
    languageHeading: "Idioma de la extensión",
    languageDescription: "Elige el idioma del panel y de los widgets en GitHub.",
    languageLabel: "Idioma",
    discordHeading: "Webhook de Discord",
    discordDescription: "Guarda un webhook para enviar manualmente el código y el último resultado del widget a Discord.",
    webhookLabel: "URL del webhook de Discord",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Guardar webhook",
    showWebhook: "Mostrar",
    hideWebhook: "Ocultar",
    webhookHint: "La URL se guarda localmente y solo se usa al pulsar «Enviar a Discord». Trátala como una contraseña.",
    galleryHeading: "Galería de widgets",
    galleryDescription: "El lenguaje del bloque de código determina el widget que se muestra en GitHub.",
    apiRequestTitle: "Solicitud API",
    apiRequestDescription: "Envía una solicitud HTTPS y muestra su estado HTTP y respuesta.",
    apiStatusTitle: "Estado API",
    apiStatusDescription: "Comprueba un endpoint HTTPS y muestra su estado.",
    apiChartTitle: "Gráfico API",
    apiChartDescription: "Visualiza valores numéricos de JSON, opcionalmente con datos en vivo.",
    apiTabsTitle: "Pestañas API",
    apiTabsDescription: "Divide un bloque de texto en pestañas mediante encabezados Markdown.",
    htmlLiveTitle: "Vista HTML en vivo",
    htmlLiveDescription: "Ejecuta HTML, CSS y JavaScript en un iframe aislado con el marcador github-live-preview.",
    codeEditorTitle: "Editor de código en vivo",
    codeEditorDescription: "Edita HTML o JavaScript y ejecútalo en la vista previa aislada.",
    dotnetTitle: "Entorno C# / .NET",
    dotnetDescription: "Ejecuta C# localmente en un sandbox .NET WebAssembly. La ejecución requiere el marcador de activación.",
    footer: "Widgets interactivos · creado por @alexgamingdev",
    languageSaved: "Preferencia de idioma guardada.",
    languageSaveFailed: "No se pudo guardar el idioma",
    languageLoadFailed: "No se pudo cargar el idioma.",
    webhookInvalid: "Introduce una URL HTTPS válida de webhook de Discord.",
    webhookSaved: "Webhook de Discord guardado localmente.",
    webhookRemoved: "Webhook de Discord eliminado.",
    saveFailed: "No se pudo guardar",
    loadFailed: "No se pudo cargar la configuración"
  },
  fr: {
    documentTitle: "GitHub README Widgets – Paramètres",
    eyebrow: "Pour GitHub",
    appTitle: "GitHub README Widgets",
    intro: "Des widgets interactifs de code et d’API, conçus pour les README de dépôts GitHub.",
    languageHeading: "Langue de l’extension",
    languageDescription: "Choisissez la langue du tableau de bord et des widgets GitHub.",
    languageLabel: "Langue",
    discordHeading: "Webhook Discord",
    discordDescription: "Enregistrez un webhook pour envoyer manuellement le code et le dernier résultat du widget sur Discord.",
    webhookLabel: "URL du webhook Discord",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Enregistrer le webhook",
    showWebhook: "Afficher",
    hideWebhook: "Masquer",
    webhookHint: "L’URL est stockée localement et utilisée uniquement après un clic sur « Envoyer à Discord ». Traitez-la comme un mot de passe.",
    galleryHeading: "Galerie de widgets",
    galleryDescription: "Le langage du bloc de code détermine le widget affiché sur GitHub.",
    apiRequestTitle: "Requête API",
    apiRequestDescription: "Envoie une requête HTTPS et affiche son statut HTTP et sa réponse.",
    apiStatusTitle: "État de l’API",
    apiStatusDescription: "Vérifie un endpoint HTTPS et affiche son état.",
    apiChartTitle: "Graphique API",
    apiChartDescription: "Visualise des valeurs numériques JSON, avec une source de données en direct si souhaité.",
    apiTabsTitle: "Onglets API",
    apiTabsDescription: "Divise un bloc de texte en onglets à l’aide des titres Markdown.",
    htmlLiveTitle: "Aperçu HTML en direct",
    htmlLiveDescription: "Exécute HTML, CSS et JavaScript dans un iframe isolé avec le marqueur github-live-preview.",
    codeEditorTitle: "Éditeur de code en direct",
    codeEditorDescription: "Modifiez du HTML ou du JavaScript et exécutez-le dans l’aperçu isolé.",
    dotnetTitle: "Environnement C# / .NET",
    dotnetDescription: "Exécutez C# localement dans un bac à sable .NET WebAssembly. L’exécution nécessite le marqueur d’activation.",
    footer: "Widgets interactifs · créé par @alexgamingdev",
    languageSaved: "Préférence linguistique enregistrée.",
    languageSaveFailed: "Impossible d’enregistrer la langue",
    languageLoadFailed: "Impossible de charger la langue.",
    webhookInvalid: "Saisissez une URL HTTPS de webhook Discord valide.",
    webhookSaved: "Webhook Discord enregistré localement.",
    webhookRemoved: "Webhook Discord supprimé.",
    saveFailed: "Échec de l’enregistrement",
    loadFailed: "Impossible de charger les paramètres"
  },
  cs: {
    documentTitle: "GitHub README Widgets – Nastavení",
    eyebrow: "Pro GitHub",
    appTitle: "GitHub README Widgets",
    intro: "Interaktivní kódové a API widgety vytvořené pro README repozitářů na GitHubu.",
    languageHeading: "Jazyk rozšíření",
    languageDescription: "Vyberte jazyk nástěnky a widgetů na GitHubu.",
    languageLabel: "Jazyk",
    discordHeading: "Webhook Discordu",
    discordDescription: "Uložte webhook pro ruční odeslání kódu a posledního výsledku widgetu na Discord.",
    webhookLabel: "URL webhooku Discordu",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Uložit webhook",
    showWebhook: "Zobrazit",
    hideWebhook: "Skrýt",
    webhookHint: "URL se ukládá místně a použije se jen po kliknutí na „Odeslat na Discord“. Zacházejte s ní jako s heslem.",
    galleryHeading: "Galerie widgetů",
    galleryDescription: "Jazyk bloku kódu určuje widget zobrazený na GitHubu.",
    apiRequestTitle: "Požadavek API",
    apiRequestDescription: "Odešle požadavek HTTPS a zobrazí jeho stav HTTP a odpověď.",
    apiStatusTitle: "Stav API",
    apiStatusDescription: "Ověří koncový bod HTTPS a zobrazí jeho stav.",
    apiChartTitle: "Graf API",
    apiChartDescription: "Zobrazuje číselné hodnoty JSON, případně z živého zdroje dat.",
    apiTabsTitle: "Záložky API",
    apiTabsDescription: "Rozdělí text na volitelné záložky podle nadpisů Markdown.",
    htmlLiveTitle: "Živý náhled HTML",
    htmlLiveDescription: "Spustí HTML, CSS a JavaScript v izolovaném iframe pomocí značky github-live-preview.",
    codeEditorTitle: "Živý editor kódu",
    codeEditorDescription: "Upravte HTML nebo JavaScript a spusťte jej v izolovaném náhledu.",
    dotnetTitle: "Prostředí C# / .NET",
    dotnetDescription: "Spouštějte C# místně v izolovaném .NET WebAssembly sandboxu. Spuštění vyžaduje aktivační značku.",
    footer: "Interaktivní widgety · vytvořil @alexgamingdev",
    languageSaved: "Jazykové nastavení uloženo.",
    languageSaveFailed: "Jazyk se nepodařilo uložit",
    languageLoadFailed: "Jazyk se nepodařilo načíst.",
    webhookInvalid: "Zadejte platnou HTTPS URL webhooku Discordu.",
    webhookSaved: "Webhook Discordu byl uložen místně.",
    webhookRemoved: "Webhook Discordu byl odstraněn.",
    saveFailed: "Uložení se nezdařilo",
    loadFailed: "Nastavení se nepodařilo načíst"
  },
  nl: {
    documentTitle: "GitHub README Widgets – Instellingen",
    eyebrow: "Voor GitHub",
    appTitle: "GitHub README Widgets",
    intro: "Interactieve code- en API-widgets, gemaakt voor README’s van GitHub-repositories.",
    languageHeading: "Extensietaal",
    languageDescription: "Kies de taal voor het dashboard en de widgets op GitHub.",
    languageLabel: "Taal",
    discordHeading: "Discord-webhook",
    discordDescription: "Sla een webhook op om de code en het laatste resultaat van een widget handmatig naar Discord te sturen.",
    webhookLabel: "Discord-webhook-URL",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Webhook opslaan",
    showWebhook: "Tonen",
    hideWebhook: "Verbergen",
    webhookHint: "De URL wordt lokaal opgeslagen en alleen gebruikt wanneer je op ‘Naar Discord sturen’ klikt. Behandel deze als een wachtwoord.",
    galleryHeading: "Widgetgalerij",
    galleryDescription: "De codebloktaal bepaalt welke widget op GitHub wordt weergegeven.",
    apiRequestTitle: "API-verzoek",
    apiRequestDescription: "Verstuurt een HTTPS-verzoek en toont de HTTP-status en het antwoord.",
    apiStatusTitle: "API-status",
    apiStatusDescription: "Controleert een HTTPS-endpoint en toont de status als badge.",
    apiChartTitle: "API-grafiek",
    apiChartDescription: "Visualiseert numerieke JSON-waarden, eventueel met livegegevens.",
    apiTabsTitle: "API-tabbladen",
    apiTabsDescription: "Verdeelt tekst in selecteerbare tabbladen met Markdown-koppen.",
    htmlLiveTitle: "HTML-livepreview",
    htmlLiveDescription: "Voert HTML, CSS en JavaScript uit in een geïsoleerde iframe met de marker github-live-preview.",
    codeEditorTitle: "Live code-editor",
    codeEditorDescription: "Bewerk HTML of JavaScript en voer het uit in de geïsoleerde preview.",
    dotnetTitle: "C# / .NET-speelomgeving",
    dotnetDescription: "Voer C# lokaal uit in een geïsoleerde .NET WebAssembly-sandbox. Uitvoering vereist de activeringsmarkering.",
    footer: "Interactieve widgets · gemaakt door @alexgamingdev",
    languageSaved: "Taalvoorkeur opgeslagen.",
    languageSaveFailed: "Taalvoorkeur opslaan mislukt",
    languageLoadFailed: "Taalvoorkeur laden mislukt.",
    webhookInvalid: "Voer een geldige HTTPS Discord-webhook-URL in.",
    webhookSaved: "Discord-webhook lokaal opgeslagen.",
    webhookRemoved: "Discord-webhook verwijderd.",
    saveFailed: "Opslaan mislukt",
    loadFailed: "Instellingen laden mislukt"
  },
  tlh: {
    documentTitle: "GitHub README Widgets – chugh",
    eyebrow: "GitHubvaD chenmo'lu'",
    appTitle: "GitHub README Widgets",
    intro: "GitHub READMEmeyvaD chenmo'lu' interactive code 'ej API widgetmey.",
    languageHeading: "Extension Hol",
    languageDescription: "Dashboard je GitHub widgetmey Hol yIwIv.",
    languageLabel: "Hol",
    discordHeading: "Discord webhook",
    discordDescription: "Webhook yIpol, widget ghItlh je QIn wa'DIch DiscordDaq ngeHmeH.",
    webhookLabel: "Discord webhook URL",
    webhookPlaceholder: "https://discord.com/api/webhooks/…",
    saveWebhook: "Webhook yIpol",
    showWebhook: "yIlegh",
    hideWebhook: "yISo'",
    webhookHint: "URL localDaq pol, ‘DiscordDaq ngeH’ yI-clickDI' neH lo'. password rur, yIHoS.",
    galleryHeading: "Widgetmey",
    galleryDescription: "Code block Hol GitHubDaq widget wIv.",
    apiRequestTitle: "API QIn",
    apiRequestDescription: "HTTPS QIn ngeH, HTTP status je jangghom qaw.",
    apiStatusTitle: "API Dotlh",
    apiStatusDescription: "HTTPS endpoint yI'ol, Dotlh yI'ang.",
    apiChartTitle: "API chart",
    apiChartDescription: "JSON mI' yI'ang, live data je.",
    apiTabsTitle: "API tabs",
    apiTabsDescription: "Markdown headings lo' text tabs chenmoH.",
    htmlLiveTitle: "HTML yIn HaSta",
    htmlLiveDescription: "HTML, CSS, JavaScript sandbox iframeDaq Qap; github-live-preview marker yIlo'.",
    codeEditorTitle: "yIn ghItlh choH",
    codeEditorDescription: "HTML pagh JavaScript choH, ngaQlu'bogh previewDaq yI-lu'.",
    dotnetTitle: "C# / .NET QujmeH Daq",
    dotnetDescription: "C# locally .NET WebAssembly sandboxDaq yI-lu'. Marker yIlo' neH.",
    footer: "Widgetmey · @alexgamingdev chenmoH",
    languageSaved: "Hol preference polta'.",
    languageSaveFailed: "Hol pollaHbe'",
    languageLoadFailed: "Hol SuqlaHbe'.",
    webhookInvalid: "HTTPS Discord webhook URL Dajang.",
    webhookSaved: "Discord webhook localDaq polta'.",
    webhookRemoved: "Discord webhook teqta'.",
    saveFailed: "polHa'lu'",
    loadFailed: "settings SuqlaHbe'"
  },
  upside: {}
};

function upsideDown(value) {
  const pairs = [
    ["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "ɐqɔpǝɟɓɥıɾʞןɯuodbɹsʇnʌʍxʎz∀𐐒Ɔ◖ƎℲפHIſ⋊˥WNOԀΌᴚS⊥∩ΛMX⅄Z0ƖᄅƐㄣϛ9ㄥ86"],
    [".,!?()[]{}<>_'\"", "˙'¡¿)(][}{><‾,„"]
  ];
  const map = new Map();
  for (const [source, target] of pairs) {
    const flipped = Array.from(target);
    Array.from(source).forEach((character, index) => {
      if (flipped[index]) map.set(character, flipped[index]);
    });
  }
  return Array.from(value).reverse().map((character) => map.get(character) ?? character).join("");
}

const KLINGON_EASTER_EGGS = {
  intro: "Interactive widgets built for GitHub README pages, warrior. Qapla'!",
  languageSaved: "Language preference saved. Qapla'!",
  webhookSaved: "Discord webhook saved locally. Qapla'!",
  footer: "Interactive widgets · built by @alexgamingdev · Qapla'!"
};

function isValidWebhookUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["discord.com", "discordapp.com"].includes(url.hostname.toLowerCase()) &&
      (url.port === "" || url.port === "443") &&
      !url.username &&
      !url.password &&
      !url.hash &&
      /^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function text(language, key) {
  const english = OPTIONS_TEXT.en[key];
  if (language === "tlh") return KLINGON_EASTER_EGGS[key] || english;
  if (language === "upside") return upsideDown(english);
  return OPTIONS_TEXT[language]?.[key] || english;
}

function applyLanguage(language) {
  const selectedLanguage = Object.hasOwn(OPTIONS_TEXT, language) ? language : "en";
  languageSelect.value = selectedLanguage;
  document.documentElement.lang =
    selectedLanguage === "tlh" || selectedLanguage === "upside" ? "en" : selectedLanguage;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = text(selectedLanguage, element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.setAttribute(
      "placeholder",
      text(selectedLanguage, element.dataset.i18nPlaceholder)
    );
  }
  if (input.type === "password") {
    visibilityButton.textContent = text(selectedLanguage, "showWebhook");
  } else {
    visibilityButton.textContent = text(selectedLanguage, "hideWebhook");
  }
  return selectedLanguage;
}

function setFeedback(element, message, state) {
  element.textContent = message;
  element.dataset.state = state;
}

function getStoredValues() {
  if (globalThis.browser) {
    return extensionApi.storage.local.get([WEBHOOK_STORAGE_KEY, LANGUAGE_STORAGE_KEY]);
  }
  return new Promise((resolve, reject) => {
    extensionApi.storage.local.get([WEBHOOK_STORAGE_KEY, LANGUAGE_STORAGE_KEY], (stored) => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(stored);
    });
  });
}

function storeValues(values) {
  if (globalThis.browser) {
    return extensionApi.storage.local.set(values);
  }
  return new Promise((resolve, reject) => {
    extensionApi.storage.local.set(values, () => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = input.value.trim();
  const language = languageSelect.value;

  if (value && !isValidWebhookUrl(value)) {
    setFeedback(feedback, text(language, "webhookInvalid"), "error");
    input.focus();
    return;
  }

  saveButton.disabled = true;
  try {
    await storeValues({ [WEBHOOK_STORAGE_KEY]: value });
    setFeedback(
      feedback,
      value ? text(language, "webhookSaved") : text(language, "webhookRemoved"),
      "success"
    );
  } catch (error) {
    setFeedback(
      feedback,
      `${text(language, "saveFailed")}: ${error instanceof Error ? error.message : String(error)}`,
      "error"
    );
  } finally {
    saveButton.disabled = false;
  }
});

visibilityButton.addEventListener("click", () => {
  const reveal = input.type === "password";
  input.type = reveal ? "url" : "password";
  visibilityButton.textContent = text(
    languageSelect.value,
    reveal ? "hideWebhook" : "showWebhook"
  );
  visibilityButton.setAttribute("aria-pressed", String(reveal));
});

languageSelect.addEventListener("change", async () => {
  const language = applyLanguage(languageSelect.value);
  languageSelect.disabled = true;
  languageFeedback.textContent = "";
  try {
    await storeValues({ [LANGUAGE_STORAGE_KEY]: language });
    setFeedback(languageFeedback, text(language, "languageSaved"), "success");
  } catch (error) {
    setFeedback(
      languageFeedback,
      `${text(language, "languageSaveFailed")}: ${error instanceof Error ? error.message : String(error)}`,
      "error"
    );
  } finally {
    languageSelect.disabled = false;
  }
});

getStoredValues()
  .then(async (stored) => {
    input.value = stored[WEBHOOK_STORAGE_KEY] || "";
    const language = applyLanguage(stored[LANGUAGE_STORAGE_KEY]);
    if (stored[LANGUAGE_STORAGE_KEY] !== language) {
      await storeValues({ [LANGUAGE_STORAGE_KEY]: language });
    }
  })
  .catch((error) => {
    const language = applyLanguage("en");
    setFeedback(
      feedback,
      `${text(language, "loadFailed")}: ${error instanceof Error ? error.message : String(error)}`,
      "error"
    );
    setFeedback(languageFeedback, text(language, "languageLoadFailed"), "error");
  });
