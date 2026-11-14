# Security and Privacy

Review browser permission prompts and only run code or make requests to endpoints you trust. Widgets are executable content, not static documentation.

## Browser permissions

The extension runs its content script on `https://github.com/*` and requests host access to HTTPS URLs so API widgets can make requests. Browser vendors may present this as broad website access. API requests are made only when a widget is explicitly run.

## API requests

- Only HTTPS URLs without embedded username or password are accepted.
- Requests send no cookies, custom headers, or request body.
- Redirects are rejected and requests time out after 15 seconds.
- API response output is truncated at 100,000 characters.

## Live HTML and JavaScript previews

Previews run in an iframe with sandboxed scripts and a restrictive Content Security Policy. Network connections, external frames, forms, and external resources are blocked. The preview cannot access the GitHub page DOM or extension APIs and starts only after an explicit user action.

## C# / .NET

Marked C# runs in a separate sandboxed iframe using the compiler and .NET WebAssembly runtime bundled with the extension. It does not have network access; only the extension package's runtime resources are allowed.

## Discord webhook

A saved webhook URL is kept in local browser extension storage. Widget code and the latest result are sent only when you explicitly choose the share action. Treat webhook URLs as secrets; anyone who has one may be able to post to its channel.

## Report a vulnerability

Do not post exploit details, private URLs, or credentials in a public issue. Follow the repository's [security policy](https://github.com/alexgamingdev/GitHub-README-Widgets/blob/main/SECURITY.md).
