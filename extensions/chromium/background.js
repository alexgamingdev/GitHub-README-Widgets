"use strict";

const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS"
]);
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_LENGTH = 100_000;
const RESPONSE_TRUNCATION_LABELS = {
  en: (limit) => `[Output truncated at ${limit.toLocaleString("en-US")} characters.]`,
  de: (limit) => `[Ausgabe nach ${limit.toLocaleString("de-DE")} Zeichen gekürzt.]`,
  es: (limit) => `[Salida truncada después de ${limit.toLocaleString("es-ES")} caracteres.]`,
  fr: (limit) => `[Sortie tronquée après ${limit.toLocaleString("fr-FR")} caractères.]`,
  cs: (limit) => `[Výstup zkrácen po ${limit.toLocaleString("cs-CZ")} znacích.]`,
  nl: (limit) => `[Uitvoer afgekapt na ${limit.toLocaleString("nl-NL")} tekens.]`,
  tlh: (limit) => `[Output truncated at ${limit.toLocaleString("en-US")} characters. Qapla'!]`
};
const UPSIDE_DOWN_PAIRS = [
  ["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "ɐqɔpǝɟɓɥıɾʞןɯuodbɹsʇnʌʍxʎz∀𐐒Ɔ◖ƎℲפHIſ⋊˥WNOԀΌᴚS⊥∩ΛMX⅄Z0ƖᄅƐㄣϛ9ㄥ86"],
  [".,!?()[]{}<>_'\"", "˙'¡¿)(][}{><‾,„"]
];
const MAX_DISCORD_SOURCE_LENGTH = 100_000;
const MAX_DISCORD_RESPONSE_LENGTH = 120_000;
const DISCORD_WIDGET_TYPES = new Set([
  "api-request",
  "api-chart",
  "api-status",
  "api-tabs",
  "html-live",
  "code-editor",
  "dotnet"
]);
const extensionApi = globalThis.chrome;
const MISSING_WEBHOOK_ERROR =
  "Richte zuerst in den Erweiterungsoptionen eine Discord-Webhook-URL ein.";

function upsideDown(text) {
  const map = new Map();
  for (const [source, target] of UPSIDE_DOWN_PAIRS) {
    const flipped = Array.from(target);
    Array.from(source).forEach((character, index) => {
      if (flipped[index]) map.set(character, flipped[index]);
    });
  }
  return Array.from(text).reverse().map((character) => map.get(character) ?? character).join("");
}

function responseTruncationNotice(language) {
  const notice = RESPONSE_TRUNCATION_LABELS[language]?.(MAX_RESPONSE_LENGTH) ??
    RESPONSE_TRUNCATION_LABELS.en(MAX_RESPONSE_LENGTH);
  return language === "upside"
    ? upsideDown(RESPONSE_TRUNCATION_LABELS.en(MAX_RESPONSE_LENGTH))
    : notice;
}

function openOptionsPage() {
  return new Promise((resolve, reject) => {
    extensionApi.runtime.openOptionsPage(() => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve({ success: true });
    });
  });
}

function parseHttpsUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048) {
    throw new Error("Die URL fehlt oder ist zu lang.");
  }
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password
  ) {
    throw new Error("Es sind nur HTTPS-URLs ohne eingebettete Zugangsdaten erlaubt.");
  }
  return url;
}

function validateRequest(message) {
  if (!message || typeof message.method !== "string") {
    throw new Error("Die Anfrage muss eine HTTP-Methode und eine URL enthalten.");
  }

  const url = parseHttpsUrl(message.url);
  const method = message.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`Die HTTP-Methode "${method}" wird nicht unterstützt.`);
  }

  return { url, method };
}

function validateWebhookUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Die gespeicherte Discord-Webhook-URL ist ungültig.");
  }

  if (
    url.protocol !== "https:" ||
    !["discord.com", "discordapp.com"].includes(url.hostname.toLowerCase()) ||
    (url.port !== "" && url.port !== "443") ||
    url.username ||
    url.password ||
    url.hash ||
    !/^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(url.pathname)
  ) {
    throw new Error("Bitte speichere eine gültige Discord-Webhook-URL.");
  }
  return url;
}

