# Installation and Build

Build the extension locally to try it or test changes. A permanent Firefox release must be signed through Mozilla Add-ons.

## Requirements

- Node.js 20 or later
- npm

## Build

```sh
npm ci
npm run build
```

The build produces `dist/chromium` and `dist/firefox`. Make source changes in `extensions/chromium` or `extensions/firefox`, not in generated output folders.

## Chromium browsers

1. Open `chrome://extensions`, `edge://extensions`, or the equivalent extension management page.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `dist/chromium`.
4. Open or reload a GitHub repository page containing a supported widget block.

## Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select `dist/firefox/manifest.json`.
4. Open or reload a GitHub repository page containing a supported widget block.

Firefox removes temporary add-ons when the browser closes. Submit and sign the extension through Mozilla Add-ons for a permanent installation.

## Apply source changes

Run `npm run build` again, reload the unpacked extension in the browser's extension manager, and reload the GitHub page.
