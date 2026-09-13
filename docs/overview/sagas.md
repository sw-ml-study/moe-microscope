# Saga queue

Only one saga is active at a time. Later sagas are initialized after the
preceding saga is completed and archived. Newly discovered work is inserted
with Agentrail commands, never by editing append-only `.agentrail/` state.
The full step prompts and exit criteria are in [`plan.md`](plan.md).

The mandatory checklist in `AGENTS.md` applies to every step: focused tests,
`just check`, affected documentation and catalog entries, `.gitignore` and
tracked-file audit, named-file staging, a detailed commit on `main`,
Agentrail completion metadata, and a verified `git push origin main`.

## Active: `resource-budget-and-documentation` (Saga 3)

Purpose: give the project one quantitative vocabulary (stored, resident,
active, transferred, executed), measure generation latency, and restructure
the documentation so the README is an executive summary and the wiki mirrors
the hierarchy. Source: `research2.txt`.

1. `resource-budget-microscope` - RB01: stored versus active bytes by
   component, expert size statistics, dtype projections, proportional
   diagrams, capacity calculator, M/D/E labels.
2. `generation-benchmark` - measured time to first token, tokens per
   second, tail latency, expert loads per token; opt-in with a committed
   fixture.
3. `documentation-hierarchy` - overview, results, concepts, experiments,
   implementation, reference; `docs/README.md` with three reader journeys.
4. `readme-as-executive-summary` - the README rewritten to a few screens.
5. `findings-and-concept-pages` - current findings, resource economics,
   quality, experiment reports, concept pages with schematics.
6. `wiki-mirror` - the peer wiki mirrors the hierarchy with verified Mermaid
   diagrams and links.

Step 2 status: complete. GB01 measures build, cold and warm time to first
token, prefill and generation throughput, and p50/p95/max token latency for
the four models on freshly built weights; committed fixture with the binary
label, rendered `docs/reference/generation-benchmark.md`, M/D/E legend;
opt-in measurement, gate-time validation.

Step 1 status: complete. `lib/budget.mlpl` calculator pinned to every
measured parameter count; RB01 generates `docs/results/resource-economics.md` (sizes,
expert cost and statistics, stored versus active, dtype projections,
residency scenarios, transfer estimates, M/D/E labels) and the proportional
storage diagram, both freshness-checked by the gate.

## Completed: `mixture-of-experts-from-scratch` (Saga 2)

Purpose: the router, top-k masks, dense-masked training with load balance,
sparse dispatch with parity, top-2 and the specialization map, low-rank delta
experts, and the MoE recordings for the generic host.

1. `router-and-topk` - router linear, softmax, top-1 mask inside the loss,
   Switch-style gate, dispatch table; observations and routing diagrams.
2. `dense-masked-training` - MX01 trained with every expert evaluated and
   masked gates; load-balance loss, router entropy, per-expert load; triple
   and results row.
3. `sparse-dispatch-inference` - forward-only sparse dispatch with parity
   against the dense-masked path; expert evaluations and bytes per token.
4. `top2-and-specialization-map` - MX02 top-2 routing, the family-by-expert
   heatmap, and the specialization score.
5. `data-scale-sweep` - DS01: DN01 and MX01 at 120, 480, and 960 examples
   under a fixed epoch budget, opt-in (minutes); measured points committed as
   a fixture so the diagram regenerates without retraining; answers whether
   data or epochs move the held-out columns.
6. `low-rank-delta-experts` - shared FFN plus low-rank deltas for 16 to 32
   experts; byte accounting; quality comparison.
7. `moe-recordings-and-host-handoff` - MX01 and MX02 recorded over live SSE,
   pinned, and handed to the generic host.

Step 7 status: complete. MX01 and MX02 recorded over live SSE (MX02 made
tolerant of the sandbox-less server surface), the recording scripts
generalized over `scripts/recordings.conf`, the index re-pinned with three
fixtures, the host handoff extended. Saga 2 is complete; Saga 3 (resource
budget and documentation restructure) is next.

