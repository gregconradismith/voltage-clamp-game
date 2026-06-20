# The Voltage-Clamp Game

A MATLAB-free browser version of `voltageclampgame.m`. The game shows voltage
step currents and asks for the reversal potential. After each answer it reveals
the sampled I-V relation, activation curve, driving force, and current-voltage
curve.

## GitHub Pages

Live app:

```text
https://gregconradismith.github.io/voltage-clamp-game/
```

Publish this folder as the root of a GitHub Pages repository. The app uses
relative paths, so it can also run from a project Pages URL.

## Local Preview

From this directory:

```sh
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Codex Coordination

Codex session state is tracked in `.codex/handoff.md`; durable decisions and task history may also appear in `.codex/` when useful.
