import fs from "node:fs/promises";
import path from "node:path";
import { getConfig, SOUND_ASSETS } from "./config.mjs";

const config = getConfig();
const outputDir = path.resolve(process.cwd(), config.assetsDir);

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function fileExistsWithContent(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() && stats.size > 0;
  } catch (_error) {
    return false;
  }
}

async function downloadFile(url, destination, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    const temp = `${destination}.tmp`;
    await fs.writeFile(temp, data);
    await fs.rename(temp, destination);
  } finally {
    clearTimeout(timeout);
  }
}

async function run() {
  await ensureDir();

  let downloaded = 0;
  let skipped = 0;
  const failures = [];

  for (const asset of SOUND_ASSETS) {
    const destination = path.join(outputDir, asset.file);
    const exists = await fileExistsWithContent(destination);
    if (exists && !config.forceAssetDownload) {
      skipped += 1;
      console.log(`[skip] ${asset.file}`);
      continue;
    }

    try {
      console.log(`[download] ${asset.file}`);
      await downloadFile(asset.url, destination, config.assetDownloadTimeoutMs);
      downloaded += 1;
    } catch (error) {
      failures.push({ file: asset.file, message: error instanceof Error ? error.message : String(error) });
    }
  }

  console.log(`\nAsset download summary: downloaded=${downloaded}, skipped=${skipped}, failed=${failures.length}`);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Asset download failed:", error);
  process.exitCode = 1;
});