Step 6 status: complete. LD01 low-rank delta experts: sixteen rank-4
experts packed in two matrices (exact parity with a per-expert loop, tested),
a shared always-on FFN, deltas-only variant, comparison against DN01 and
MX01 read from the results table, router multiply-adds per token recorded,
family map over sixteen experts, two diagrams, two results rows.

Step 5 status: complete. DS01 data-scale sweep: eight committed points
(dense and MoE at 120, 480, 960 examples for 200 epochs, plus 120 for 400
epochs), index with hashes, eight results rows, and a diagram redrawn from
the points in the gate. Data cuts validation loss by two thirds and solves
prose held-out; doubling epochs at 120 examples makes it worse.

Step 4 status: complete. MX02 top-2 (`demos/moe_top2.mlpl`): two-argmax
mask that traces, gate renormalized by a ones matmul (F18 panic and F11
avoided), family-by-expert maps for MX01 (from its committed fixture) and
MX02 with specialization scores 0.61 and 0.42, a cost comparison diagram,
and the MX02 results row. Future sagas 8 to 10 added at the user's request:
configuration frontier, CUDA with host-resident experts, final report.

Step 3 status: complete. SD01 sparse dispatch (`demos/dispatch_microscope.mlpl`):
compress, per-expert sub-batches, selection-matrix scatter; exact parity
(max difference 0) over 120 windows; 3,360 versus 13,440 row evaluations;
the interpreter's sparse path measured slower per window and stated so;
diagram and results row.

Step 2 status: complete. MX01 trained dense-masked with the balance term
(`demos/moe_baseline.mlpl`): loads, entropy, balance, family-by-expert
counts, loss and accuracy recorded; two diagrams; results row beside DN01;
padded greedy decoding added to `lib/dense.mlpl` because the mixture block
is fixed to the window length.

Step 1 status: complete. `lib/moe.mlpl` (router logits, probabilities,
top-1 and top-k masks, Switch and renormalized gates, load, entropy, balance
loss) with five tests; the MX01 routing microscope and its diagram.

## Completed: `moe-microscope-foundation` (Saga 1)

Purpose: repository foundation, executable capability probes, the synthetic
domain with exact-match evaluation, the dense baseline lesson DN01, and the
in-repo teacher fixture that later distillation lessons consume.

1. `foundation-contract` - Agentrail briefing, licensing, README, plan, saga
   queue, architecture, capability ledger, sibling handoffs, and a
   documentation-only `just check` gate.
2. `capability-probes` - native mlplunit probes for multi-model `adam`,
   gradients through repeated application, masked-softmax gates,
   `gather_rows` differentiability, KL availability, and per-token loop cost;
   ledger update; smallest observation facade over `emit_frame`.
3. `synthetic-domain-and-evaluation` - seeded generators for arithmetic,
   sequence transforms, tiny MLPL expressions, and templated prose with task
   tags and splits; exact-match oracles; results-table writer; data-structure
   diagrams.
4. `dense-baseline-lesson` - DN01 with recorded observations, annotated step
   strip, memory/speed/quality triple, results row, and freshness-checked
   preview.
5. `dn01-recording-and-host-handoff` - DN01 recorded over live SSE under the
   peer schema, pinned by hash; `emit_frame` inside `train` probed on the
   connect path; `../demo-extensions` handoff written.
6. `in-repo-teacher-fixture` - the larger dense teacher trained once, its
   next-token distributions exported as a bounded, hash-checked fixture.

Step 7 status: complete. MX01 and MX02 recorded over live SSE (MX02 made
tolerant of the sandbox-less server surface), the recording scripts
generalized over `scripts/recordings.conf`, the index re-pinned with three
fixtures, the host handoff extended. Saga 2 is complete; Saga 3 (resource
budget and documentation restructure) is next.

Step 6 status: complete. TE01 (`demos/teacher.mlpl`) trained once and
exported to `fixtures/teacher/teacher-v0.json` with a hash-pinned index, a
schema document for the Saga 4 external exporter, a fixture diagram, a
results row, and a no-training gate check. Saga 1 is complete; Saga 2
(mixture of experts from scratch) is next.

