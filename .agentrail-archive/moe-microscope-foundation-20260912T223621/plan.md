# MoE microscope delivery plan

## Outcome

Build a tiny mixture-of-experts language model from scratch in sw-MLPL, one
mechanism at a time, so that a learner can look inside every part of it:
tokens, Engram lookup, recurrent state, router, expert selection, expert cache,
and CPU/NPU scheduling. Every stage is an executable MLPL lesson that records
its own intermediate values, ships an annotated diagram of what happened, and
reports three measurements: memory, speed, and quality.

The model under the lens is called MicroMoE. The repository is the microscope.
The microscope compares MicroMoE against dense, recurrent, Engram, quantized,
cached, and hybrid-execution variants; it is not defined by one architecture.

This is primarily an sw-MLPL project, and it dogfoods two things at once:
sw-MLPL as the language for building the model, its runtime pieces, and open
weights (MoE, Engram, quantization, packed files), and sw-MLPL plus
`../demo-extensions` as the toolchain for building the educational
visualization itself. Proving that the model trains and that the techniques
have value is necessary but not sufficient; the microscope's diagrams,
recordings, and interactive host are deliverables of the same standing.

MLPL owns the model, the training loops, the data generators, the evaluation,
the systems simulators, and the lesson text. Every lesson produces a recording
that the generic Rust/Yew/WASM microscope in `../demo-extensions` must render
without lesson-specific Rust, and the interactive live demo uses the MLPL web
framework proven there. Only Rust code is subject to `sw-checklist`.

Every gap met on the way is a finding. It gets a reproducer, a pinned probe,
a workaround, and an upstream work order in
[`sw-mlpl-findings.md`](sw-mlpl-findings.md). The first four findings were
fixed upstream the same day they were filed; that loop is part of the product.

## Builtin first, from scratch where it teaches

Prefer an existing sw-MLPL feature over an equivalent built here. Build a
mechanism from scratch only when watching it work is the lesson, and then
show both: the detailed version that exposes every intermediate value and the
pragmatic version that calls the builtin, with a parity check between them.
The catalog records each lesson as `builtin`, `from-scratch`, or `both`.

| Mechanism | Builtin exists | Lesson form | Why |
|---|---|---|---|
| Embedding, attention, RMS norm, cross-entropy, perplexity, BPE, sampling, KV cache | yes | builtin | no educational reason to rewrite them |
| Engram addressing, retrieval, gate | yes (`ngram_hash`, `engram`, `apply_engram`, `engram_stats`) | both | the detailed version shows hashing, gathering, and gating row by row; the builtin is the trained, deployable form; parity is asserted |
| Router, top-k, dispatch, combine, load balance | no | from scratch | this is the subject of the repository |
| Recurrence, deep supervision | no (nested `apply`) | from scratch | reuse of one block is the point |
| KL divergence | no builtin, documented composition | builtin idiom | one line |
| Quantization | no | from scratch, by handoff | reuse the INT8/Q4 arithmetic proven in `../demo-ml-utils` through `../demo-mlpl-libraries` rather than a third copy |
| Expert cache, q-star scheduler, packed file | no | from scratch | systems lessons; byte I/O builtins underneath |
| Observation, SVG, recording, playback | yes (`emit_frame`, `svg`, peer schema, Yew host) | builtin | the host is dogfooded, not rebuilt |

The source discussion is retained in [`research.txt`](research.txt).

## Two questions answered up front

### How will we distill the experts?

"Distilled from scratch" means: the tokenizer, architecture, router, experts,
Engram, and recursion are all initialized fresh in MLPL, and part of the
training signal comes from a more capable teacher. Nothing is pruned or copied
from an existing network. Distillation happens at four levels, added one saga
at a time so each contribution is measurable:

1. **Token-level distillation (KD).** The teacher supplies a probability
   distribution over the next token for every training position. The student
   minimizes `alpha * CE(student, label) + beta * KL(teacher || student)`.
   The teacher logits are computed once and stored as a bounded fixture so
   the lesson stays deterministic and offline.
2. **Router warm start.** Each synthetic example carries a task tag
   (arithmetic, sequence transform, code, prose). For the first fraction of
   training, an auxiliary loss `gamma * CE(router logits, tag -> expert map)`
   nudges the router toward a task-aligned partition. The auxiliary loss is
   then removed and the microscope measures whether the specialization
   survives on its own. This is deliberately optional: the honest experiment
   is to compare warm-started and free routing side by side.
