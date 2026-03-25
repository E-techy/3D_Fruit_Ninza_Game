import fs from "node:fs";
import path from "node:path";

export const SOUND_ASSETS = [
  {
    file: "cut-quick-saber.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/2158/2158-preview.mp3",
  },
  {
    file: "cut-flesh-slice.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/2788/2788-preview.mp3",
  },
  {
    file: "cut-knife-hit.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/2184/2184-preview.mp3",
  },
  {
    file: "swoosh-blade-swish.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/1506/1506-preview.mp3",
  },
  {
    file: "swoosh-slash.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/1476/1476-preview.mp3",
  },
  {
    file: "swoosh-fast.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/2792/2792-preview.mp3",
  },
  {
    file: "explosion-arcade.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/2759/2759-preview.mp3",
  },
  {
    file: "explosion-hit.mp3",
    url: "https://assets.mixkit.co/active_storage/sfx/1704/1704-preview.mp3",
  },
  {
    file: "music-games.mp3",
    url: "https://assets.mixkit.co/music/706/706.mp3",
  },
  {
    file: "music-scifi.mp3",
    url: "https://assets.mixkit.co/music/395/395.mp3",
  },
];

export function loadDotEnv(envPath = path.resolve(process.cwd(), ".env")) {
  const loaded = {};
  if (!fs.existsSync(envPath)) {
    return loaded;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const delimiterIndex = trimmed.indexOf("=");
    if (delimiterIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, delimiterIndex).trim();
    let value = trimmed.slice(delimiterIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    loaded[key] = value;
  }
  return loaded;
}

export function getConfig() {
  const fileEnv = loadDotEnv();
  const env = { ...fileEnv, ...process.env };
  const parseBool = (value, fallback) => {
    if (typeof value !== "string") {
      return fallback;
    }
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
    return fallback;
  };
  const parseNumber = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  return {
    host: env.HOST || "127.0.0.1",
    port: parseNumber(env.PORT, 4173),
    assetsDir: env.ASSETS_DIR || "assets/sounds",
    forceAssetDownload: parseBool(env.FORCE_ASSET_DOWNLOAD, false),
    assetDownloadTimeoutMs: parseNumber(env.ASSET_DOWNLOAD_TIMEOUT_MS, 35000),
  };
}
