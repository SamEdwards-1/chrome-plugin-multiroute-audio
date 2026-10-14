import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const extensionFiles = [
  "manifest.json",
  "src/fonts/LICENSE",
  "src/service-worker.js",
  "src/offscreen.html",
  "src/offscreen.js"
];

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    {
      name: "extension-ui-pages",
      transformIndexHtml(html, context) {
        if (!/^\/src\/(popup|setup)\.html$/.test(context.path)) return html;
        const styled = html.replace('href="ui.css"', 'href="/src/app.css"');
        return command === "serve"
          ? styled.replace("</head>", '<script src="/dev/mock.js"></script></head>')
          : styled;
      },
      async closeBundle() {
        if (command !== "build") return;
        for (const file of extensionFiles) {
          const destination = resolve("dist", file);
          await mkdir(resolve(destination, ".."), { recursive: true });
          await copyFile(resolve(file), destination);
        }
      }
    }
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve("src/popup.html"),
        setup: resolve("src/setup.html")
      }
    }
  }
}));
