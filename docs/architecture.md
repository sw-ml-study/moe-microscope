# Architecture

## Governing principle

MLPL owns the model and its meaning. Hosts render recorded observations.

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
alone against the dense baseline.

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

Observation names are stable slash-separated paths grouped by mechanism, for
example `moe/router/logits`, `moe/router/mask`, `moe/dispatch/expert-load`,
`engram/address/2gram`, `engram/gate`, `recur/state/2`, `cache/hit-miss`,
`cache/bytes-per-token`, `hybrid/q-star`. A host groups by prefix and chooses a
presentation from shape; it never learns what a router is.

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
[capability ledger](sw-mlpl-blockers.md).

## Explicit non-boundaries

- Router, experts, Engram, cache policy, and scheduler remain MLPL programs.
- Recorded playback does not imply live pause, resume, or reverse execution.
- Diagrams do not replace numeric assertions; they are derived from them.
- The optional host does not fork observation semantics.