3. **Expert-level distillation from a dense teacher FFN.** The dense baseline
   trained in Saga 1 is itself a teacher for the experts. Each expert is
   initialized as the shared FFN plus a low-rank delta `A_e B_e` (rank 4 to 8),
   and the delta is trained on the subset of positions the router sends to
   that expert, matching the teacher's hidden activations. This gives the
   "many cheap experts" configuration a strong start without a large unique
   parameter budget.
4. **Recurrence supervision.** With the shared block applied `R` times, each
   intermediate state is decoded and penalized (`epsilon * L_recurrence`),
   rewarding trajectories that improve the answer step by step, as in TRM-style
   deep supervision. The microscope shows accuracy as a function of `R`.

The full objective is
`L = alpha L_token + beta L_KD + gamma L_router + delta L_balance + epsilon L_recurrence`.
Every weight has a lesson that turns it on alone against the dense baseline.

Teachers come in two tiers:

- **In-repo teacher (default, always runnable).** A larger dense MLPL model
  trained on the same synthetic domain (for example `d_model` 64, two blocks)
  produces the KD targets. It is not a strong model, but it is measurably
  better than the microscope-scale student, entirely inspectable, and needs
  no external dependency.
- **External teacher (opt-in, gated).** A modest local model such as a
  1B to 7B quantized checkpoint generates labels and top-k log probabilities
  for the same prompt families through the gated Rust-native path already
  documented in `../demo-ml-utils`. The exported fixture has the same schema
  as the in-repo teacher fixture, so the student code does not change. The
  lesson reports the teacher's identity, revision, and export budget, and
  exits with a documented status when the capability is unavailable.

### What domain will this model work in, showing some value?

The model is not a general chatbot. It works in a constrained, synthetic-heavy
mixture chosen so that expert specialization is visible and value is
measurable per task with exact-match accuracy:

| Task family | Example | Why it is in the mixture |
|---|---|---|
| Small-integer arithmetic | `17+25=` -> `42` | deterministic, exact-match scoring, known to reward dedicated experts |
| Sequence transformations | `rev 3 1 4 1 5 ->` `5 1 4 1 3`; sort, dedupe, run-length | tests copying/ordering machinery; recurrence depth should matter |
| Tiny MLPL expressions | `reduce_add([1,2,3])` -> `6`; `shape(zeros([2,3]))` -> `[2,3]` | in-house code domain with a real oracle (the interpreter itself) |
| Short templated prose | `the cat sat on the` -> `mat` plus the `tiny_corpus` snippet | gives the Engram frequent local n-grams to memorize |

The value demonstration is a **pocket helper** that runs from a packed file of
a few hundred kilobytes: type a small arithmetic problem, a sequence command,
or the start of a tiny MLPL expression, and the model answers while the
microscope shows which experts fired, which Engram rows were read, and how many
bytes crossed the simulated expert cache. Quality is reported as a per-task
accuracy table against exact oracles (arithmetic, sequence functions, and the
sw-MLPL interpreter), not as a single perplexity number.

The mixture ratios are a fixture, not a hidden constant. Prose is deliberately
the smallest share at first so that the three exact-scored families dominate
the accuracy table. Later sagas may widen the prose share once the exact tasks
are solved at the target scale.

## Evidence and current constraints

Measured from the adjacent `../sw-mlpl` checkout (`mlpl-repl 0.22.0`) and its
language reference. Nothing here is an upstream request yet.

- Model DSL: `embed`, `linear`, `chain`, `residual`, `rms_norm`,
  `causal_attention`, `relu_layer`, `apply`, `freeze`, `param_count`,
  `param[shape]` leaves, reverse-mode `grad`, `adam` over a param, a list of
  params, or a model, `train N { }` with `last_losses`, and
  `experiment "name" { }`.
- Language-model helpers: `train_bpe`, `tokenize_bytes`, `shift_pairs_x/y`,
  `cross_entropy`, `perplexity`, `softmax`, `top_k`, `sample`,
  `attention_weights`, and KV-cached generation (`gen_state`, `gen_logits`,
  `gen_append`, `gen_stats`).
- Engram already exists as a builtin family: `ngram_hash`, `engram`,
  `apply_engram`, `engram_stats`. `demos/tiny_lm_engram_mlx.mlpl` proves
  frozen-base Engram training on CPU and MLX. The microscope will first build
  the same mechanism from `ngram_hash` + `gather_rows` + a hand-written gate so
  the learner sees every line, then check parity against the builtin.
