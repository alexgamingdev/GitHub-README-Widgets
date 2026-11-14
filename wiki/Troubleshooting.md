# Troubleshooting

## No widget appears

- Confirm the extension is enabled and loaded from the expected `dist/chromium` or `dist/firefox` package.
- Reload the GitHub repository page after installing or reloading the extension.
- Check that the code fence uses a supported language such as `api-status`, `api-chart`, `api-tabs`, `html-live`, or `code-editor`.
- For an API request, put the HTTP method and HTTPS URL together on a line of their own.
- Confirm the page is on `github.com`, not a third-party GitHub mirror.

## An API request fails

- Check that the URL is HTTPS and contains no embedded credentials.
- The endpoint must work without cookies or custom headers; this widget format cannot supply either.
- The extension rejects redirects and times out after 15 seconds.
- Some APIs require authentication or a request body and cannot be called by this widget format.
- Check the browser console and the widget's response for additional details.

## JSON configuration is invalid

Use valid JSON with double-quoted property names and string values. For charts, `labels` and numeric `values` must have the same number of entries.

## A live preview is blank or incomplete

External scripts, images, fonts, frames, and network requests are blocked by design. Inline HTML, CSS, and JavaScript are supported. Run the preview explicitly after making changes.

## C# / .NET does not start

- Confirm the code fence uses a supported C# language and its first line is `// github-dotnet-run`.
- Run `npm ci` and `npm run build` so the bundled runtime exists under `vendor/blazor-wasm/`.
- Reload the unpacked extension and then reload the GitHub page.

## Still stuck?

Open a [GitHub issue](https://github.com/alexgamingdev/GitHub-README-Widgets/issues/new/choose) with your browser and version, steps to reproduce, and the expected and actual behavior. Do not include webhook URLs, access tokens, or private repository content.
