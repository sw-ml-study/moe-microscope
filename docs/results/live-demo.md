# Live demo verification

The live demo is <https://sw-ml-study.github.io/moe-microscope/>: the pinned
recordings stepped frame by frame in the browser (`learn/`, static
JavaScript over fetched JSON, published by `.github/workflows/pages.yml`
from `scripts/build-site`). This page records what was verified against the
published site after each deploy, so nobody has to take the README's word
for it.

## 2026-09-14, first publication

| Check | Result |
|---|---|
| Deploy | Pages workflow run for commit `ff20545` completed successfully |
| URL | `https://sw-ml-study.github.io/moe-microscope/` returns HTTP 200 |
| Build info in the footer | `runnervmlun5p / ff20545 / 2026-09-14T00:22:58Z` (drawn with separator dots on the page) (host, short SHA, UTC timestamp written by the workflow) |
| Footer links | campus, blog (the about page at first deploy; the post URL from the second), Discord, GitHub repository, wiki (from the second deploy); license and copyright present |
| `?verify=1` on the live page (headless Chrome, 2026-09-14T00:24:54Z) | title `verified: ok` |
| DN01 dense baseline | 13 frames stepped, 29 observations rendered, last step 300 |
| MX01 top-1 mixture | 13 frames stepped, 65 observations rendered, last step 300 |
| MX02 top-2 mixture | 13 frames stepped, 66 observations rendered, last step 300 |
| Routing and dispatch walkthrough | 10 frames stepped, 20 observations rendered, last step 9 |
| Console errors during verify | none reported by the page (any load or render error is listed in the report as ERROR) |

## 2026-09-15, recurrence and Engram lessons

| Check | Result |
|---|---|
| Deploy | Pages workflow run for commit `3eaa4ec` completed successfully (32 s) |
| Build info | `runnervmlun5p / 3eaa4ec / 2026-09-15T21:10:06Z` from `build-info.json` on the live site |
| `?verify=1` on the live page (headless Chrome, 2026-09-15) | every lesson stepped to its last frame, no errors |
| DN01, MX01, MX02 | 13 frames each; 29, 65, and 66 observations rendered, last step 300 |
| RC01 recurrent block | 13 frames stepped, 36 observations rendered, last step 300 |
| RM01 recurrent mixture | 13 frames stepped, 36 observations rendered, last step 300 |
| EG01 Engram from scratch | 13 frames stepped, 57 observations rendered, last step 300 |
| RE01 recurrent mixture plus Engram | 13 frames stepped, 36 observations rendered, last step 300 |
| Routing and dispatch walkthrough | 10 frames stepped, 20 observations rendered, last step 9 |
| New lesson captions and labels | recurrence strip (`rm/route/example`, `re/route/example`), the Engram rows, gate, and retrieved values of one window (`engram/rows/example`, `engram/gate/example`, `engram/retrieved/example`), the per-recurrence Engram gate (`re/gate/example`), all drawn from recorded values only |

What the page does and does not do: it is a playback. No sw-MLPL code runs
in the browser and no model runs in the page. Every number it draws is read
from a fixture in the repository: the seven training recordings were
written by `emit_frame` during real training runs and captured over
`mlpl-serve`; the walkthrough fixture was written by
`demos/walkthrough_export.mlpl` after training the mixture for 40 epochs.
The page lays the values out and computes nothing. The trained docent and in-browser
inference are later steps of the campus docent saga and will be recorded
here when they are live.

How to repeat the check: open the URL with `?verify=1`; the page steps
every lesson to its last frame and prints the report in the right panel.
Locally, `just serve-learn` composes and serves the same site.
