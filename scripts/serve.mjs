import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { getConfig } from "./config.mjs";

const config = getConfig();
const root = process.cwd();
const indexPath = path.join(root, "index.html");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
};

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

function safePathFromUrl(rawUrl) {
  const urlPath = decodeURIComponent(rawUrl.split("?")[0]);
  const normalized = urlPath === "/" ? "/index.html" : urlPath;
  const candidate = path.resolve(root, `.${normalized}`);
  if (!candidate.startsWith(root)) {
    return null;
  }
  return candidate;
}

async function serveFile(res, absolutePath) {
  const ext = path.extname(absolutePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const content = await fs.readFile(absolutePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendError(res, 400, "Bad Request");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  const candidate = safePathFromUrl(req.url);
  if (!candidate) {
    sendError(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(candidate);
    if (stat.isDirectory()) {
      await serveFile(res, indexPath);
      return;
    }
    await serveFile(res, candidate);
  } catch (_error) {
    if (path.extname(candidate)) {
      sendError(res, 404, "Not Found");
      return;
    }
    try {
      await serveFile(res, indexPath);
    } catch (indexError) {
      sendError(res, 500, `Failed to serve index.html: ${String(indexError)}`);
    }
  }
});

server.listen(config.port, config.host, () => {
  console.log(`3D_Fruit_Ninza_Game running on http://${config.host}:${config.port}`);
});
