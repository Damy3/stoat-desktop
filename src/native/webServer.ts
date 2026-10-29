import fs from "node:fs";
import http from "node:http";
import path from "node:path";

let server: http.Server | null = null;

export async function startBundledWebServer(): Promise<string | null> {
  console.log("[webServer] startBundledWebServer called");
  const candidates = [
    path.join(process.resourcesPath, "dist"),
    path.resolve(__dirname, "..", "..", "..", "for-web", "packages", "client", "dist"),
  ];

  const dir = candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "index.html")),
  );

  console.log("[webServer] candidates:", candidates);
  console.log("[webServer] selected dir:", dir);

  if (!dir) return null;

  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      let filePath = path.join(dir, urlPath);

      if (
        !fs.existsSync(filePath) ||
        (fs.statSync(filePath).isDirectory() && !fs.existsSync(path.join(filePath, "index.html")))
      ) {
        filePath = path.join(dir, "index.html");
      } else if (fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".ogg": "audio/ogg",
        ".mp3": "audio/mpeg",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".map": "application/json; charset=utf-8",
      };

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        res.setHeader("Content-Type", mimeTypes[ext] ?? "application/octet-stream");
        res.end(data);
      });
    });

    server.listen(47832, "127.0.0.1", () => {
      const address = server?.address();
      const port =
        typeof address === "object" && address ? address.port : 0;
      console.log("[webServer] serving on port", port, "address", address);
      resolve(`http://127.0.0.1:${port}/`);
    });

    server.on("error", reject);
  });
}

export function stopBundledWebServer() {
  server?.close();
  server = null;
}