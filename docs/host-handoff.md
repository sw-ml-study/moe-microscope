# Generic host handoff: DN01, MX01, and MX02 recordings

Status: implementation-ready work order for an agent operating in
`../demo-extensions`. This repository does not authorize or contain the Rust
implementation. The generic Rust/Yew/WASM microscope there already renders
the MM01, LR01, and KM01 recordings from `../demo-ml-microscope`; this handoff
adds the first three MoE-microscope recordings under the same version-zero
schema and asks for no lesson-specific Rust. `scripts/recordings.conf` is
the machine-readable list of recorded lessons with their budgets.

## Pinned producer inputs

Vendor `sw-ml-study/moe-microscope` at the revision named in
[`fixtures/recordings/index-v1.json`](../fixtures/recordings/index-v1.json).
The index pins, by SHA-256, the recording, the lesson source, and the bundled
single-file program that produced the recording, plus frame, observation,
value, and step counts. The schema is the byte-identical peer schema,
[`recording-schema-v0.json`](../fixtures/recordings/recording-schema-v0.json).

The producer acceptance commands are:

```sh
just recordings             # live mlpl-serve runs equal every committed recording
just recording-check        # schema, budgets, shapes, names, and pinned hashes
```

`scripts/bundle-program` exists because the `eval_stream` surface has no
source provider (finding F16); the pinned `bundle_sha256` covers exactly the
program text a host would submit for a live run.

## What the recording contains

DN01 trains one dense transformer block for 300 epochs and records:

| Name | Shape | Frames | Meaning (producer-owned) |
|---|---|---|---|
| `dense/config` | `[6]` | step 0 | d_model, hidden, T, epochs, train rows, validation rows |
| `dense/loss/train` | `[]` | steps 25, 50, ..., 300 | masked next-token loss on all training rows |
| `dense/loss/val` | `[]` | same | masked loss on all validation rows |
| `dense/accuracy/val` | `[5]` | step 300 | exact match per family plus overall |
| `dense/accuracy/train` | `[5]` | step 300 | same on training rows |
| `dense/logits/example-argmax` | `[7]` | step 300 | argmax token id per position of the example `2+3=\|5.` |
| `dense/attention/example` | `[7, 7]` | step 300 | causal attention weights of that example |

Budgets declared in the DN01 recording: 16 frames, 8 observations per
frame, 64 values per observation, 128 values in total. The index records
the actual counts.

## What the MoE recordings add

MX01 (`moe/*`) and MX02 (`moe2/*`) train the four-expert mixture for 300
epochs and record, at every 25-epoch checkpoint and at the end:

| Name | Shape | Meaning (producer-owned) |
|---|---|---|
| `moe/config` | `[8]` | d_model, hidden, experts, k, T, epochs, train rows, validation rows |
| `moe/loss/train`, `moe/loss/val` | `[]` | masked loss per checkpoint (a series) |
| `moe/load` | `[4]` | masked training tokens per expert per checkpoint (a vector series) |
| `moe/entropy`, `moe/balance` | `[]` | router diagnostics per checkpoint |
| `moe/family-by-expert` | `[4, 4]` | tokens by task family and expert at the end |
| `moe/accuracy/val`, `moe/accuracy/train` | `[5]` | exact match per family plus overall |
| `moe/route/example` | `[7]` (MX01) or `[7, 4]` (MX02) | expert chosen per position, or the top-2 mask, for `2+3=\|5.` |
| `moe2/specialization` | `[]` | MX02 only: mean largest family share |

Budgets declared: 16 frames, 12 observations per frame, 64 values per
observation, 256 values in total. A repeated `[4]` name (`moe/load`) is a
vector series the generic renderer should present as one line per index
without knowing that an index is an expert; the `[4, 4]` map is a heatmap
whose rows and columns are numbered, never named.

## What the generic host must show

Using only shape-directed plans that already exist for the peer lessons:

- repeated scalar names (`dense/loss/train`, `dense/loss/val`) as a generic
  series keyed by retained step, with the exact values in a table;
- `[5]` and `[6]` vectors as tables with an optional bar view;
- the `[7]` argmax vector as a table (the host must not decode ids into
  characters; that is producer semantics);
- the `[7, 7]` matrix as a heatmap with rows and columns numbered and the
  exact values available.

Steps are nonconsecutive (0, 25, 50, ...); navigation is by retained frame
index, exactly as LR01 already proves. Frame 300 carries six observations,
the largest per-frame count among the vendored lessons.

## What must not be added

No `DenseViewer`, `LossCurve`, `AttentionHeatmap`, or any type that knows
what a loss, an epoch, or an attention map is. No decoding of token ids. No
tolerance-based "close enough" comparison of values: the recording is exact.

## Acceptance

1. The pinned recording parses, validates in the documented order, and
   matches the indexed hashes and counts.
2. The existing selector lists DN01 beside MM01, LR01, and KM01 without a
   new code path.
3. Native model tests cover the nonconsecutive-step navigation and the
   six-observation frame.
4. `sw-checklist` passes on the affected Rust crates. This is the only
   `sw-checklist` scope in the MoE microscope effort.
5. Any shape or budget the generic renderer cannot present is reported here
   as a finding, the way language findings are reported upstream.

## Live path (optional, later)

A live run submits the bundled program to a local `mlpl-serve` with
`--auth disabled --cors-allow <yew origin>` and consumes ordered `ready`,
`frame`, `metric`, `done` events. `metric` events (from `train` blocks) carry
no `shape` and must be ignored by the recording assembler, as
`scripts/capture-dense-recording` does. The run takes about 16 seconds on a
laptop; the host should show progress by retained frame count rather than
block on completion.
