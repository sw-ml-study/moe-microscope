# moe-microscope

Building mixture-of-experts models small enough to understand.

MicroMoE is an educational and experimental mixture-of-experts model
written in [sw-MLPL](https://github.com/sw-ml-study/sw-mlpl). The repository isolates the techniques behind modern
efficient MoE systems (routing, sparse dispatch, low-rank experts,
recurrence, Engram memory, distillation, quantization, expert caching,
heterogeneous execution) so each can be inspected and measured on its own,
at a scale where every tensor, expert, routing decision, and byte can be
printed. It is progressively constructing a tiny model inspired by
FreeToken, HRM/TRM, DeepSeek's Engram, and sparse routing; it does not
claim that the combined architecture is validated yet.

Large MoE systems make it hard to see what each mechanism buys. Here the
whole model is tens of thousands of parameters, every lesson is a readable
MLPL program that records its own intermediate values, every diagram is
drawn from values a test asserts, and every claim in this page cites a
results row or a measured document.

- [Documentation landing page](docs/README.md) (three reader journeys)
- [Architecture](docs/overview/architecture.md) and [delivery plan](docs/overview/plan.md)
- [Results dashboard](docs/results/README.md) and the [full results table](docs/reference/results.md)

## Live demo

The moving parts step by step, live on GitHub Pages:
<https://sw-ml-study.github.io/moe-microscope/>. Pick a lesson (the dense
baseline, the top-1 and top-2 mixtures, the recurrent block, the
recurrent mixture, the Engram table, the three sparsities together, or
one window through routing and dispatch) and step through its frames.

The panned animation, follow the data across the landscape:
<https://sw-ml-study.github.io/moe-microscope/landscape.html>. One wide
scene panned station by station in the order a forward pass happens
(tokens, attention, the Engram lookup, the router, the experts, the
recurrence loop, the composition, the head); chips move between stations
and every value on a chip is read from the same pinned recordings. Both
pages are playbacks: no sw-MLPL code runs in the browser, and every number
is read from a pinned fixture that a real training run or its export
script wrote. To produce those fixtures
yourself, run the training at the command line: `just dense write`,
`just moe write`, `just moe2 write`, `just recur write`, `just rm write`,
`just engram write`, `just re write`, `just recordings write`, and
`just walkthrough write` (see Build and run below); `just serve-learn`
then serves the same page locally. The blog post about this work:
<https://blog.softwarewrighter.com/2026/09/13/saw-building-a-tiny-mixture-of-experts/>.
The [wiki](https://github.com/sw-ml-study/moe-microscope/wiki) mirrors the
documentation as a navigation layer.

## Status

Demonstrated, with measurements: a dense baseline (DN01); top-1 and top-2
mixtures (MX01, MX02); measurable expert specialization; exact sparse
dispatch (SD01); the data-versus-epochs effect (DS01); low-rank delta
experts with a shared expert (LD01); an in-repo teacher fixture (TE01); the
resource budget (RB01) and a measured generation benchmark (GB01);
recurrence (RC01, RM01); the Engram table from scratch with exact parity
against the sw-MLPL builtin (EG01); all three sparsities together and the
seven-row ablation matrix (RE01); a state-space block in place of
attention with a constant 256-byte sequence state (SS01) and its selective
form (SS02); the docent without its feed-forward layer, sw-atlas's no-FFN
check (SAN01); nine recordings
replayed in the live demo and handed to the generic Rust/Yew host; the
campus docent's first five steps (paused: it does not yet beat a
deterministic matcher).

Still to come, in order: the selective (Mamba-style) state-space block
and the attention, state-space, and MoE hybrid with latent experts, a
literate org-mode reading of the lessons, distillation, the state-memory-experts
composition, multi-token prediction, the routed docent, quantization and
the packed file with the expert cache, CPU/NPU scheduling and the 256 MB
target, the interactive host, the configuration frontier, the CUDA move
with host-resident experts, and the findings report. See the [saga queue](docs/overview/sagas.md).

## What we have learned

Every experiment is also graded and ranked against what it was expected
to show in the [report card](docs/results/report-card.md).

1. **Sparse capacity is real.** The four-expert mixture stores 7,096
   parameters and touches 3,064 per token; the dense model stores 3,812 and
   touches 2,996. Stored capacity grew 1.86 times for 1.02 times the active
   parameters, at the same validation loss (3.76 against 3.79).
   Evidence: MX01 and DN01 rows in the [results table](docs/reference/results.md).