Step 7 status: complete. MX01 and MX02 recorded over live SSE (MX02 made
tolerant of the sandbox-less server surface), the recording scripts
generalized over `scripts/recordings.conf`, the index re-pinned with three
fixtures, the host handoff extended. Saga 2 is complete; Saga 3 (resource
budget and documentation restructure) is next.

Step 6 status: complete. LD01 low-rank delta experts: sixteen rank-4
experts packed in two matrices (exact parity with a per-expert loop, tested),
a shared always-on FFN, deltas-only variant, comparison against DN01 and
MX01 read from the results table, router multiply-adds per token recorded,
family map over sixteen experts, two diagrams, two results rows.

Step 5 status: complete. DN01 recorded over live `mlpl-serve` SSE into
`fixtures/recordings/dense-baseline-run-v0.json` with a hash-pinned index;
`scripts/bundle-program` works around the server's missing source provider
(F16); loop streaming proven; `docs/implementation/host-handoff.md` written for
`../demo-extensions`; D1 and F10 verified fixed upstream.

Step 7 status: complete. MX01 and MX02 recorded over live SSE (MX02 made
tolerant of the sandbox-less server surface), the recording scripts
generalized over `scripts/recordings.conf`, the index re-pinned with three
fixtures, the host handoff extended. Saga 2 is complete; Saga 3 (resource
budget and documentation restructure) is next.

Step 6 status: complete. LD01 low-rank delta experts: sixteen rank-4
experts packed in two matrices (exact parity with a per-expert loop, tested),
a shared always-on FFN, deltas-only variant, comparison against DN01 and
MX01 read from the results table, router multiply-adds per token recorded,
family map over sixteen experts, two diagrams, two results rows.

Step 5 status: complete. DS01 data-scale sweep: eight committed points
(dense and MoE at 120, 480, 960 examples for 200 epochs, plus 120 for 400
epochs), index with hashes, eight results rows, and a diagram redrawn from
the points in the gate. Data cuts validation loss by two thirds and solves
prose held-out; doubling epochs at 120 examples makes it worse.

Step 4 status: complete. DN01 (`demos/dense_baseline.mlpl`) with
`lib/dense.mlpl` and `lib/svg.mlpl`; two annotated diagrams; the first
results row; catalog entry; seven more findings (F9 to F15) filed with
reproducers, two of which (F5, F6) upstream fixed the same evening.

Step 7 status: complete. MX01 and MX02 recorded over live SSE (MX02 made
tolerant of the sandbox-less server surface), the recording scripts
generalized over `scripts/recordings.conf`, the index re-pinned with three
fixtures, the host handoff extended. Saga 2 is complete; Saga 3 (resource
budget and documentation restructure) is next.

Step 6 status: complete. LD01 low-rank delta experts: sixteen rank-4
experts packed in two matrices (exact parity with a per-expert loop, tested),
a shared always-on FFN, deltas-only variant, comparison against DN01 and
MX01 read from the results table, router multiply-adds per token recorded,
family map over sixteen experts, two diagrams, two results rows.

Step 5 status: complete. DS01 data-scale sweep: eight committed points
(dense and MoE at 120, 480, 960 examples for 200 epochs, plus 120 for 400
epochs), index with hashes, eight results rows, and a diagram redrawn from
the points in the gate. Data cuts validation loss by two thirds and solves
prose held-out; doubling epochs at 120 examples makes it worse.

Step 4 status: complete. MX02 top-2 (`demos/moe_top2.mlpl`): two-argmax
mask that traces, gate renormalized by a ones matmul (F18 panic and F11
avoided), family-by-expert maps for MX01 (from its committed fixture) and
MX02 with specialization scores 0.61 and 0.42, a cost comparison diagram,
and the MX02 results row. Future sagas 8 to 10 added at the user's request:
configuration frontier, CUDA with host-resident experts, final report.

Step 3 status: complete. `lib/domain.mlpl`, `lib/evaluate.mlpl`, and
`lib/results.mlpl` with 28 native tests; the 120-example mixture fixture;
the DM01 domain microscope with three annotated diagrams (window, tags,
split) freshness-checked by `just check`; catalog entry DM01.

