# Contributing

Thank you for considering a contribution to GitHub README Widgets.

## Before you start

- Check existing issues and pull requests before opening a new one.
- For a significant change, open an issue first to discuss the approach.
- Keep changes focused and preserve the Chromium and Firefox implementations where behavior is shared.
- Do not include credentials, webhook URLs, or other private data in issues, pull requests, or test examples.

## Local development

Requirements: Node.js 20 or later and npm.

```sh
npm ci
npm run build
```

The build produces `dist/chromium` and `dist/firefox`. Load the relevant package into the browser as described in the README and test the changed behavior on a GitHub repository page.

## Pull requests

- Explain the problem and the behavior changed.
- Include steps to reproduce and verify user-facing changes.
- Update the README or project information page when behavior or setup instructions change.
- Ensure `npm run build` succeeds before requesting review.

By submitting a contribution, you agree that it is provided under the terms applicable to this project in [LICENSE.txt](LICENSE.txt).