2. **Experts specialize, without being told the task.** Under top-1
   routing the specialization score is 0.61 against a 0.25 family-blind
   baseline: prose leans on one expert, arithmetic on another. The router
   never saw a family tag. Scope: the four synthetic families are
   deliberately separable. Evidence: [MX02](docs/experiments/MX02.md).
3. **Top-k is a cost and quality knob, not a free improvement.** Top-2
   doubles expert evaluations per token, fits the training rows better
   (0.86 against 0.62 exact match), gives the first held-out MLPL answers,
   and has a worse validation loss (3.92) and a flatter specialization map
   (0.42). Evidence: MX02 row.
4. **Data moves the held-out columns; epochs do not.** From 120 to 960
   examples, dense validation loss falls 3.48 to 1.11 and the mixture 3.49
   to 1.22; prose becomes a solved family held-out. Doubling epochs at 120
   examples makes both worse. The mixture beats dense at 480 examples and
   loses at 960 at twice the cost. Evidence: [DS01](docs/experiments/DS01.md).
5. **Sparse compute is not automatically faster.** Sparse dispatch cuts
   expert row evaluations from 13,440 to 3,360 with outputs that agree
   exactly, and is slower in this interpreter (0.74 against 0.42 ms per
   window) because gather, scatter, and loop overhead exceed the three tiny
   matmuls skipped. Evidence: [SD01](docs/experiments/SD01.md) and the
   [generation benchmark](docs/reference/generation-benchmark.md).

