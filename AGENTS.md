# Agent Instructions

This repository is a static browser game published with GitHub Pages:

https://gregconradismith.github.io/voltage-clamp-game/

It is a MATLAB-free version of `voltageclampgame.m`. Preserve the model
relationship and teaching goal: players infer the reversal potential from
voltage-clamp current traces.

Core model details:

- Holding potential is `-100 mV`.
- Test commands are `-80, -60, -40, -20, 0, 20, 40 mV`.
- Activation relaxes toward `m_inf(V) = 0.5 * (1 + tanh((V - V0) / V1))`.
- Current is `I_mem = m(V, t)(V - Erev)`.
- The sampled I-V relation is built from clamp traces and crosses zero at
  `Erev`.

Important files:

- `index.html` is the static app shell.
- `styles.css` contains responsive styling.
- `app.js` contains clamp simulation, scoring, plotting, and reveal logic.
- `voltageclampgame.m` is the original MATLAB reference.
- `.github/workflows/pages.yml` deploys the repository root to GitHub Pages on
  pushes to `main`.

Keep the app dependency-free unless Greg explicitly asks otherwise. Use relative
paths so the app works from the project Pages URL.

For JavaScript changes, run:

```bash
node --check app.js
git diff --check
```

For UI, layout, plotting, or interaction changes, preview locally:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/` and verify the canvas is nonblank, voltage
and current traces render correctly, answer buttons work, reveal state is clear,
and the layout behaves at desktop and mobile widths.

Do not commit local noise such as `.DS_Store`, editor files, or generated
temporary artifacts.

## Codex Coordination

At the start of work, read `.codex/handoff.md` and any other Markdown files in
`.codex/` that are relevant to the task. Before ending a session that made
meaningful progress, update `.codex/handoff.md` with the current state, changes,
verification, remaining work, and blockers. Record durable decisions in
`.codex/decisions.md` and concise activity history in `.codex/task-log.md` when
those files are useful.
