# GitHub README Widgets

GitHub README Widgets is a Manifest V3 browser extension that turns supported code blocks in GitHub repository READMEs into interactive API, chart, tab, and sandboxed code widgets.

The extension supports Chromium-based browsers and Firefox. Widgets run in your browser when you view a repository; GitHub itself does not execute them or show the interactive experience to visitors without the extension.

## What you can do

- Run HTTPS API requests and render API status or chart data.
- Organize Markdown examples into tabs.
- Preview HTML, CSS, and JavaScript in an isolated iframe.
- Edit and run HTML or JavaScript locally.
- Compile and run explicitly marked C# with the bundled .NET WebAssembly runtime.
- Optionally share widget content to a locally configured Discord webhook after an explicit action.

## Get started

1. Install Node.js 20 or later and npm.
2. Clone the project and run `npm ci`.
3. Run `npm run build`.
4. Load `dist/chromium` as an unpacked Chromium extension, or load `dist/firefox/manifest.json` as a temporary Firefox add-on.
5. Open or reload a GitHub repository page containing a supported code block.

See [[Installation]] for detailed steps, [[Widget-Reference]] for syntax and examples, and [[Security-and-Privacy]] for permissions and isolation details.

## Links

- [Project repository](https://github.com/alexgamingdev/GitHub-README-Widgets)
- [Project documentation site](https://alexgamingdev.github.io/GitHub-README-Widgets/docs/)
- [Security policy](https://github.com/alexgamingdev/GitHub-README-Widgets/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/alexgamingdev/GitHub-README-Widgets/blob/main/CONTRIBUTING.md)
