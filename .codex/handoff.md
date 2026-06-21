# The Voltage-Clamp Game Codex Handoff

Date: 2026-06-21

## Repository

Local folder:

```text
/Users/gregconradismith/Git/voltage-clamp-game
```

Expected GitHub Pages URL:

```text
https://gregconradismith.github.io/voltage-clamp-game/
```

## What The App Is

This is a static HTML version of `voltageclampgame.m`. It preserves the
original setup: a holding potential of `-100 mV`, step commands from `-80` to
`40 mV`, first-order activation toward `m_inf(V)`, and current
`I_mem = m(V, t)(V - Erev)`.

The player estimates the reversal potential from the current traces. After
answering, the app reveals the voltage command, current traces, sampled I-V
points, activation curve, driving force, and underlying I-V curve.

## Important Files

- `index.html`: browser game shell.
- `styles.css`: responsive app styling.
- `app.js`: clamp simulation, scoring, plotting, and reveal logic.
- `voltageclampgame.m`: original MATLAB reference.
- `README.md`: user-facing notes and the Pages URL.
- `.gitignore`: ignores `.DS_Store`.

## Validation

Useful checks after editing:

```sh
node --check app.js
git diff --check
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Migration Readiness Snapshot

- Checked on 2026-06-21 before moving computers.
- Non-interactive `git fetch --all --prune` completed successfully.
- Root `README.md` points to `.codex/handoff.md` when a root README exists.

Pre-edit Git state after fetch:

```bash
## main...origin/main
```
