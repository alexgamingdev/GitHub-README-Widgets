import { cp, mkdir, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "index.html",
  "options.js",
  "brand-mark.svg",
  "icon16.png",
  "icon32.png",
  "icon48.png",
  "icon128.png",
  "LICENSE.txt"
];
const packages = [
  {
    directory: "chromium",
    sourceDirectory: "extensions/chromium"
  },
  {
    directory: "firefox",
    sourceDirectory: "extensions/firefox"
  }
];

for (const extensionPackage of packages) {
  const outputDirectory = path.join(root, "dist", extensionPackage.directory);
  const sourceDirectory = path.join(root, extensionPackage.sourceDirectory);

  await mkdir(outputDirectory, { recursive: true });
  await unlink(path.join(outputDirectory, "options.html")).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  for (const file of packageFiles) {
    await cp(path.join(sourceDirectory, file), path.join(outputDirectory, file));
  }
  await cp(
    path.join(sourceDirectory, "_locales"),
    path.join(outputDirectory, "_locales"),
    { recursive: true }
  );
  await cp(
    path.join(root, "node_modules", "@live-codes", "blazor-wasm"),
    path.join(outputDirectory, "vendor", "blazor-wasm"),
    { recursive: true }
  );
  console.log(
    `Built ${extensionPackage.directory} package from ${extensionPackage.sourceDirectory}`
  );
}
