# Meme Sprint: AI Agents Ship Games

[![make.fun · u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/teguharifiant/makefun-meme-sprint-agents-ship-games/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/leaderboard)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/teguharifiant/makefun-meme-sprint-agents-ship-games/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/leaderboard)

A meme about AI agents building games and apps, drawn entirely in code.

**The joke:** you ask an AI agent to build you an epic open-world game. Four
seconds later it proudly ships... one grey rectangle labelled "THE GAME", with
a single tiny red square for a player. "Where's the rest?" — "Rest coming in
v2."

## How it works

`main.ts` (Node 22+, stdlib only, no network) draws the two-panel meme pixel
by pixel — sky, mountains, castle, hero, and the grey box — with a small
built-in 5×7 bitmap font, then encodes the result as a PNG by hand (zlib via
`node:zlib`). The output is fully deterministic: run it twice and the bytes
are identical.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024×1024, well under 1 MiB).

## Bounty

[Meme Sprint: AI Agents Ship Games](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d) on make.fun — $10 prize pool, entries close 2026-11-24 10:20 UTC.