6. **Cheap experts are worth trying, with a shared expert.** Sixteen
   rank-4 delta experts cost 2,048 parameters against 4,288 for four full
   experts and give validation loss 3.46 with a shared always-on expert
   (the best non-recurrent row) and 3.79 without (the dense baseline's).
   Evidence: [LD01](docs/experiments/LD01.md).
7. **Reusing a block buys quality per parameter, and the router
   re-decides.** The mixture block applied three times with deep
   supervision reaches validation loss 3.42 at the same 7,096 parameters
   (MX01 3.76), and 38 to 46 percent of tokens change expert between
   recurrences. It is not a converging reasoning loop: the models score
   best when stopped early, and R=2 is worse than R=1. Evidence:
   [RC01](docs/experiments/RC01.md), [RM01](docs/experiments/RM01.md).
8. **External memory is memorization capacity at this data size.** The
   Engram table, written from scratch and equal to the sw-MLPL builtin to
   the bit in outputs and gradients, lowers training loss and raises
   validation loss at every table size (3.93 to 4.67 against 3.79);
   composed with routing and recurrence it reaches training loss 0.006
   and the worst held-out row of the ablation (4.76). Evidence:
   [EG01](docs/experiments/EG01.md), [RE01](docs/experiments/RE01.md).
9. **A trained docent does not yet beat keyword matching.** On held-out
   paraphrases the deterministic matcher scores 0.685 and the best docent
   0.407, so the docent stays out of the campus site until it earns its
   place. Evidence: [CD01b](docs/experiments/CD01b.md).

10. **A fixed-size state replaces the key-value cache exactly, and here
   it memorizes more and generalizes less than attention.** DN01 with its
   attention block swapped for a diagonal scan of matched size keeps 256
   bytes of sequence state at any history where attention keeps 262,144
   bytes at 1,024 tokens; it reaches training exact match 0.99 (DN01
   0.70) and validation loss 4.56 (DN01 3.79), and the sequential scan is
   two to eight times slower per token in the interpreter. Evidence:
   [SS01](docs/experiments/SS01.md).
11. **Letting the token choose what to forget is worth a little.** The
   selective block reaches validation loss 4.42 against the fixed decay's
   4.56 at a matched mixer budget and half the state bytes; widened to the
   same state width it costs twice the mixer parameters and reaches 5.63,
   the worst of the four sequence mixers. Evidence:
   [SS02](docs/experiments/SS02.md).
12. **The docent loses nothing without its feed-forward layer.** With the
   hidden layer removed at matched budget, both docents match or beat
   their dense twins on every held-out column (intent 0.946 against
   0.938, destination 0.934 against 0.925, paraphrases 0.389 against
   0.296), the check sw-atlas asked for before betting on a no-FFN
   architecture. Evidence: [SAN01](docs/experiments/SAN01.md).
![MX02 specialization map: family-by-expert share heatmaps for top-1 and top-2 routing with their specialization scores](assets/previews/moe2-specialization.svg)

## How small is MicroMoE?

Every number is labeled measured, derived, or estimate in
[resource economics](docs/results/resource-economics.md); the calculator
behind it is pinned to the lessons' measured parameter counts.

| Model | Params | Active per token | f64 weights | Active f64 per token |
|---|---:|---:|---:|---:|
| DN01 dense | 3,812 | 2,996 | 29.8 KiB | 23.4 KiB |
| MX01 top-1 of 4 | 7,096 | 3,064 | 55.4 KiB | 23.9 KiB |
| MX02 top-2 of 4 | 7,096 | 4,136 | 55.4 KiB | 32.3 KiB |
| LD01 shared + 16 deltas | 6,132 | 3,396 | 47.9 KiB | 26.5 KiB |
| RM01 recurrent MoE R=3 | 7,096 | 7,392 | 55.4 KiB | 57.8 KiB |
| EG01 dense + Engram 256 | 8,708 | 3,812 | 68.0 KiB | 29.8 KiB |
| RE01 recurrent MoE + Engram | 11,992 | 9,840 | 93.7 KiB | 76.9 KiB |

One full expert is 1,072 parameters: 8,576 bytes at f64 and 536 bytes of
INT4 payload; a rank-4 delta expert is 128 parameters. Generation runs at
roughly 6,000 tokens per second dense, 3,200 top-1, 2,000 top-2, and 3,100
packed deltas in the interpreter on one laptop, with p95 token latency
under 0.6 ms in every case ([benchmark](docs/reference/generation-benchmark.md)).

![RB01 storage: proportional bars of stored weights by component and the bytes one token touches under top-1 and top-2](assets/previews/budget-storage.svg)

## Architecture progression

Dense model, then routed experts, then top-k, then true sparse dispatch,
then recurrence, then Engram memory, then quantization, then a bounded
expert cache, then heterogeneous execution. Four independent sparsities
organize it: parameter sharing (recurrence), conditional compute (MoE),
conditional memory (Engram), and residency (cache); the state-space block
(sequence state), quantization (precision), and multi-token prediction
(time) extend the taxonomy to seven resource allocation axes. The
[architecture page](docs/overview/architecture.md) has the full picture;
the [concept pages](docs/concepts/README.md) walk it one mechanism at a
time.

## Experiments

Each experiment introduces one mechanism and answers one question:
[experiment index](docs/experiments/README.md). The machine-readable
inventory is [`catalog/lessons.toml`](catalog/lessons.toml).

## Next

Recurrence is measured (RC01: one block applied several times with deep
supervision; RM01: routing over reasoning time, with the lowest
120-example validation loss so far at R=3), and so is the Engram lookup
table from scratch (EG01: exact parity with the sw-MLPL builtin; at 90
training windows the table adds memorization, not generalization), and
the three sparsities together (RE01: the seven-row ablation matrix, in
which the composed model memorizes best and generalizes worst). The
recurrence-and-Engram saga is closed. The state-space saga has begun:
SS01 puts a diagonal scan with a constant 256-byte state in attention's
place (constant memory, worse held-out loss, slower in the interpreter);
SS02 makes the decay depend on the token and HA01 keeps one attention
block among state blocks. The campus docent (a tiny model
trained in batch here to direct visitors of the research campus site) is
paused after its first five steps: it does not yet beat a deterministic
matcher. The animated data-flow landscape (every mechanism's data movement
played back from the pinned recordings, panning along one wide scene) is
live and closes its saga next; then the state-space block and the tiny
hybrid, distillation, the state-memory-experts composition, multi-token
prediction, the routed docent, quantization, the expert cache, and
heterogeneous execution. Plan:
[docs/overview/plan.md](docs/overview/plan.md).

## What is here

```text
docs/README.md               Documentation landing page with three reader journeys
docs/overview/               Architecture, delivery plan, saga queue
docs/results/                Resource economics (RB01) and the results dashboard
docs/experiments/            One page per experiment
docs/reference/              Full results table, generation benchmark, capability ledger, upstream findings
docs/implementation/         Host handoff, sibling work orders, teacher fixture schema
docs/research/               The design discussion, the Saga 2 review, the MoE/Engram questions
lib/  demos/  tests/         MLPL model code, lessons, and native mlplunit tests
probes/                      Standalone reproducers re-checked by the gate
fixtures/  assets/previews/  Bounded fixtures, pinned recordings, and committed diagrams
catalog/                     Machine-readable lesson inventory
scripts/  justfile           Thin gate and tool-selection scripts
```

## Build and run

Prerequisites:

- the adjacent [`../sw-mlpl`](https://github.com/sw-ml-study/sw-mlpl) checkout built in release mode
  (`target/release/mlpl-repl`), or an absolute `MLPL` override;
- `mlplunit` on `PATH`, an absolute `MLPLUNIT` override, or the adjacent
  `../../softwarewrighter/mlplunit/bin/mlplunit` checkout;
- [`just`](https://github.com/casey/just);
- `agentrail` for the development process.

The scripts only select existing tools; they never install or overwrite them.

```sh
just                 # list recipes
just check           # the complete pre-commit gate (lessons served from tmp/gate-cache when unchanged)
just check --fresh   # the same gate with every lesson retrained (about 40 minutes)
just check-docs      # the documentation-only gate: structure, links, style, catalog, page, landscape
just tests           # native mlplunit tests (arguments filter paths or tags)
just probes          # re-run the upstream-finding reproducers
just domain          # run DM01 and check its diagrams
just dense           # run DN01 (about 16 s) and check its diagrams and results row
just teacher         # validate the committed TE01 fixture without retraining
just router          # run the MX01 routing microscope and check its diagram
just moe             # run MX01 training (about 36 s) and check its diagrams and results row
just dispatch        # run SD01 sparse dispatch with exact parity (about 5 s)
just moe2            # run MX02 top-2 routing and the specialization map (about 36 s)
just scale           # validate the DS01 data-scale points and diagram (opt-in sweep: just scale write)
just delta           # run LD01 low-rank delta experts with a shared FFN (about 80 s)
just budget          # RB01 resource budget: document and diagram, no training
just benchmark       # GB01 generation benchmark fixture and document (write to re-measure)
just mlpl-style      # canonical formatting and docstring checks
just check-gate-cache # prove the gate cache reruns exactly the lessons a library edit touches
just literate        # check the literate org document: tangle parity, primer results, HTML export
just literate-html   # export docs/literate/moe-microscope.org to learn/literate.html (Emacs, batch)
```

`just check` validates repository structure, documentation links,
peer-identical license files, the generated Agentrail briefing, MLPL style,
the native test suites, the pinned reproducers, and every lesson with its
diagrams, fixtures, results rows, and live recordings. Each lesson extends the
gate with its own demo run, preview freshness check, recording check, and
catalog check. Retraining every lesson takes about 40 minutes (2495 s
measured on 2026-09-16) and the same gate with a warm cache takes 51 s, so each demo
gate script keys a cache entry under `tmp/gate-cache/` on the sha256 of its
demo source, the library files it includes (transitively), the fixtures and
tables it reads, the previews and results rows it checks, its
`recordings.conf` line, and the mlpl binary's version and commit; a check run
whose key was already recorded by a passing check run prints `PASS (cached)`.
Write mode never touches the cache, `just check --fresh` (or `GATE_FRESH=1`)
ignores it, and `just check-gate-cache` proves the keying by editing a library
file in a scratch copy. `just check-docs` runs only the structure, link,
style, catalog, page, and landscape checks; it is acceptable for a commit
that changes nothing under `lib/`, `demos/`, `tests/`, `probes/`,
`scripts/run-*`, or `fixtures/` and does not change the binary
([`AGENTS.md`](AGENTS.md) states the rule).

The interactive host is the generic Rust/Yew/WASM microscope and MLPL web
framework in `../demo-extensions`; that Rust code is the only part of this
effort subject to `sw-checklist`.

## Literate reading

[`docs/literate/moe-microscope.org`](docs/literate/moe-microscope.org) is
an Emacs org-mode, reproducible-research reading of the microscope: a
primer of seven self-contained, runnable MLPL blocks (a window, a dense
block, the router, dispatch parity, recurrence, Engram hashing, the
state-space scan) with the measured numbers beside them, and the
mechanism sources split at function boundaries with prose before each.
The source blocks tangle to the committed `lib/` and `demos/` files byte
for byte, the gate proves it (`scripts/check-tangle`, which also reruns
every primer block against its recorded result), and the batch HTML
export is published as [`learn/literate.html`](https://sw-ml-study.github.io/moe-microscope/literate.html)
beside the live demo. It runs on sw-MLPL's `ob-mlpl` backend from the
adjacent checkout; the document's first block sets it up.

## Development process

Work is divided into durable Agentrail steps. In each fresh session run
`agentrail next`, then `agentrail begin`; implement only that step; run focused
tests and `just check`; commit source and `.agentrail/` metadata by name; push
`main`; and only then run `agentrail complete`. [`AGENTS.md`](AGENTS.md) holds
the full repository protocol and `CLAUDE.md` links to it.

## Copyright and license

Copyright (c) 2026 Michael A Wright. See [COPYRIGHT](COPYRIGHT).

Distributed under the [MIT License](LICENSE).
