# GitHub README Widgets

**A browser extension that turns supported code blocks in GitHub repository READMEs into interactive API, chart, tab, and sandboxed code widgets.**

GitHub README Widgets is a Manifest V3 extension for Chromium-based browsers and Firefox. It supports API requests and status checks, charts, Markdown tabs, live HTML previews, a local code editor, and an optional C#/.NET WebAssembly runner.

> **Note:** Widgets run in your browser when you view a repository on GitHub. GitHub itself does not render these widgets for other visitors.

## Features

- Run API requests and display API status or chart data.
- Turn Markdown sections into selectable tabs.
- Preview HTML, CSS, and JavaScript in a sandboxed iframe after an explicit click.
- Edit and run HTML or JavaScript locally in an isolated preview.
- Optionally compile and run marked C# code locally with a bundled .NET WebAssembly runtime.
- Save a Discord webhook locally and send widget content only after you explicitly choose to share it.
- Use the extension UI in English, German, Spanish, French, Czech, Dutch, Klingon, or Upperdown English.

## Install for development

### Requirements

- Node.js 20 or later
- npm

### Build the browser packages

```sh
npm ci
npm run build
```

The generated packages are written to `dist/chromium` and `dist/firefox`.

### Load in a Chromium browser

1. Open the browser's extension management page (`chrome://extensions` in Chrome, `edge://extensions` in Edge, or the equivalent page in another Chromium browser).
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `dist/chromium`.
4. Open or reload a GitHub repository page containing a supported code block.

### Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select `dist/firefox/manifest.json`.
4. Open or reload a GitHub repository page containing a supported code block.

Firefox temporary add-ons are removed when Firefox closes. A permanent Firefox release must be signed through Mozilla Add-ons.

## Supported code blocks

### API request

Put an HTTP method and HTTPS URL on a line of its own. Supported methods are `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`.

```http
GET https://api.github.com
```

Requests do not include additional headers or a request body. The extension does not send cookies or follow redirects. API responses are shown in the widget; JSON is formatted and responses over 100,000 characters are truncated.

### API status

Provide a JSON object with a `url`. `method`, `label`, and `statusPath` are optional.

```api-status
{"url":"https://api.github.com","label":"GitHub API","statusPath":"status"}
```

Known healthy values such as `operational`, `ok`, and `up` are shown in green. Values such as `down`, `error`, and `degraded` are shown in red.

### API chart

Provide `labels` and `values` arrays of equal length. An optional `url` lets the widget reload JSON data when you choose **Test live**.

```api-chart
{"title":"Weekly signups","labels":["Mon","Tue","Wed"],"values":[12,18,15]}
```

### Markdown tabs

Each level-two heading starts a new tab. Content is rendered as text, not HTML.

```api-tabs
## JavaScript
Use JavaScript examples here.

## TypeScript
Use TypeScript examples here.
```

### Live HTML and code editor

Use an `html-live` block for a complete HTML preview. The preview starts only after a click and runs in a sandboxed iframe.

```html-live
<!doctype html>
<html>
  <body>
    <button id="counter">Clicks: 0</button>
    <script>
      let count = 0;
      document.querySelector("#counter").addEventListener("click", (event) => {
        count += 1;
        event.currentTarget.textContent = `Clicks: ${count}`;
      });
    </script>
  </body>
</html>
```

Use a `code-editor` block to edit HTML or JavaScript locally and render it after you click **Run**.

```code-editor
<h1>Edit me</h1>
<style>h1 { color: rebeccapurple; }</style>
```

### C# / .NET

A C# block runs only when its first line is `// github-dotnet-run`. It is compiled and executed locally in a separate sandboxed iframe using the bundled .NET WebAssembly runtime. Ordinary C# blocks remain static.

```csharp
// github-dotnet-run
using System;

Console.WriteLine("Hello from .NET WebAssembly");
```

## Security and privacy

- The extension runs on GitHub repository pages and requests host access to HTTPS URLs for API widgets. Review the browser's permission prompt before installing.
- Active HTML previews allow inline scripts but block network access and external resources through a Content Security Policy. They cannot access the GitHub page or extension APIs.
- C# programs run in a separate sandbox without network access.
- The extension does not send cookies with API requests or follow redirects.
- A saved Discord webhook is stored locally in the browser. Widget content is sent only after you explicitly use the share action.
- GitHub's single-page navigation is observed so supported README blocks can be detected after in-page navigation.

## Project layout

```text
extensions/
  chromium/     Chromium extension source
  firefox/      Firefox extension source
site/           Static project information page for GitHub Pages
build.mjs       Builds both browser packages
```

Make extension changes in the relevant `extensions/` directory. The build copies the browser-specific sources, locale files, and bundled WebAssembly runtime into `dist/`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local checks and pull request guidance. Changes to extension behavior should be tested in the affected browser package.

## Documentation

Browse the [project documentation](site/docs/index.html) for installation, widget syntax, security and privacy, and troubleshooting guides. The `wiki/` directory contains the matching source pages for the official GitHub Wiki.

## License

This project is distributed under the terms in [LICENSE.txt](LICENSE.txt). Read the license before using or redistributing the project.