- Routing primitives: `argtop_k`, `argmax`, `gather_rows`, `compress`,
  `one_hot`, `eq`/`gt`/`lt` masks, `scatter`, `concat` with axis, `take`.
- Systems primitives: `read_bytes(path, offset, length)`, `read_bytes_packed`,
  `write_bytes`, `write_atomic`, `to_native`/`parse_native`, `to_json`,
  `file_size`, and a monotonic `clock_ms()`.
- Observation and visuals: `emit_frame(name, step, x)` returns `x` unchanged
  and streams it over the connect-mode SSE sink; `svg(data, type)` renders
  heatmaps, scatter, curves, and `"equation"` text; peers already freeze a
  version-zero recording contract in `../demo-ml-microscope`.
- Hardware here: Apple M1 Max, 64 GB. Lab-scale training can use
  `device("mlx") { }`. The 256 MB / 0.5 TOPS target is an inference target
  reached by a later packed-file runtime, never by training on the device.
- MLPL arrays are f64 on the CPU path. Integer hashing is exact below 2^53;
  quantized weights are simulated as integer-valued f64 arrays plus packed
  byte files, which is what the byte-accounting lessons need.

The capability probes in Saga 1 step 2 settled the open questions. Supported:
`adam` over a mixed list of models and params with the loss written as user
functions, recurrence by nested `apply`, `gather_rows` on the tape, KL as a
composition, one-argument `softmax` everywhere, packed byte round trips.
Blocked with workarounds, pinned by probes and queued upstream: index and mask
builtins inside `grad` (eager mask passed as a constant), `repeat` inside a
traced function (nested `apply`), models as user-function arguments
(globals), and `emit_frame` names that are not literals (naming helpers
only). Details are in the [capability ledger](sw-mlpl-blockers.md) and
[findings](sw-mlpl-findings.md).

## Architecture rule

```text
moe-microscope (.mlpl model, lessons, simulators, evaluation)
          |
          +-- repeated domain-neutral helpers --> ../demo-mlpl-libraries
          |
          +-- generic viewer requirement --------> ../demo-extensions (Rust/Yew)
          |
          `-- proven language-wide blocker ------> ../sw-mlpl
