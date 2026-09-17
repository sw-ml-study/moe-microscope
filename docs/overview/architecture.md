# Architecture

## Governing principle

MLPL owns the model and its meaning. Hosts render recorded observations. Both
halves are dogfooded: the model side proves sw-MLPL as a language for runtimes
and open weights, and the host side proves sw-MLPL plus `../demo-extensions`
as the toolchain for the educational visualization itself.

Prefer a shipped sw-MLPL feature over an equivalent built here. Build from
scratch only where watching the mechanism is the lesson, and then show both
forms with a parity check. Every gap becomes a reproducer, a pinned probe,
and an upstream work order in [`sw-mlpl-findings.md`](../reference/sw-mlpl-findings.md).

MicroMoE is written as readable MLPL: an embedding, an Engram lookup, one
shared recurrent block containing causal attention and a router over a bank of
small experts, a combine step, a state update, and a language-model head. The
training loops, the synthetic data generators, the evaluation oracles, the
quantizers, the packed-file writer and reader, the expert-cache simulator, and
the hybrid scheduler are also MLPL. No part of the lesson is reimplemented in
a host language in order to draw it.

## The model under the lens

```text
                   token ids
                       |
             +---------v---------+
             | token embedding   |
             +---------+---------+
                       |
      recent ids ------+------------------+
                       |                  |
                       |          +-------v-------+
                       |          |    Engram     |  hashed 2/3-gram rows,
                       |          |  lookup+gate  |  projection, learned gate
                       |          +-------+-------+
                       |                  |
                +------v------------------v------+
                | shared recurrent block         |<----------+
                | rms_norm -> causal attention   |           |
                +---------------+----------------+           |
                                |                            |
                         +------v------+                     |
                         |   router    |  logits [T, E]      |
                         +------+------+                     |
                                | top-k mask, gate           |
                         +------v------+                     |
               RAM/file--|expert cache |  LRU over (block,   |
                         +------+------+  expert), bytes     |
                                |                            |
                 +--------------+--------------+             |
                 |              |              |             |
              expert         expert         expert          |
                 |              |              |             |
                 +--------------+--------------+             |
                                |                            |
                            combine                          |
                                |                            |
                          state update ----------------------+  R times
                                |
                             LM head
```

Four independent kinds of sparsity are exposed as separate switches:
parameter sharing (recurrence), conditional compute (MoE), conditional memory
(Engram), and residency (expert cache). Each has a lesson that turns it on
alone against the dense baseline. The taxonomy grew with
[`research4.txt`](../research/research4.txt) into seven resource
allocation axes (compute, parameters, memory, state, residency, precision,
time), adding the state-space block (how much sequence history stays
resident), quantization, and multi-token prediction; the
[concepts index](../concepts/README.md) holds the table.

## Layering

```text
MLPL lesson
  model + training + evaluation + explicit educational checkpoints
            |
small MLPL observation facade
  name + numeric step + value, returning the value unchanged
            |
emit_frame assembly primitive (sw-MLPL)
            |
renderer-neutral recorded observations (peer version-zero schema)
            |
  +---------+----------------------+
  |                                |
static SVG + numeric tables   generic Rust/Yew/WASM host (optional)
canonical committed evidence  optional native graphics host
```

Observation names are literal strings (finding F8: `emit_frame` rejects a
name held in a variable), stable, slash-separated, and grouped by the
mechanism prefixes listed in `lib/observe.mlpl`, for example `moe/router/logits`, `moe/router/mask`, `moe/dispatch/expert-load`,
`engram/rows/example`, `engram/gate/mean`, `rm/route/example`, `cache/hit-miss`,
`cache/bytes-per-token`, `hybrid/q-star`. A host groups by prefix and chooses a
presentation from shape; it never learns what a router is.

## Source conventions forced by the language today

- Losses are user functions or expressions, never pre-evaluated variables
  (D1: a variable is a constant on the tape).
- Experts, routers, and blocks are module-level globals that user functions
  refer to by name (F7: models cannot be arguments).
- The top-k mask is computed eagerly each training step and passed into the
  loss as a constant; the gate is `softmax(logits) * mask` (F5, and a
  renormalized top-1 gate has no router gradient).
- Recurrence depth is spelled as nested `apply` in one user function per
  depth (F6: `repeat` is not traced).

Each convention is pinned by a probe and disappears when the upstream fix
lands.

