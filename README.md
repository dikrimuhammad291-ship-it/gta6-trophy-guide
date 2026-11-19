# Vice Atlas — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/dikrimuhammad291-ship-it/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/dikrimuhammad291-ship-it/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

Entry for [Build the best GTA 6 trophy guide](https://make.fun/c/gta6-trophy-guide-01) on make.fun: an offline web app that guides and tracks all 55 Grand Theft Auto VI PlayStation 5 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze.

## What it does

- **Tracker** over every official trophy with its name, description and grade: a checklist saved in the browser (localStorage), with export to a file and import back.
- **Filters** by kind (story, mission, side strand, collectible, activity, combat, misc, platinum), grade and status, plus search.
- **Spoiler-free setting** that hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the platinum** in four stages with per-stage progress, and **14 missable trophies flagged** with what to watch for.
- **A guide to each trophy in our own words**, built from the official descriptions, with its sources named beside it (Exophase for the official list, PSNProfiles for grades and PSN counts, and our own advice where the description leaves the how-to open).

No Rockstar logo or official artwork. Fully offline: static files, no build step, no network request at run time.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Screenshots

```sh
node shots.mjs
```

Takes the 4 screenshots in `screenshots/` with headless Chromium (Playwright), and smoke-checks the guide: 55 rows render, the checklist persists across a reload, the filters and spoiler setting work, and export/import round-trip.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `buildDossier` library.
