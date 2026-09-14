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
[`sw-mlpl-findings.md`](../reference/sw-mlpl-findings.md). The first four findings were
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

The source discussion is retained in [`research.txt`](../research/research.txt) and the
Saga 2 review that reshaped the documentation in
[`research2.txt`](../research/research2.txt); the
questions about how experts specialize, how routing is decided, and how the
Engram table is sized are answered in
[`moe-engram-discussion.md`](../research/moe-engram-discussion.md).

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
only). Details are in the [capability ledger](../reference/sw-mlpl-blockers.md) and
[findings](../reference/sw-mlpl-findings.md).

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
handoff in [`cross-repo-handoffs.md`](../implementation/cross-repo-handoffs.md).

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

Every run appends one row to a results table (`docs/reference/results.md`) keyed by
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
5. **data-scale-sweep (DS01).** DN01 and MX01 trained at 120, 480, and 960
   examples under a fixed epoch budget, opt-in and outside the gate (minutes).
   The measured points are a committed fixture so the diagram (validation
   loss and per-family accuracy against data size, dense beside MoE) is
   regenerated without retraining. It answers whether data or epochs move the
   held-out columns: at 120 examples, longer training only memorizes.
6. **low-rank-delta-experts.** Experts as shared FFN plus `A_e B_e` deltas,
   allowing 16 to 32 experts at microscope scale; byte accounting per expert;
   quality comparison with full experts. Add a `shared` always-on expert
   count (DeepSeek-V3 layout) and compare shared only, routed only, and both;
   record router multiply-adds per token as a counted cost.
7. **moe-recordings-and-host-handoff.** MX01 and MX02 recordings pinned; the
   router mask, dispatch table, and specialization map proven in the generic
   host.

Exit: a learner can watch one token be routed, dispatched, and combined; the
specialization map is a checked artifact; MoE rows exist in the results table.

## Saga 3: resource budget and documentation restructure

Source: [`research2.txt`](../research/research2.txt), the user's review of the README
after Saga 2. Its diagnosis: the mechanisms are demonstrated, but the README
buries the findings under implementation detail, and the reader has no
physical sense of how small the models are or what an expert costs. This
saga runs before recurrence and Engram so the rest of the project speaks one
quantitative language: stored, resident, active, transferred, executed.

1. **resource-budget-microscope (RB01).** No training. Read the committed
   models' configurations and results and produce: stored versus active
   parameters and bytes by component; expert size statistics (count, min,
   mean, median, p90, max, total) even while experts are uniform;
   FP64/FP32/FP16/INT8/INT4 projected sizes; proportional storage-layout and
   top-k working-set diagrams; a capacity calculator (given d_model, expert
   width or rank, experts, top-k, dtype, cache experts, Engram slots and
   width, recurrences, produce total, shared, expert, resident, and active
   parameters and bytes plus storage-to-resident and resident-to-active
   ratios, with optional transfer-time estimates from a stated latency and
   bandwidth). Every number is labeled M (measured), D (derived), or E
   (estimate).
2. **generation-benchmark.** Measured, not derived: model-open time, cold
   and warm time to first token, prompt tokens per second, generation
   tokens per second, p50 and p95 token latency, expert loads per token, and
   peak memory where the interpreter exposes it, for DN01, MX01, MX02, and
   LD01, written to `docs/reference/` with the M/D/E legend. This is the
   vocabulary XC01 and HY01 reuse.
3. **documentation-hierarchy.** Restructure `docs/` into overview, results,
   concepts, experiments, implementation, and reference, with `docs/README.md`
   as the landing page and three reader journeys (understand the idea, see
   whether it works, modify or reproduce it). Move the existing documents
   into their places; every link is checked by the gate. Overview and
   concept pages read front to back; reference pages are lookups.
4. **readme-as-executive-summary.** Rewrite the README to two to four
   screens: what and why, status, what we have learned (five claims, each
   with its number), how small MicroMoE is, the architecture progression,
   the experiment index, and next steps. Everything else moves to the
   hierarchy. Claims are phrased as "progressively constructing a tiny model
   inspired by these techniques", never as the combined architecture already
   validated.
5. **findings-and-concept-pages.** `results/current-findings.md` as
   evidence, interpretation, and limitation per claim; `results/`
   resource-economics and quality pages; one thin laboratory report per
   experiment (question, change from the previous experiment, configuration,
   results, what we learned, what we did not prove, raw evidence); concept
   pages in the progression order dense, experts, top-k, sparse dispatch,
   recurrence, Engram, quantization, expert cache, heterogeneous execution,
   each with a small schematic and the four-sparsities table. Metrics are
   grouped as quality (exact match), model economics (parameters, bytes),
   runtime (evaluations, hits, latency), with loss, perplexity, entropy, KL,
   and balance as diagnostics.
