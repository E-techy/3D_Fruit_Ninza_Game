# 3D_Fruit_Ninza_Game

3D Fruit Ninja-style browser game with:
- 3D fruits + bomb fruits
- Combo scoring and popup effects
- Timed level goals
- Cool menu UI + pause/settings
- Knife trail, slash VFX, SFX, and background music

Suggested GitHub repo:
- [github.com/E-techy/3D_Fruit_Ninza_Game](https://github.com/E-techy/3D_Fruit_Ninza_Game)

## Tech Stack

- HTML + CSS + JavaScript
- Three.js (CDN import)
- Node.js scripts for local server and asset download

## Project Structure

- [index.html](./index.html)
- [style.css](./style.css)
- [game.js](./game.js)
- [package.json](./package.json)
- `scripts/`
- [SOUNDS.md](./SOUNDS.md)

## Standardized Setup

1. Open terminal in project folder:

```bash
cd 3D_Fruit_Ninza_Game
```

2. Create local environment file:

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Download audio assets.

macOS/Linux:

```bash
npm run assets:download:mac
```

Windows PowerShell:

```powershell
npm run assets:download:win
```

Cross-platform direct command:

```bash
npm run assets:download
```

4. Start the game:

```bash
npm start
```

Open in browser:

```text
http://127.0.0.1:4173
```

## Important Behavior

- `npm start` automatically runs asset download first via `prestart`.
- Downloaded sound files are ignored by Git (not committed).
- Runtime config is loaded from `.env`.

## Environment Variables

Defined in [`.env.example`](./.env.example):

- `HOST` (default `127.0.0.1`)
- `PORT` (default `4173`)
- `ASSETS_DIR` (default `assets/sounds`)
- `FORCE_ASSET_DOWNLOAD` (`true`/`false`)
- `ASSET_DOWNLOAD_TIMEOUT_MS` (default `35000`)

## Git / GitHub Steps (When You Are Ready)

```bash
cd 3D_Fruit_Ninza_Game
git init
git add .
git commit -m "Initial commit: 3D_Fruit_Ninza_Game"
```

Later, when you add your remote:

```bash
git branch -M main
git remote add origin https://github.com/E-techy/3D_Fruit_Ninza_Game.git
git push -u origin main
```

## Notes

- `.gitignore` excludes local env, logs, IDE files, and downloaded assets.
- Sound source attribution is documented in [SOUNDS.md](./SOUNDS.md).