```

Rust hosts may own generic observation ingestion, retention, playback,
tensor inspectors, and rendering. They must not contain a `MoeVisualizer`,
router semantics, cache policy, or any other lesson-specific type. Sibling
repositories are read-only from this project; their work is written down as a
handoff in [`cross-repo-handoffs.md`](cross-repo-handoffs.md).

## MicroMoE at two scales

The same MLPL source runs at two documented scales. The microscope scale is
the acceptance scale for every lesson; the lab scale is opt-in and uses MLX.

| Component | Microscope scale (CPU, seconds) | Lab scale (MLX, minutes) |
|---|---|---|
| Vocabulary | 64 to 96 byte-level symbols over a restricted alphabet | 1,024 to 4,096 BPE |
| `d_model` | 16 to 32 | 128 to 256 |
| Physical blocks | 1 shared block | 2 to 4 shared blocks |
| Recurrences `R` | 1 to 4 | 1 to 8 |
| Experts per block | 4 to 8 | 32 to 64 |
| Active experts | top-1 or top-2 | top-2 |
| Expert hidden width | 16 to 32 | 128 |
| Expert form | full FFN, then low-rank delta over a shared FFN | low-rank delta |
| Attention | one-head causal, `T` 8 to 16 | small causal attention, `T` 64 to 128 |
| Engram | 2-gram and 3-gram, 256 to 1,024 slots, 8 dims | 65,536 slots, 32 dims |
| Trainable parameters | roughly 10K to 60K | roughly 5M to 20M |
| Deployment form | packed file, INT8 shared weights, INT8 then INT4 experts | same format |

The microscope-scale model is small enough that a learner can print every
tensor. That is the point. Bigger numbers only enter after a stage is proven.

## Visual and measurement contract

This contract applies to every lesson in every saga.

Every step, data structure, and transformation gets a diagram:

- **Data-structure diagrams.** Each tensor or record the lesson introduces
  (token window, router logits, top-k mask, expert bank, Engram table, cache
  slots, packed file layout) is drawn once with its shape, dtype, byte size,
  and axis meanings, and annotated with what it holds, why it exists, and how
  it is produced.
- **Transformation diagrams.** Each process (routing, dispatch, combine,
  Engram lookup, recurrent update, quantize, cache lookup, q-star split) is
  drawn as before -> operation -> after with the exact values from the fixture
  on the arrows. Annotations state what changed, why the model needs it, and
  how the MLPL source computes it.
- **Step timelines.** The recorded observations of one run are laid out as a
  step-by-step strip so a learner can follow one token from input to
  prediction and one training run from initialization to convergence.

Diagrams are generated from the same recorded values the tests assert on.
Static SVG is the canonical committed form (`assets/previews/`), with the
`svg()` builtin and hand-written SVG in MLPL both allowed. Peer guidance on
GIF, video, and interactive exports in `../demo-ml-microscope` applies.
Color is never the only carrier of meaning; every diagram has a title, a
description, and a numeric table beside it.

Every lesson measures three things and records them in its catalog entry:

| Axis | Required measurements | How |
|---|---|---|
| Memory | trainable parameters, active parameters per token, bytes per expert, packed file bytes, expert-cache bytes, Engram bytes, retained observation bytes | `param_count`, explicit shape arithmetic, `file_size`, byte accounting in the simulators |
| Speed | expert evaluations per token, bytes transferred per token, cache hits/misses/loads, CPU versus NPU assignments, and wall-clock milliseconds per token and per training step | counted costs are the deterministic primary metric; `clock_ms()` gives the machine-dependent secondary metric, reported with the binary version |
| Quality | validation loss, perplexity, per-task exact-match accuracy, teacher/student KL, router entropy, expert load balance, expert specialization by task, Engram gate magnitude and collisions, accuracy versus recurrence depth | evaluation harness over the fixed synthetic split; oracles for arithmetic, sequence, and MLPL tasks |

Every run appends one row to a results table (`docs/results.md`) keyed by
lesson ID, configuration, and binary version, so the ablation matrix from the
research (dense, +recurrence, +MoE, +Engram, combinations, +quantization,
+cache, +hybrid) fills in as sagas complete rather than being promised.

## Experimental progression

| Stage | Lesson | Architecture | Question |
|---|---|---|---|
| 0 | DN01 | dense tiny transformer | baseline for everything else |
| 1 | RC01 | one shared block applied `R` times | does repeated compute replace parameters? |
| 2 | EG01 | dense + Engram | does external memory improve loss and tasks? |
| 3 | MX01 | top-1 MoE | can experts specialize? |
| 4 | MX02 | top-2 MoE | is quality worth doubled active compute? |
| 5 | RM01 | recurrent MoE | does expert selection change over reasoning time? |
| 6 | RE01 | recurrent MoE + Engram | do memory and compute sparsity complement each other? |
| 7 | KD01 | distilled variants | which distillation term buys what? |
| 8 | QZ01 | INT8 then INT4 experts | what quality is lost, and how many more experts fit in a cache? |
| 9 | XC01 | constrained expert cache | what does capacity do to hit rate, bytes per token, and speed? |
| 10 | HY01 | CPU/NPU hybrid with q-star | can FreeToken-style scheduling help? |
| 11 | PK01 | packed TinyMoE file and 256 MB budget | can the whole thing survive an embedded budget? |

## Visualization track, every saga

The host is dogfooded from the first lesson, not after the last one:

- Every lesson emits a recording under the peer version-zero schema from
  `../demo-ml-microscope`, pinned by hash in `fixtures/recordings/`.
- Every saga ends with a host step: vendor the new recordings into the
  generic Rust/Yew/WASM microscope in `../demo-extensions` through a written
  handoff, prove that the existing shape-directed renderer presents them, and
  report any shape or budget finding the way language findings are reported.
- The interactive live demo (edit the lesson, rerun, watch the timeline) is
  built on the MLPL web framework and `mlpl-serve` SSE path already proven in
  `../demo-extensions`, starting once three recordings exist.
- Committed SVG diagrams remain the canonical README evidence; the host adds
  playback and selection, never a second implementation of the lesson.

## Saga 1: foundation, probes, domain, and dense baseline

1. **foundation-contract.** Install the generated Agentrail briefing and
   project rules in `AGENTS.md`, peer-identical `COPYRIGHT` and `LICENSE`,
   README, this plan, saga queue, architecture, capability ledger, sibling
   handoffs, and a documentation-only `just check` gate. No lesson code.
2. **capability-probes.** Native mlplunit probes for the items listed under
   constraints: multi-model `adam`, gradients through repeated application,
   masked-softmax gates, `gather_rows` differentiability, KL availability,
   per-token loop cost with `clock_ms()`. Freeze results in the ledger; write
   the smallest observation facade (`observe`, `metric`, `note` style names
   are candidates, not promises) on top of `emit_frame`.
3. **synthetic-domain-and-evaluation.** Deterministic generators for the four
   task families with seeds, splits, and task tags; an exact-match evaluation
   harness with oracles; a results-table writer; and the diagrams for the
   token window, tag, and split data structures.
4. **dense-baseline-lesson (DN01).** A readable dense tiny transformer trained
   at microscope scale with recorded observations, the annotated step strip,
   the memory/speed/quality triple, the first results row, and a freshness-
   checked preview SVG. DN01 is also the in-repo teacher's little sibling: the
   same source at a larger configuration is trained in step 5.
5. **dn01-recording-and-host-handoff.** Record DN01 over live SSE under the
   peer schema, pin it by hash, probe `emit_frame` inside `train { }` on the
   connect path, and write the `../demo-extensions` handoff for rendering the
   recording in the generic microscope.
6. **in-repo-teacher-fixture.** Train the larger dense model once, export its
   next-token distributions over the training split as a bounded fixture with
   a documented schema, and check the fixture's hash and size in the gate.

Exit: `just check` passes from a clean checkout; the ledger distinguishes
supported, awkward, and blocked behavior by executable evidence; findings
carry reproducers and pinned probes; DN01 has a diagram set, a measured
triple, a results row, and a pinned recording; the teacher fixture exists.

## Saga 2: mixture of experts from scratch

1. **router-and-topk (MX01 part 1).** Router linear layer, softmax, top-1
   mask, renormalized gate, and the dispatch table `[T, E]` as recorded
   observations with diagrams of router logits, mask, and gate.
2. **dense-masked-training.** Train MoE with all experts evaluated and masked
   gates (exact semantics, dense cost) so autograd stays simple. Add the load
   balance loss and router entropy metric. Record per-expert load.
3. **sparse-dispatch-inference.** Forward-only path that evaluates only the
   selected experts per token, asserts parity with the dense-masked path, and
   counts expert evaluations per token. This is the first speed measurement
   that differs between architectures.
4. **top-2 and specialization map (MX02).** Top-2 routing, the task-by-expert
   routing heatmap, and the specialization score. Results rows for MX01 and
   MX02 next to DN01.
5. **low-rank-delta-experts.** Experts as shared FFN plus `A_e B_e` deltas,
   allowing 16 to 32 experts at microscope scale; byte accounting per expert;
   quality comparison with full experts.
6. **moe-recordings-and-host-handoff.** MX01 and MX02 recordings pinned; the
   router mask, dispatch table, and specialization map proven in the generic
   host.

Exit: a learner can watch one token be routed, dispatched, and combined; the
specialization map is a checked artifact; MoE rows exist in the results table.

## Saga 3: recurrence and Engram

1. **recurrent-block (RC01).** Shared block applied `R` times with recorded
   state per recurrence, accuracy versus `R`, and the deep-supervision loss.
2. **recurrent-moe (RM01).** Routing over reasoning time: the expert sequence
   per token per recurrence, drawn as a strip, and the change-of-expert
   statistic.
3. **engram-from-scratch (EG01).** `ngram_hash` addressing, `gather_rows`
   retrieval, projection, and a learned gate written in MLPL; parity check
   against the `engram` builtin; gate magnitude, collision, and nonzero-row
   observations; Engram table diagram with bytes.
4. **recurrent-moe-engram (RE01).** All three sparsities together and the
   ablation table filled for the seven research combinations.
5. **live-demo-foundation.** With DN01, MX02, and RM01 recordings pinned,
   hand off the interactive live demo: MLPL web framework pages that submit
   an editable lesson to `mlpl-serve`, stream frames, and drive the generic
   Yew timeline.

Exit: the ablation matrix rows through RE01 exist with diagrams and triples;
the live demo has a written, implementation-ready handoff.

## Saga 4: distillation

1. **token-kd (KD01 part 1).** `beta L_KD` against the in-repo teacher
   fixture; KL and accuracy deltas versus the same student without KD.
2. **router-warm-start.** `gamma L_router` from task tags for the first
   fraction of training; specialization with and without warm start.
3. **expert-delta-distillation.** Low-rank expert deltas fitted to the dense
   teacher's activations on routed subsets; compare with random-init deltas.
4. **external-teacher-gate.** Opt-in fixture export from a local quantized
   teacher through the gated path; identical fixture schema; documented exit
   status when unavailable.

Exit: each distillation term has a measured, diagrammed, and tabled effect.

## Saga 5: quantization, packed format, and expert cache

1. **int8-experts (QZ01).** Symmetric INT8 experts and shared weights as
   integer-valued arrays plus scales; quality delta; bytes per expert.
2. **int4-experts.** Teaching Q4 nibble packing for experts only; quality
   delta; bytes per expert. Reuse the byte-level conventions proven in
   `../demo-ml-utils` by handoff, not by copying.
3. **packed-tinymoe-file (PK01 part 1).** Header, tokenizer, shared weights,
   routers, Engram, expert index, and one independently readable record per
   expert, written with `write_atomic` and read back expert by expert with
   bounded `read_bytes(path, offset, length)`. File-layout diagram with byte
   offsets.
4. **expert-cache-simulator (XC01).** LRU over `(block, expert)` entries with
   capacity in experts and in bytes; per-token hit/miss/load trace; hit rate,
   bytes per token, and simulated tokens per second against capacity, drawn as
   curves.
5. **prefill-double-buffer.** Two full expert-bank buffers alternating over
   blocks during prefill, with a timeline diagram; measured versus single
   buffer.

Exit: the same model runs from a packed file through a capacity-limited cache
with a checked curve of hit rate and bytes per token versus capacity.

## Saga 6: hybrid execution and the embedded budget

1. **bandwidth-calibration.** A tiny `bench bw` analogue measuring the
   simulated transfer and host-compute bandwidths (from counted bytes and
   `clock_ms()`), stored as a calibration record.
2. **q-star-split (HY01).** Given `m` missing experts, split transfer versus
   local compute by `q* = m * B_P / B_H`; assert the summed partial outputs
   equal the unsplit output; time and byte accounting per policy.
3. **expert-banks.** Group experts into banks that dispatch together; measure
   dispatch count versus bank size.
4. **embedded-budget-report (PK01 part 2).** Total bytes for the packed file,
   cache, Engram, KV state, and retained observations against a 256 MB budget
   at microscope and lab scale; documented gap to a real device runtime.

Exit: HY01 and PK01 rows exist; the embedded gap is a written handoff, not a
claim.

## Saga 7: interactive microscope host, complete

1. **systems-recordings.** Pinned recordings for QZ01, XC01, HY01, and PK01;
   cache traces and q-star splits proven in the generic host.
2. **live-demo-acceptance.** The interactive live demo renders every lesson
   from an editable source with playback, selection, and the measured triple
   visible; `sw-checklist` passes on the Rust host crates in
   `../demo-extensions` (or under `crates/` here if the host is built here).
3. **pocket-helper-demo.** The value demonstration: the packed MicroMoE
   answering arithmetic, sequence, and MLPL prompts from the browser with the
   routing, Engram, and cache panels live.

Exit: every recorded lesson renders in the generic host without lesson-
specific Rust, and the pocket helper runs end to end.

## Cross-cutting gates

- Every executable behavior starts with native mlplunit coverage; `just check`
  is the full pre-commit gate and grows with each lesson's demo and fixture
  freshness checks.
- Every `.mlpl` file has a module-purpose comment, every user function has a
  first-expression docstring, and canonical formatting is checked before commit
  and push with `scripts/check-mlpl-style`.
- Every lesson satisfies the visual and measurement contract above and adds a
  catalog entry naming its source, test, previews, recording, triple, and
  implementation form (`builtin`, `from-scratch`, or `both`).
- Every language or host gap gets a reproducer under `probes/`, a pinned
  mlplunit probe, a workaround, and an entry in the findings document in the
  same step it is met.
- Lessons are deterministic, bounded, standalone, and honest about which work
  runs in MLPL, in a builtin, or in a simulator.
- Sibling repositories remain read-only. Their work is written as a handoff.
- `sw-checklist` applies only to Rust code, if and when any is added.

## Non-goals

- A general-purpose chatbot or benchmark-competitive language model.
- Training on the 256 MB device; that device is an inference target.
- A second transformer implementation in Rust; sw-MLPL's model machinery is
  the implementation.
- Algorithm-specific rendering code in any host.
- Reverse interpreter execution; playback browses retained observations.
- Silent sampling or downsampling of observations.
- Modifying any sibling repository from a saga in this repository.