async function getStoredWebhookUrl() {
  if (globalThis.browser) {
    const stored = await extensionApi.storage.local.get("discordWebhookUrl");
    return stored.discordWebhookUrl;
  }

  return new Promise((resolve, reject) => {
    extensionApi.storage.local.get("discordWebhookUrl", (stored) => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(stored.discordWebhookUrl);
    });
  });
}

function buildDiscordPayload(message) {
  if (
    typeof message.widgetType !== "string" ||
    !DISCORD_WIDGET_TYPES.has(message.widgetType) ||
    typeof message.rawCode !== "string" ||
    message.rawCode.length > MAX_DISCORD_SOURCE_LENGTH ||
    (message.response !== undefined &&
      typeof message.response !== "string" &&
      typeof message.response !== "object") ||
    (typeof message.response === "string" &&
      message.response.length > MAX_DISCORD_RESPONSE_LENGTH) ||
    (message.hasResult !== undefined && typeof message.hasResult !== "boolean")
  ) {
    throw new Error("Der Widget-Typ, Codeausschnitt oder das Ergebnis ist ungültig.");
  }

  const typeNames = {
    "api-request": "API-Request",
    "api-chart": "API-Chart",
    "api-status": "API-Status",
    "api-tabs": "API-Tabs",
    "html-live": "HTML-Live",
    "code-editor": "Code-Editor",
    dotnet: "C# / .NET"
  };
  const safeFenceContent = (value) => value.replace(/```/g, "`\u200b``");
  const truncate = (value, limit) => {
    if (value.length <= limit) return value;
    const note = "\n[Truncated for Discord.]";
    return `${value.slice(0, limit - note.length)}${note}`;
  };
  const code = truncate(safeFenceContent(message.rawCode || "(Empty code block)"), 3_000);
  const rawResponseValue = typeof message.response === "string"
    ? message.response
    : message.response === undefined
      ? "(No result produced yet)"
      : message.response && typeof message.response.error === "string"
        ? `Error: ${message.response.error}`
        : message.response && typeof message.response.text === "string" &&
            Number.isFinite(message.response.status)
          ? `HTTP ${message.response.status} ${message.response.statusText || ""}\n${message.response.text}`.trim()
          : JSON.stringify(message.response, null, 2);
  if (typeof rawResponseValue !== "string" ||
      rawResponseValue.length > MAX_DISCORD_RESPONSE_LENGTH) {
    throw new Error("Die Widget-Antwort ist ungültig oder zu lang.");
  }
  const responseValue = rawResponseValue;
  const result = truncate(safeFenceContent(responseValue || "(Empty result)"), 900);
  const language = typeof message.language === "string" ? message.language : "en";
  const labels = {
    en: ["Code snippet", "Latest result / response", "Sent from an Interactive README Widget"],
    de: ["Codeausschnitt", "Letztes Ergebnis / Antwort", "Gesendet aus einem Interactive README Widget"],
    es: ["Fragmento de código", "Último resultado / respuesta", "Enviado desde un widget de README interactivo"],
    fr: ["Extrait de code", "Dernier résultat / réponse", "Envoyé depuis un widget README interactif"],
    cs: ["Ukázka kódu", "Poslední výsledek / odpověď", "Odesláno z interaktivního README widgetu"],
    nl: ["Codefragment", "Laatste resultaat / antwoord", "Verzonden vanuit een interactieve README-widget"],
    tlh: ["Code snippet · Qapla'!", "Latest result / response", "Sent from an Interactive README Widget · Qapla'!"]
  };
  const chosenLabels = labels[language] || labels.en;
  const [codeLabel, responseLabel, footerLabel] = language === "upside"
    ? chosenLabels.map(upsideDown)
    : chosenLabels;
  const name = typeof message.widgetLabel === "string" && message.widgetLabel.length <= 80
    ? message.widgetLabel
    : typeNames[message.widgetType];

  return {
    allowed_mentions: { parse: [] },
    embeds: [
      {
        author: { name: "GitHub README Widgets · @alexgamingdev" },
        title: name,
        description: `${codeLabel}\n\`\`\`md\n${code}\n\`\`\``,
        color: 0x2f81f7,
        footer: { text: footerLabel },
        fields: [{
          name: responseLabel,
          value: message.hasResult === false
            ? "(No result has been produced yet.)"
            : `\`\`\`text\n${result}\n\`\`\``,
          inline: false
        }],
        timestamp: new Date().toISOString()
      }
    ],
    responseAttachment: message.hasResult === true ? responseValue : null,
    responseLabel
  };
}

async function sendToDiscord(message) {
  const webhookValue = await getStoredWebhookUrl();
  if (typeof webhookValue !== "string" || !webhookValue.trim()) {
    throw new Error(MISSING_WEBHOOK_ERROR);
  }

  const webhookUrl = validateWebhookUrl(webhookValue.trim());
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const discordPayload = buildDiscordPayload(message);
    let body;
    let headers;
    if (discordPayload.responseAttachment !== null) {
      const { responseAttachment, responseLabel, ...payload } = discordPayload;
      payload.attachments = [{
        id: 0,
        filename: "widget-response.txt",
        description: responseLabel
      }];
      body = new FormData();
      body.append("payload_json", JSON.stringify(payload));
      body.append(
        "files[0]",
        new Blob([responseAttachment], { type: "text/plain;charset=utf-8" }),
        "widget-response.txt"
      );
    } else {
      const { responseAttachment, responseLabel, ...payload } = discordPayload;
      body = JSON.stringify(payload);
      headers = { "Content-Type": "application/json" };
    }

    const response = await fetch(webhookUrl.href, {
      method: "POST",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
      headers,
      body
    });
    if (!response.ok) {
      throw new Error(`Discord hat die Nachricht abgelehnt (HTTP ${response.status}).`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
  return { success: true };
}

async function handleExtensionMessage(message, sender) {
  try {
    if (
      !message ||
      !["README_WIDGET_REQUEST", "sendToDiscord", "openOptions"].includes(message.type)
    ) {
      return undefined;
    }

    if (sender.id !== extensionApi.runtime.id) {
      throw new Error("Die Anfrage kam nicht von dieser Erweiterung.");
    }

    if (message.type === "sendToDiscord") {
      return await sendToDiscord(message);
    }
    if (message.type === "openOptions") {
      return await openOptionsPage();
    }

    const { url, method } = validateRequest(message);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.href, {
        method,
        credentials: "omit",
        redirect: "error",
        signal: controller.signal
      });

      const contentType = response.headers.get("content-type") || "";
      let responseText = method === "HEAD" ? "" : await response.text();

      if (responseText && contentType.toLowerCase().includes("json")) {
        try {
          responseText = JSON.stringify(JSON.parse(responseText), null, 2);
        } catch {
          // Keep the original body when a server labels non-JSON text as JSON.
        }
      }

      const truncated = responseText.length > MAX_RESPONSE_LENGTH;

      return {
        status: response.status,
        statusText: response.statusText,
        contentType,
        text: truncated
          ? `${responseText.slice(0, MAX_RESPONSE_LENGTH)}\n\n${responseTruncationNotice(message.language)}`
          : responseText,
        truncated
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const messageText =
      error.name === "AbortError"
        ? "Zeitüberschreitung: Der Server hat innerhalb von 15 Sekunden nicht geantwortet."
        : error instanceof Error
          ? error.message
          : String(error);
    return {
      error: messageText,
      ...(message?.type === "sendToDiscord" && error.message === MISSING_WEBHOOK_ERROR
        ? { errorCode: "WEBHOOK_NOT_CONFIGURED" }
        : {})
    };
  }
}

extensionApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    !message ||
    !["README_WIDGET_REQUEST", "sendToDiscord", "openOptions"].includes(message.type)
  ) {
    return false;
  }
  handleExtensionMessage(message, sender).then(sendResponse);
  return true;
});
