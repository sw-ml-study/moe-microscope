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
| Build info in the footer | `runnervmlun5p · ff20545 · 2026-09-14T00:22:58Z` (host, short SHA, UTC timestamp written by the workflow) |
| Footer links | campus, blog (the about page until the post exists), Discord, GitHub repository; license and copyright present |
| `?verify=1` on the live page (headless Chrome, 2026-09-14T00:24:54Z) | title `verified: ok` |
| DN01 dense baseline | 13 frames stepped, 29 observations rendered, last step 300 |
| MX01 top-1 mixture | 13 frames stepped, 65 observations rendered, last step 300 |
| MX02 top-2 mixture | 13 frames stepped, 66 observations rendered, last step 300 |
| Routing and dispatch walkthrough | 10 frames stepped, 20 observations rendered, last step 9 |
| Console errors during verify | none reported by the page (any load or render error is listed in the report as ERROR) |

What the page does and does not do: every number it draws is read from a
recording that a real training run wrote (the three pinned runs, and the
walkthrough fixture written by `demos/walkthrough_export.mlpl` from a model
trained 40 epochs). Nothing is computed or simulated in the browser; there
is no model running in the page. The trained docent and in-browser
inference are later steps of the campus docent saga and will be recorded
here when they are live.

How to repeat the check: open the URL with `?verify=1`; the page steps
every lesson to its last frame and prints the report in the right panel.
Locally, `just serve-learn` composes and serves the same site.
