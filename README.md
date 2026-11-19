# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/dikrimuhammad291-ship-it/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/dikrimuhammad291-ship-it/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline web app that is the guide and tracker for all 55 PlayStation 5 trophies
of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze.

- **Tracker** — every trophy with its official name, description and grade; a
  checklist saved in the browser (localStorage) with export and import; filters
  by kind, grade and status; a search; and a spoiler-free setting that hides
  story trophies until they are earned.
- **Roadmap to the platinum** — the 55 trophies in four stages, built from the
  official descriptions, with per-stage progress.
- **Missables** — the 14 trophies that need a specific moment, setup or choice,
  flagged with what to watch for.
- **A cited guide to each trophy** — written for this entry in its own words
  from the official descriptions. Names, descriptions, grades and hidden flags
  follow the official list as published by Exophase and PSNProfiles on
  18 November 2026; where a description does not pin a place or step down, the
  guide says so. No Rockstar Games logo, artwork or game screenshot is used.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The guide is plain static files under `app/`
with no build step, and it works with the network off: it loads only its own
files and makes no network request at run time.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## Layout

- `app/index.html` — the shell: header and progress, tabs, filters, checklist
  and guide detail pane.
- `app/style.css` — the look: one dark Vice City night theme, system fonts only.
- `app/js/main.js` — boot, state and view switching.
- `app/js/store.js` — saved progress (localStorage), export and import.
- `app/js/filters.js` — kind/grade/status/search filtering and the spoiler rule.
- `app/js/views.js` — the checklist, guide detail, roadmap and missables views.
- `app/data/trophies.json` — the official 55 trophies, each with its guide,
  sources, kind, missable flag, PSN count and roadmap stage.
- `screenshots/` — 3–4 real browser renders of the guide (see `shots.json`).

## License

MIT — see `LICENSE`.
