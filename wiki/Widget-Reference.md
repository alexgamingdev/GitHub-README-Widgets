# Widget Reference

Widgets are detected from a supported fenced-code language or from an API request line. They appear only when the extension is active on a GitHub repository page.

## API request

Put a supported HTTP method and an HTTPS URL on a line of its own. Supported methods: `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`.

````markdown
```http
GET https://api.github.com
```
````

Requests do not include custom headers or a request body. They do not send cookies or follow redirects.

## API status

Provide a JSON object with a required `url` and optional `method`, `label`, and `statusPath`. The default status path is `status`.

````markdown
```api-status
{"url":"https://api.github.com","label":"GitHub API","statusPath":"status"}
```
````

Values such as `operational`, `ok`, and `up` are recognized as healthy. Values such as `down`, `error`, and `degraded` are recognized as unhealthy.

## API chart

Provide equal-length `labels` and numeric `values` arrays. `title` is optional. Add a `url` and optional `method` to reload data when the widget is run.

````markdown
```api-chart
{"title":"Weekly signups","labels":["Mon","Tue","Wed"],"values":[12,18,15]}
```
````

## Markdown tabs

Each level-two heading (`##`) starts a tab. Contents are rendered as text, not HTML.

````markdown
```api-tabs
## JavaScript
JavaScript example

## TypeScript
TypeScript example
```
````

## Live HTML preview

Use an `html-live` fenced block or include the `<!-- github-live-preview -->` marker in a code block. The preview starts only after an explicit user action.

````markdown
```html-live
<button id="hello">Click me</button>
<script>
  document.querySelector("#hello").addEventListener("click", (event) => {
    event.currentTarget.textContent = "Hello!";
  });
</script>
```
````

## Code editor

Use a `code-editor` fenced block for editable HTML or JavaScript. Changes run only after the user chooses **Run**.

````markdown
```code-editor
<h1>Edit me</h1>
<style>h1 { color: rebeccapurple; }</style>
```
````

## C# / .NET

Use a C# block with `// github-dotnet-run` on its first line. Supported fence names include `csharp`, `cs`, `dotnet-run`, `csharp-run`, and `cs-run`. Ordinary C# blocks remain static.

````markdown
```csharp
// github-dotnet-run
using System;

Console.WriteLine("Hello from .NET WebAssembly");
```
````

Code blocks for previews and .NET are limited to 100,000 characters. API output is truncated at 100,000 characters and requests time out after 15 seconds.
