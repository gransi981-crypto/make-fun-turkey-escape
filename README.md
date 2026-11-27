# Gobble Dash — The Great Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/gransi981-crypto/make-fun-turkey-escape/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/gransi981-crypto/make-fun-turkey-escape/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A turkey escape game for the [make.fun bounty "Make the best turkey escape game"](https://make.fun/bounty/turkey-run-game-01).

Thanksgiving morning. The farmer is coming, the oven is hot, and the woods are 2,800 metres away. Run, jump the fences, slide under the carving knives, grab the corn — and don't become dinner.

## Play

Open `game/index.html` in a desktop browser (or run `node serve.ts 8080` and visit http://localhost:8080). No network needed; everything is local.

- **SPACE / CLICK** — jump (again mid-air to flap)
- **DOWN** — slide under hanging knives
- **SHIFT / RIGHT** — dash away from the farmer
- **M** — mute, **R** — restart

Four stages: the farmyard, the barn, the kitchen, then the woods. The farmer closes in whenever you dawdle or stumble — keep running.

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`. Screenshots are real renders of the game's own code, staged with `?shot=title|play|kitchen|escape`.

Built as an entry for make.fun — see the bounty page above.