6. **wiki-mirror.** Mirror the hierarchy in the peer wiki repository
   `../moe-microscope.wiki` (Home, Start Here, Learn, Results, Experiments,
   Internals, Reference, with a sidebar). The wiki is a navigation and
   presentation layer; the repository documents remain canonical. Mermaid
   diagrams must not use embedded HTML such as `<br>`; wiki-to-wiki links use
   the wiki page syntax and wiki-to-repository-file links use the full
   GitHub file URL; after pushing, verify in a browser that every Mermaid
   diagram renders without error and that both kinds of link resolve.

Exit: the README is an executive summary; every existing document has a
home in the hierarchy and every link resolves; RB01 and the generation
benchmark give measured resource and latency numbers with M/D/E labels;
the wiki mirrors the hierarchy with verified diagrams and links.

## Saga 4: campus docent v0

Source: [`research3.txt`](../research/research3.txt). The Software Wrighter
research campus (`../../software-wrighter-lab/sw-campus`, live at
<https://software-wrighter-lab.github.io/sw-campus/>) is a painted map you
walk into: campus, building, wing, exhibit, demo, every place with its own
URL. Each lobby gets an easel that features an exhibit and, when asked,
answers "where is", "what is", and "what should I see" with a tiny MoE that
runs in the browser. The docent is trained in batch here, in MLPL, and its
exported weights ship with the campus site; the easel is inference only.
This is the second training area of the microscope and the first one whose
domain is a real, evolving artifact.

Design decisions, taken from the research and kept here so the steps do not
relitigate them:

- The model predicts meaning, not facts: an intent (navigate, explain,
  recommend, story, status, unsupported) and a destination distribution over
  places. Work-in-progress is catalog text: each place carries a maturity
  level (finished, working, early, planned) and a canned status sentence
  that the status intent selects, so the docent can say which exhibits are
  finished, somewhat working, very early, or planned.
  The campus catalog remains the authority for titles, summaries, URLs,
  breadcrumbs, and status, so a stale model can never invent an exhibit.
- Docents tell stories, and the stories are canned. Every place (campus,
  building, wing, exhibit) may carry pre-written stories in its docent block:
  an id, a title, the text, the concepts it touches, and a kind (arrival,
  feature, detail, anecdote). The model never generates story text; it only
  decides that a story is wanted (the story intent, or a concept the visitor
  asked about) and which concepts fit. A deterministic policy over the
  catalog and the docent's local context picks the story: prefer an untold
  story for the current place, then an untold story for the predicted
  destination or concept; volunteer an arrival story once when the visitor
  enters a place; never repeat a told story unless asked ("tell me that
  again"); offer "another story?" when untold ones remain. Told stories live
  in the docent context and can be cleared.
- The corpus is derived from the catalog. Each place carries a reviewable
  docent block (aliases, concepts, example queries); a deterministic MLPL
  generator expands it into a small, inspectable training set (a few hundred
  examples) with navigation, recommendation, deliberately ambiguous, and
  out-of-domain questions. Snapshot A holds three semantically distinct
  destinations that exist today: the IBM 1130 demo, the APL demo, and the
  RCA 1802 demo, plus the Computational Sciences Institute, its machine
  learning wing, and the MoE Microscope exhibit marked early, so the docent
  can direct visitors to this repository's live demo once it is published and
  say honestly until then that it is planned. The 1442 card reader and its
  radio demo are excluded on purpose; they are v1's new-knowledge event.
- Input is hashed word and bigram features pooled into an embedding, not the
  language lesson's character vocabulary: no tokenizer file, bounded
  vocabulary, graceful on unseen names. A later lesson compares it with a
  token vocabulary.
- Architecture near existing MicroMoE dimensions: embedding 24 to 48, router
  to 4 or 8 experts, rank-4 delta experts as in LD01, top-1 first, two heads.
  Tens of thousands of parameters at most; INT8 tens of kilobytes.
- Experts are not assigned subjects. Train, measure the routing distribution
  per destination and per concept, and annotate what each expert appears to
  have learned; the "why this?" panel shows the router's choice and signals.
- Training is a batch process. `just docent` trains snapshot A natively,
  deterministic and gate-checked like every other lesson, and writes the
  weights, labels, manifest, and metrics under `fixtures/campus/`. A catalog
  change means: regenerate the corpus, rerun the recipe, commit the export,
  bump the manifest version. The campus site never trains.
- Browser execution is MLPL itself. sw-MLPL's `mlpl-wasm` crate runs the same
  evaluator, Model DSL, autograd, and `train` loop as the terminal REPL; the
  proven way to reach it from a page is `../demo-abstract-algebra`'s
  `learn/runtime.js` bridge, which loads the published playground in a hidden
  same-origin iframe and calls its `WasmSession` (blocker B7 there asks
  upstream for a headless `--target web` build of `mlpl-wasm` alone). That
  bridge is adapted, not rewritten; no Rust model code is written for the
  docent, so `sw-checklist` scope is unchanged. The page loads the exported
  weights and answers queries; it does not need to train.
- Live training in the page is an opt-in lesson mode with a budget, not the
  product path. Its value is educational: watching accuracy and expert
  utilization move over data a visitor can read in full, and the v1
  demonstration of teaching a stale model one new exhibit with a few epochs
  from the shipped weights. It is kept only if measured to fit the budget
  (at most one second per epoch and ten seconds for a full train through the
  WASM session); otherwise the page keeps the recorded batch run for replay
  and the short fine-tune, and drops full live training.
- Provenance is first-class: every snapshot keeps its catalog, corpus,
  weights, manifest (model, version, catalog hash, experts, top-k, params,
  quantization), and metrics, so revisions can be compared.
- The visualization contract holds: what/why/how diagrams for the corpus
  generator, the feature hashing, the router, the specialization map, and
  the export; memory, speed, and quality measured for every lesson, plus the
  docent's own metrics (model, corpus, catalog, and WASM bytes; browser load
  and inference latency; retraining time).

1. **campus-snapshot-a (CD00).** The catalog snapshot fixture
   (`fixtures/campus/snapshot-a.json`) in the sw-campus `Place` shape plus
   the docent block for the three destinations and their ancestors,
   including two or three canned stories per place, authored here and handed
   to sw-campus for adoption; the story-selection policy in MLPL with tests
   over scripted visits (arrival story once, no repeat unless asked, untold
   stories offered, cleared context starts over); the deterministic corpus generator in MLPL with
   its diagram (source place, transformation, resulting rows, labels); the
   split; the catalog-hash function. Locate the APL and RCA 1802 demo
   repositories and record their URLs, or mark them placeholder as sw-campus
   does. Tests over the generator, the label space, and the split.
2. **docent-dense (CD01).** Hashed-feature encoder, pooled embedding, one
   hidden layer, intent and destination heads (the story intent and
   story-eliciting queries such as "any anecdotes about the 1130?" and "tell
   me that again" are part of the corpus), masked losses; the flat
   classifier baseline with its diagram and results row (intent accuracy,
   destination accuracy, top-3, params, bytes, ms per query).
3. **recording-replay-page.** The first live demo of this repository,
   published from GitHub Pages under `learn/` and linked from the README: a
   static page that loads the pinned recordings (DN01, MX01, MX02) and steps
   through them frame by frame (router logits, probabilities, mask, gate,
   per-expert loads, balance, loss), drawn from the recorded values with the
   names the generic host uses; previous, next, play, frame index; the SD01
   dispatch and combine as a sequence on one recorded batch (tokens grouped
   per expert, the expert run once, the scatter back, the exact sum) beside
   the dense-masked path; a gate check that the site builds from committed
   fixtures only; a browser verification record (every page loads, every
   recording steps to its last frame) in `docs/results/live-demo.md`.
   Every page carries the standard footer of the sw-embed web demos: the
   license and copyright from `LICENSE` and `COPYRIGHT`, links to the
   campus (`https://software-wrighter-lab.github.io/sw-campus/`), the blog post
   (`https://blog.softwarewrighter.com/2026/09/13/saw-building-a-tiny-mixture-of-experts/`), the wiki, Discord
   (`https://discord.com/invite/Ctzk5uHggZ`), and the GitHub repository,
   then the build info: host, short commit SHA, and UTC timestamp. There is
   no compile step, so the Pages workflow and the local serve recipe write
   `learn/build-info.json` at publish time and the page renders it. The
   README links the live demo and the blog post (the about page until then).
   The recordings hold per-epoch summaries, so the routing and dispatch
   walkthroughs come from a small export script that records one trained
   window stage by stage (logits, probabilities, mask, gate, per-expert
   groups, expert outputs, scatter, exact sum) into a pinned fixture.
4. **matcher-baseline (MB01).** The deterministic alias-and-concept matcher
   the campus mockup uses, written in MLPL over the same snapshot (alias
   substring hits ranked above concept token overlap, the four intents by
   keyword, unsupported when nothing matches), scored on the validation rows
   and on the paraphrase set with the same metrics as CD01; its row is the
   yardstick every docent must beat by the usefulness-bar margin.
5. **docent-word-vectors (CD01b).** In-domain semantics without external
   data: assemble `fixtures/campus/docs-a.txt` once from the campus's own
   text (story and status sentences, taglines, summaries, and the READMEs of
   the linked exhibit repositories, fetched by a script and committed);
   train word vectors on it in MLPL (co-occurrence counts, positive PMI, a
   low-rank factorization by power iteration, deterministic); store them in
   an Engram-style hashed table (`ngram_hash` addressing over words) that
   replaces the docent's random embedding rows and is fine-tuned; measure
   paraphrase accuracy against CD01 and against the stronger MB01 matcher
   that reads the same text; diagrams of the co-occurrence matrix, the
   nearest neighbours of a few words, and the table. This is the fair way
   for a model to earn a margin: same text for both sides.
6. **docent-moe (CD02, CD03).** The same encoder behind a router over 4 and
   8 rank-4 delta experts, top-1, balance term; the routing and
   specialization map per destination and per concept, expert annotations
   derived from measured distributions, entropy and balance, and the
   ambiguous-query panel (top-2 comparison, CD04) as a recorded lesson.
7. **docent-batch-export.** The `just docent` recipe: native batch
   training of the chosen configuration, the packed weights, labels, and
   manifest written by MLPL (`write_atomic`, `to_json`), INT8 projection with
   measured file sizes, the recorded training run for replay, and an MLPL
   inference twin that reloads the export and asserts parity with the trained
   model on every corpus row. The gate checks the export against the pinned
   fixture the way it checks every other lesson.
8. **docent-in-browser (CD05).** The docent page under `learn/`, inference
   first: the adapted iframe bridge loads the exported weights (inlined into
   the program, since the WASM surface has no filesystem sandbox), answers
   queries with the "why this?" panel, replays the recorded batch run; measured
   browser load and per-query latency. Then the budgeted live-training probe:
   time per epoch and for a full train through the WASM session, recorded as
   the CD06 browser benchmark row, deciding whether the "teach one epoch" and
   "teach a new exhibit" controls stay on the page. Published on GitHub Pages
   from this repository.
9. **easel-handoff.** The work order for sw-campus: the easel component
   (passive featured exhibit, interactive docent), loading the exported
   model, catalog-hash comparison with a stale badge, the local
   `DocentContext` (current place, recent places, interests, recent
   queries, told stories) in IndexedDB, the arrival-story volunteer with
   the story policy, and the link back to the microscope; recordings pinned
   for the generic host.

Usefulness bar, measured by steps 1 to 6 before any integration:

- destination exact match on held-out authored questions at or above 0.9
  across the three destinations, and intent accuracy at or above 0.9
  including the unsupported class;
- ambiguous questions return a ranked recommendation, not a wrong single
  answer;
- story policy tests pass on scripted visits (arrival story once, no repeat
  unless asked, another offered while untold ones remain, cleared context
  starts over);
- model at or under 30 KB at INT8 with a manifest naming the catalog
  revision; per-query latency under 50 ms in the browser (step 5);
- value over a deterministic matcher, measured: on the held-out paraphrase
  set (`fixtures/campus/paraphrases-a.json`, phrasings that contain no alias
  verbatim plus off-topic questions, never trained on) the docent's
  destination accuracy exceeds the stronger of the two MB01 matchers (the
  mockup's alias-and-concept matcher, and a matcher over all the catalog
  text the model may also read) by at least 20 points, its intent
  accuracy by at least 20 points, and its unsupported recall is at least
  0.8; all numbers sit side by side in the docent results table. If the
  margin is not met, the campus keeps its matcher and Saga 5 does not
  start.

Milestone, first publication: the replay page (step 3) is live on GitHub
Pages and linked from the README, the campus's Computational Sciences
Institute lobby features it (a handoff the campus repository applies), and
a blog post describes both honestly, with the campus docent still gated or
labelled as the keyword matcher. This milestone does not wait for the
trained docent; the docent joins the campus only when the usefulness bar
with its margin over the matcher is met.

Exit: the usefulness bar is met and recorded in the results table; a
batch-trained tiny MoE, loaded in the page, navigates among the three
destinations with explainable routing and catalog-backed responses, tells
the right canned story once and another on request, and the live-training
budget has a measured answer;
dense, four-expert, and eight-expert rows sit in the results table with the
docent metrics; snapshot A is preserved with its provenance; sw-campus has an
implementation-ready easel handoff.

## Saga 5: campus docent live in the campus UI

The trained docent replaces the mockup's keyword matcher in the campus
site, and that replacement is verified on the live page, not assumed. The
campus repository (`../../software-wrighter-lab/sw-campus`) owns its easel,
drawer, and the `Predictor` trait whose keyword implementation ships first;
its own plan reserves a model-bridge step for the weights. This saga owns
everything that repository consumes and the acceptance that proves the
live site answers from weights.

1. **export-contract.** Freeze the export written by `just docent`: the
   file set under `fixtures/campus/model-a/` (weights, labels, manifest,
   metrics), the manifest fields (model, version, trained-from commit,
   catalog hash, experts, top-k, params, quantization), and a validator
   (`scripts/check-docent-export`) the campus repository can run on a copy;
   documented in `docs/implementation/docent-export.md` with the update
   procedure (edit the docent block, regenerate, retrain, export, copy).
2. **bridge-module.** A standalone browser module (`learn/docent-bridge.js`)
   that loads the playground session lazily on first use, inlines the
   exported program, and exposes `predict(query)` returning the intent,
   the destination distribution, and the router's experts; a parity page
   that runs the whole corpus through it and compares with the export's
   predictions; measured load and per-query latency. Published from this
   repository's Pages so the campus can load or vendor it unchanged.
3. **campus-model-bridge-handoff.** The work order for the campus
   repository's model-bridge step: load the export, show the edition line
   with model version and catalog hash, the stale badge on mismatch, "Why
   this?" with the router's experts, the fallback to the keyword matcher
   when the session cannot load; acceptance criteria stated as the live
   checks of step 4. The campus agent does the wiring; nothing is changed
   from here.
4. **live-acceptance.** After the campus deploys: verify in a browser
   against the live page that the edition line names the model version and
   catalog hash; that thirty scripted queries (navigate, explain, recommend,
   story, status, ambiguous, unsupported) answer with the same intent and
   destination as the export's parity predictions; that the fallback and
   stale badge behave; and that per-query latency and playground load time
   are within the CD05 budgets. Results recorded in
   `docs/results/docent-live.md` and the docent results table as CD09.

Exit: the live campus site answers from the trained weights, proven by the
step 4 record; the keyword matcher remains only as the documented fallback.

## Saga 6: campus docent v1

Starts when the campus adds the IBM 1442 card read punch and its radio demo
(snapshot B). If that content is not yet published, the step authors
snapshot B as a handoff fixture first and reruns when the real content lands.

1. **stale-model (CD06).** Ask model A the snapshot-B questions before any
   retraining; the runtime catalog reports "no sufficiently specific
   destination" rather than inventing one; the version-mismatch badge.
2. **retraining (CD07).** Incremental retraining from model A versus full
   retraining on snapshot B, both as batch runs, with the short fine-tune
   also shown live in the page if the CD06 budget allowed it: destination scores before and after, expert
   maps before and after (did a new specialization emerge or did an existing
   expert absorb the material), old-domain and new-domain accuracy,
   forgetting measured per destination, training time.
3. **quantized-docent (CD08).** INT8 and INT4 docent quality against f64 on
   both snapshots, bytes, and browser latency.
4. **revision-compare.** The "compare revisions A to B" page and the sw-campus
   handoff update.

Exit: the before/after study is a recorded lesson with rows and diagrams,
and the campus easel can show which revision its docent knows.

## Saga 7: recurrence and Engram

1. **recurrent-block (RC01).** Shared block applied `R` times with recorded
   state per recurrence, accuracy versus `R`, and the deep-supervision loss.
2. **recurrent-moe (RM01).** Routing over reasoning time: the expert sequence
   per token per recurrence, drawn as a strip, and the change-of-expert
   statistic.
3. **engram-from-scratch (EG01).** `ngram_hash` addressing, `gather_rows`
   retrieval, projection, and a learned gate written in MLPL; parity check
   against the `engram` builtin; gate magnitude, collision, and nonzero-row
   observations; Engram table diagram with bytes; a table-size sweep (1,024
   down to 16 slots) plotting collisions, gate magnitude, and prose accuracy.
4. **recurrent-moe-engram (RE01).** All three sparsities together and the
   ablation table filled for the seven research combinations.
5. **live-demo-foundation.** With DN01, MX02, and RM01 recordings pinned,
   hand off the interactive live demo: MLPL web framework pages that submit
   an editable lesson to `mlpl-serve`, stream frames, and drive the generic
   Yew timeline.

Exit: the ablation matrix rows through RE01 exist with diagrams and triples;
the live demo has a written, implementation-ready handoff.

## Saga 8: distillation

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

## Saga 9: quantization, packed format, and expert cache

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

6. **kv-cache-compression (KV01).** The decode-phase cache under
   pressure: `gen_state` sizes per token at f64, INT8, and INT4 values,
   eviction of the oldest and lowest-attention entries, and the quality
   cost of each on the generation benchmark prompts; bytes per token and
   tokens per second beside exact match, with the cache drawn as it fills
   and is compressed.
Exit: the same model runs from a packed file through a capacity-limited cache
with a checked curve of hit rate and bytes per token versus capacity.

## Saga 10: hybrid execution and the embedded budget

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

## Saga 11: interactive microscope host, complete

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

## Saga 12: configuration frontier

After the mechanisms exist, compare configurations on the dimensions the
results table already records and produce a size, speed, quality frontier.

1. **experiment-harness.** One MLPL harness that takes a configuration
   record (experts, top-k, shared always-on experts, expert width or delta
   rank, recurrence depth, Engram slots, data size, epochs) and produces a
   results row and a recording, so a sweep is a list of records.
2. **expert-count-and-k sweep.** 4, 8, 16, 32 experts with k in 1, 2, 4
   and 0, 1, 2 shared experts; quality against active parameters and
   expert evaluations per token.
3. **memory-and-depth sweep.** Engram slots and recurrence depth against
   quality and bytes.
4. **frontier report.** Pareto front of the sweep on (bytes per token,
   expert evaluations per token, validation loss, per-family accuracy),
   drawn with `pareto_front`, with three named picks: smallest, fastest,
   best, each with a packed size and a measured decode cost.

Exit: a frontier diagram whose every point is a results row and a
recording.

## Saga 13: CUDA system and CPU-resident expert weights

Today every lesson runs in the f64 CPU interpreter; `device("mlx")` and the
CUDA backend in sw-MLPL are unused here. This saga moves the lab-scale runs
to a CUDA machine and reproduces the FreeToken split: non-expert weights on
the GPU, expert weights in host RAM, experts either transferred into a GPU
cache or executed on the CPU.

1. **backend-probes.** The MoE loss under `device("cuda") { }` and
   `device("mlx") { }`: what traces, what is forward-only, parity with CPU,
   and the measured speedup at lab scale; findings filed upstream as before.
2. **lab-scale-training.** DN01, MX01, and MX02 at lab scale (vocabulary
   1,024 to 4,096, `d_model` 128 to 256, 32 to 64 experts) on the GPU with
   the same source; results rows with GPU timings.
3. **host-resident-experts.** Expert weights kept in host RAM and moved into
   a bounded GPU expert cache on demand (the XC01 simulator made real);
   measured bytes transferred, hit rate, and VRAM in use against cache
   capacity.
4. **cpu-expert-execution.** Missing experts executed on the CPU while
   resident ones run on the GPU, summed exactly (the HY01 q-star split made
   real); measured tokens per second against the transfer-only policy and
   against all-GPU, with VRAM held below a chosen ceiling.
5. **vram-budget-report.** The smallest VRAM that serves each frontier pick
   from Saga 11 at a stated tokens-per-second, with the CPU/GPU split that
   achieves it.

Exit: a lab-scale MoE runs on CUDA with expert weights in host RAM at a
documented VRAM ceiling, and the sw-MLPL backend findings are filed.

## Saga 14: findings, recommendations, and future work

The closing document, `docs/report.md`, written from the results table,
the recordings, the findings ledger, and the frontier: what was built, what
each mechanism measurably bought at each scale, the language findings and
which were fixed upstream, recommendations for anyone building a small MoE
with Engram on constrained hardware, and a ranked list of future
improvements with the evidence that motivates each. Every claim cites a
results row, a diagram, or a finding.

Exit: the report is complete, linked from the README, and reviewed against
the results table for every number it states.

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