## Two execution paths, one semantics

Training uses a dense-masked formulation: every expert is evaluated and the
top-k gate zeroes the rest. The cost is dense but the mathematics is exactly
the sparse model, and autograd stays simple. Inference uses sparse dispatch:
only selected experts are evaluated, counted, cached, and scheduled. Every
lesson that introduces the sparse path asserts parity with the dense-masked
path on the same fixture. Systems measurements (expert evaluations, bytes,
hits, misses, q-star splits) come from the sparse path; quality measurements
come from either, since they agree.

## Scale tiers

The microscope scale (CPU, seconds, tens of thousands of parameters) is the
acceptance scale. The lab scale (MLX, minutes, millions of parameters) is
opt-in and uses the same source under `device("mlx") { }`. The embedded target
(256 MB, 0.5 TOPS) is an inference target for the packed file and is reached
by a later runtime handoff, not by this repository's interpreter path.

## Visual and measurement contract

Every step, data structure, and transformation has an annotated diagram that
states what it is, why it exists, and how it is computed, generated from the
same recorded values the tests assert on. Every lesson records memory, speed,
and quality in the catalog and the results table. The full contract is in the
[delivery plan](plan.md).

## Incremental gate

`scripts/check` runs every check in order; the demo gate scripts
(`scripts/run-*-demo`, `run-scale-sweep`, `run-benchmark`, `run-teacher`,
`run-walkthrough-export`, `run-recording-parity`) retrain or replay a lesson
and compare its diagrams, fixtures, and results rows with the committed
files. Retraining everything takes about 40 minutes (2495 s measured on
2026-09-16; the warm gate the same day took 51 s with 27 cached entries), so each of those scripts
sources `scripts/gate-cache` and computes a key before it runs: the sha256 of
its demo source and the library files that source includes (transitively,
following `include` lines the way `scripts/bundle-program` does), every
`fixtures/`, `docs/`, `assets/`, or `catalog/` path literal those sources
name, the previews and fixtures it compares, the results-table lines of its
lessons, its `scripts/recordings.conf` line, the script itself, the helper,
and the mlpl binary's version and commit line (`run-recording-parity` also
hashes the `mlpl-serve` binary and keeps one entry per lesson). A check run
whose key exists under `tmp/gate-cache/<script>/` prints `PASS <script>
(cached)` and exits 0; a passing check run records its key with the manifest
it hashed, so `cat` on the entry shows exactly what was pinned. Failing runs
record nothing. Write mode never reads or records the cache, so the first
check after a write reruns the lesson against the files the write installed.
`just check --fresh` (or `GATE_FRESH=1`) ignores existing entries; the cache
lives under the ignored `tmp/` and is discarded with it.

The keying is proven by `scripts/check-gate-cache`, which runs in the gate:
in a scratch copy with its own cache directory it shows a second run cached,
a library edit rerunning exactly the lessons whose include closure contains
the file, a stale preview failing without recording, write mode and
`GATE_FRESH` bypassing the cache, and the manifest naming transitive
includes, path literals, rows, and the recordings line.

`scripts/check-docs` is the documentation-only gate (structure, links,
style, catalog, page, landscape). It is acceptable for a commit that changes
nothing under `lib/`, `demos/`, `tests/`, `probes/`, `scripts/run-*`, or
`fixtures/` and does not change the binary; `AGENTS.md` states the rule.

## Delivery boundary

This repository implements `.mlpl` model code, lessons, generators, oracles,
simulators, tests, fixtures, previews, and lesson text.

`../demo-mlpl-libraries` may later own domain-neutral helpers (observation
facade, byte packing, quantization arithmetic) after three unrelated consumers
prove them; consumption is by immutable revision and hash lock.

`../demo-extensions` owns the preferred generic Rust/Yew/WASM microscope host
and the optional native renderer. Its Rust work is subject to `sw-checklist`.

`../sw-mlpl` changes only for a measured language-wide gap with a minimal
executable reproducer, recorded first in the
[capability ledger](../reference/sw-mlpl-blockers.md).

## Explicit non-boundaries

- Router, experts, Engram, cache policy, and scheduler remain MLPL programs.
- Recorded playback does not imply live pause, resume, or reverse execution.
- Diagrams do not replace numeric assertions; they are derived from them.
- The optional host does not fork observation semantics.