Step 7 status: complete. MX01 and MX02 recorded over live SSE (MX02 made
tolerant of the sandbox-less server surface), the recording scripts
generalized over `scripts/recordings.conf`, the index re-pinned with three
fixtures, the host handoff extended. Saga 2 is complete; Saga 3 (resource
budget and documentation restructure) is next.

Step 6 status: complete. LD01 low-rank delta experts: sixteen rank-4
experts packed in two matrices (exact parity with a per-expert loop, tested),
a shared always-on FFN, deltas-only variant, comparison against DN01 and
MX01 read from the results table, router multiply-adds per token recorded,
family map over sixteen experts, two diagrams, two results rows.

Step 5 status: complete. DS01 data-scale sweep: eight committed points
(dense and MoE at 120, 480, 960 examples for 200 epochs, plus 120 for 400
epochs), index with hashes, eight results rows, and a diagram redrawn from
the points in the gate. Data cuts validation loss by two thirds and solves
prose held-out; doubling epochs at 120 examples makes it worse.

Step 4 status: complete. MX02 top-2 (`demos/moe_top2.mlpl`): two-argmax
mask that traces, gate renormalized by a ones matmul (F18 panic and F11
avoided), family-by-expert maps for MX01 (from its committed fixture) and
MX02 with specialization scores 0.61 and 0.42, a cost comparison diagram,
and the MX02 results row. Future sagas 8 to 10 added at the user's request:
configuration frontier, CUDA with host-resident experts, final report.

Step 3 status: complete. SD01 sparse dispatch (`demos/dispatch_microscope.mlpl`):
compress, per-expert sub-batches, selection-matrix scatter; exact parity
(max difference 0) over 120 windows; 3,360 versus 13,440 row evaluations;
the interpreter's sparse path measured slower per window and stated so;
diagram and results row.

Step 2 status: complete. Sixteen native probes and five standalone
reproducers; F1 to F4 verified fixed upstream, F5 to F8 and D1 pinned and
queued upstream as `moe-microscope-followups`. See
[`sw-mlpl-findings.md`](../reference/sw-mlpl-findings.md).

Acceptance: `just check` passes from a clean checkout; the ledger classifies
every probed capability with executable evidence; DN01 satisfies the visual
and measurement contract and has a pinned recording; the teacher fixture is
checked in with its schema.

## Future

Every saga from here ends with a host step that pins its recordings and hands
them to the generic `../demo-extensions` microscope; see the visualization
track in [`plan.md`](plan.md).

- Saga 4 `recurrence-and-engram`: RC01, RM01, EG01 (both forms: from scratch
  and builtin, with parity), RE01, the seven-row ablation table, and the
  live-demo foundation handoff.
- Saga 5 `distillation`: token KD against the in-repo teacher, router warm
  start, expert-delta distillation, and the gated external-teacher export.
- Saga 6 `quantization-packing-and-cache`: INT8 and INT4 experts, the packed
  TinyMoE file, the LRU expert-cache simulator with capacity curves, and
  prefill double buffering.
- Saga 7 `hybrid-execution-and-embedded-budget`: bandwidth calibration, the
  q-star transfer/compute split, expert banks, and the 256 MB budget report.
- Saga 8 `interactive-microscope-host`: systems recordings, live-demo
  acceptance (the only `sw-checklist` scope), and the pocket-helper demo.
- Saga 9 `configuration-frontier`: one harness over configuration records;
  sweeps of expert count, top-k, shared always-on experts, Engram slots, and
  recurrence depth; a Pareto frontier with smallest, fastest, and best picks.
- Saga 10 `cuda-and-host-resident-experts`: backend probes for CUDA and MLX,
  lab-scale training on the GPU, expert weights in host RAM with a bounded
  GPU cache, CPU execution of missing experts, and a VRAM-budget report.
- Saga 11 `findings-and-recommendations`: `docs/report.md` with findings,
  recommendations, and ranked future improvements, every claim cited.
