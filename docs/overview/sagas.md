# Saga queue

Only one saga is active at a time. Later sagas are initialized after the
preceding saga is completed and archived. Newly discovered work is inserted
with Agentrail commands, never by editing append-only `.agentrail/` state.
The full step prompts and exit criteria are in [`plan.md`](plan.md).

The mandatory checklist in `AGENTS.md` applies to every step: focused tests,
`just check`, affected documentation and catalog entries, `.gitignore` and
tracked-file audit, named-file staging, a detailed commit on `main`,
Agentrail completion metadata, and a verified `git push origin main`.

## Active: `animated-data-flow-landscape` (Saga 6)

Purpose: a very visual explanation of the combined techniques that
eschews tables for movement of data: tokens flow through the embedding,
attention, the Engram lookup, the router, the experts, the recurrence
loop, and the head on one landscape wider than the screen, the camera
panning along it roughly chronologically with parallel work called out;
every moving value read from a pinned recording. Started 2026-09-15 by
the user's decision, ahead of the routed docent.

1. `landscape-storyboard` - done: [`landscape-storyboard.md`](landscape-storyboard.md):
   eight scenes in forward-pass order over two example windows (the
   walkthrough's `17+25=|42.` and the lessons' `2+3=|5.`, with a labeled
   seam), the recording and observation names each reads, the chip
   vocabulary and camera path, five call-outs each tied to a recorded
   value or a cited mechanism property, honest placeholders for the
   cache, decode-cache compression, and multi-token prediction, and a
   per-scene acceptance rule the verifier reads back from the fixture.
2. `landscape-player` - a generic panning stage under `learn/` that
   renders a scene list from a scenes file over the pinned recordings,
   with `?verify=1`.
3. `landscape-scenes` - the scenes file from the storyboard, deployed and
   verified.
4. `landscape-acceptance` - browser verification of every scene against
   its recording, README, docs, wiki, campus handoff, saga close.

## Completed: `recurrence-and-engram` (Saga 5)

Purpose: parameter sparsity and memory-lookup sparsity, measured: one block
applied R times with deep supervision (RC01), routing over reasoning time
(RM01), the Engram table from scratch with parity against the sw-MLPL
builtin and a slot-count sweep (EG01), all three sparsities together with
the seven-row ablation table (RE01), and the recordings, live demo, and
handoffs (saga close). Started 2026-09-14 ahead of the remaining docent
work by the user's decision; completed 2026-09-15.

Outcome: recurrence buys quality per parameter (RM01 at R=3 has the
lowest 120-example validation loss in the table, 3.42) and the router
re-decides at every recurrence; the Engram table is the builtin's function
to the bit and, at 90 training windows, memorization capacity alone and in
composition (RE01 4.76 at training loss 0.006). Seven recordings replay in
the live demo; findings F19, F20, and F21 were fixed upstream during the
saga and verified; F22, F23, and F24 stay open with probes.

1. `recurrent-block` - RC01: one shared block applied R times, deep
   supervision, accuracy against R at fixed parameters.

   Status: complete. At 3,812 parameters, R=2 with deep supervision reaches
   validation loss 3.45 (DN01 3.79), R=3 gives the first held-out MLPL
   answers of a dense model, R=4 is worse (4.22); every model is best when
   stopped after one recurrence (3.29 for R=2), so the gain is a
   regularization effect of scoring every state, not refinement. Rows
   RC01@1..4, three diagrams, four tests, the R=4 recording pinned and
   replayed in the live demo. F22 found on the way: Adam state is keyed by
   name and outlives a re-created model, so each R now trains in its own
   process; a follow-up step re-measures LD01r and CD01bf.
2. `optimizer-state-isolation` - re-measure the lessons that trained two
   variants in one process (LD01, CD01b) with one run per process; update
   their reports and rows.

   Status: complete. Audit: LD01 already used distinct model names for its
   second variant (fresh names get fresh Adam state), so LD01r stands; DS01
   runs one point per process; CD01b re-ran its frozen variant in its own
   process (paraphrase 0.259 to 0.204, held-out destination 0.369 to 0.407)
   and now trains one variant per process with a drawer composing the table
   diagram. AGENTS.md states the rule: one training run per process,
   training loops at top level.
3. `recurrent-moe` - done: RM01, the MX01 block applied R times with the
   router run at every recurrence and the balance term per recurrence.
   Tokens change expert between consecutive recurrences (share 0.464 at
   R=2, 0.381 at R=3); the R=3 mixture reaches validation loss 3.42, the
   lowest of any 120-example model here, with training exact match 0.43;
   R=2 is worse than MX01 (4.09). Specialization 0.65 at the first
   recurrence, 0.45 and 0.49 after it. Three diagrams, rows RM01@2 and
   RM01@3, a recording replayed in the live demo. F23 found on the way: a
   reshape sized from `shape()` inside `grad` drops the gradient silently
   (the first R=2 run collapsed onto one expert); pinned by a probe.
4. `engram-from-scratch` - done: EG01, the DN01 block plus an Engram
   layer written from ngram_hash, gather_rows, matmul, concat, and
   sigmoid, with exact parity against the engram builtin (outputs and
   gradients differ by zero on trained parameters, both directions).
   Four table sizes and the builtin form, one process each. At 90
   training windows the table is memorization capacity: validation loss
   3.93 (1,024 slots) to 4.67 (256) against DN01's 3.79, prose held-out
   0.667 only at 1,024 slots; collisions 161 of 769 contexts at 1,024
   slots, 737 at 16. Three diagrams, five rows, a recording replayed in
   the live demo. F23's second form and F24 pinned; F19 and F20 verified
   resolved upstream (probes flipped).
5. `recurrent-moe-engram` - done: RE01 and ME01, the RM01 block with the
   Engram layer between attention and the router, R = 1 and R = 3, one
   process each; the seven-row ablation matrix drawn from the results
   table (a new Engram-gate column across every row). At 90 windows the
   three sparsities compound memorization: ME01 4.60, RE01 4.76 with
   training loss 0.006 and training exact match 0.99, against RM01's 3.42;
   routing still re-decides per recurrence (change share 0.31) and the
   gate stays open (0.72 to 0.76). Two diagrams, two rows, a recording
   replayed in the live demo.
6. `saga-close` - done: the RC01, RM01, EG01, and RE01 recordings were
   pinned and added to the live demo in their own steps; the deploy of
   commit 3eaa4ec verified with `?verify=1` (eight lessons, no errors) and
   recorded in `docs/results/live-demo.md`; the host handoff extended with
   the new observation shapes; README status, learned claims (six to
   nine), size table, and next section updated; wiki Home, Start Here,
   Learn, Results, Experiments, Internals, and Reference updated and
   verified after the push; the carousel's results and conclusions slides
   regenerated (docs/20260913-LinkedIn.pdf).

## Paused: `campus-docent-v0` (Saga 4)

Purpose: a second training area whose domain is the live campus site: a
tiny MoE trained in batch here, run in the browser, that predicts intent
and destination while the catalog stays the authority for facts and
stories. Source: [`research3.txt`](../research/research3.txt); design
decisions and the usefulness bar are in [`plan.md`](plan.md), Saga 4.

1. `campus-snapshot-a` - CD00: the catalog snapshot with docent blocks and
   canned stories, the deterministic corpus and split, the story policy.
2. `docent-dense` - CD01: hashed features, pooled embedding, intent and
   destination heads; the flat classifier baseline.
3. `recording-replay-page` - the first live demo on GitHub Pages: the
   pinned recordings stepped frame by frame, the dispatch walkthrough, the
   README link, a browser verification record. First publication milestone.
4. `matcher-baseline` - MB01: the mockup's deterministic alias-and-concept
   matcher and a matcher over all catalog text, in MLPL, scored on the
   validation rows and the held-out paraphrase set; the yardstick.
5. `docent-word-vectors` - CD01b: word vectors trained on the campus's own
   text, stored in an Engram-style hashed table, fine-tuned by the docent;
   the fair route to a margin over the matcher.
6. `docent-moe` - CD02 to CD04: routed delta experts (4 and 8), the
   specialization map and expert annotations, the ambiguity panel.
7. `docent-batch-export` - `just docent`: the chosen configuration exported
   with labels and manifest, INT8 sizes, replay recording, parity twin.
8. `docent-in-browser` - CD05, CD06: inference-first page on the
   `mlpl-wasm` bridge, measured latency, the budgeted live-training probe.
9. `easel-handoff` - the sw-campus work order, recordings, docs and wiki.

Step 5 status: complete. CD01b: word vectors from the campus's own text
(586 words from 4,390 words of stories, status lines, taglines, and the
linked READMEs; PPMI, rank 24 by orthogonal iteration) in a 1,024-row
hashed table under the CD01 docent. Fine-tuned: paraphrase destination
0.407 (CD01 0.296), held-out destination 0.917, intent 0.942; frozen
vectors alone: 0.204 (re-measured in its own process, finding F22). Against the text matcher's 0.685 the margin is minus
28 points: the bar is still not met, though vectors moved the paraphrase
number by 11 points. F21 filed (adam inside a user function trains local
copies). The docent saga pauses here; Engram (recurrence-and-Engram) runs
next by the user's decision, and the remaining docent steps follow as a
separate saga.

Step 4 status: complete. MB01, the campus mockup's deterministic matcher
ported to MLPL, and MB01t, the same matcher over all catalog text, scored
on the docent's held-out rows and paraphrases: destination 0.954 / 0.925,
paraphrases 0.630 / 0.685, unsupported recall 1.0 / 0.4, intent 0.78 /
0.76. The dense docent CD01 loses to both on paraphrases by 33 to 39 points
and wins only on intent; the usefulness bar is not met, and the campus
keeps its matcher until CD01b or CD02 changes that. A LinkedIn carousel
(`docs/20260913-LinkedIn.pdf`, generated from the HTML beside it) summarizes
the results so far.

Step 3 status: complete. The first live demo is published at
https://sw-ml-study.github.io/moe-microscope/ and linked from the README:
the three pinned training recordings and a new walkthrough fixture (one
window of the trained MX01 mixture, stage by stage) stepped frame by frame
with the standard footer and build info; verified on the live site (every
lesson to its last frame, no errors) and recorded in
`docs/results/live-demo.md`. F20 filed. First publication milestone: the
repository side is done; the campus lobby feature and the blog post remain.

Step 2 status: complete. CD01, the flat dense docent (1,024 hash slots,
width 24, hidden 32, 26,003 parameters): held-out intent 0.938 and
destination 0.925 on templated rows, but 0.296 destination on the 54
held-out paraphrases, 0.3 unsupported recall, and 0.091 on ambiguous
top-2, so the value-over-matcher question is open for MB01 and CD02. Docent results table, three diagrams,
six tests; F13 verified resolved upstream, F19 (matmul panic in `grad`)
filed with a probe.

Step 1 status: complete. Snapshot A (12 places, 28 stories, 12 status
sentences with maturity levels) from the live catalog; `lib/campus.mlpl`
derives paths and URLs, a content hash, a 965-row corpus (724 train, 241
validation) over 6 intents (navigate, explain, recommend, story, status,
unsupported) and 10 destinations, and the story policy; four diagrams,
eight tests, the CD00 row and report. The status intent and sentences, forty
off-topic rows, the 54-row held-out paraphrase fixture, and the Computational
Sciences Institute with its MoE Microscope exhibit were added during step 2
at the user's request.

## Completed: `resource-budget-and-documentation` (Saga 3)

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

Step 6 status: complete. The peer wiki (`../moe-microscope.wiki`) mirrors
the hierarchy as a navigation layer: Home, Start Here, Learn, Results,
Experiments, Internals, Reference, and a sidebar. Verified after the push:
all six Mermaid diagrams render without error under Mermaid 11 in headless
Chrome, and all 53 distinct link targets (7 wiki pages by wiki-page links,
46 repository files by full GitHub URLs) return HTTP 200. Saga 3 is
complete; Saga 4 (recurrence and Engram) is next.

Step 5 status: complete. `docs/concepts/` holds the learning path (index
plus nine concept pages, each with a schematic, measurements, and the
four-sparsities table); `docs/results/current-findings.md` states seven
claims as evidence, interpretation, and limitation; `docs/results/quality.md`
collects exact match and validation loss; every experiment stub is now a
laboratory report citing results rows, diagrams, or findings.

Step 4 status: complete. README rewritten as an executive summary (what and
why, status, five learned claims with numbers and evidence links, how small,
how fast, progression, experiments, next); the per-lesson sections moved
verbatim into `docs/experiments/` stubs with an index, for step 5 to turn
into laboratory reports.

Step 3 status: complete. Documents moved into overview, results,
implementation, reference, and research with index pages and a landing page;
every link and path reference updated; the gate checks links across the
tree.

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

Step 5 status: complete. `docs/concepts/` holds the learning path (index
plus nine concept pages, each with a schematic, measurements, and the
four-sparsities table); `docs/results/current-findings.md` states seven
claims as evidence, interpretation, and limitation; `docs/results/quality.md`
collects exact match and validation loss; every experiment stub is now a
laboratory report citing results rows, diagrams, or findings.

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

Step 5 status: complete. `docs/concepts/` holds the learning path (index
plus nine concept pages, each with a schematic, measurements, and the
four-sparsities table); `docs/results/current-findings.md` states seven
claims as evidence, interpretation, and limitation; `docs/results/quality.md`
collects exact match and validation loss; every experiment stub is now a
laboratory report citing results rows, diagrams, or findings.

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

Step 5 status: complete. `docs/concepts/` holds the learning path (index
plus nine concept pages, each with a schematic, measurements, and the
four-sparsities table); `docs/results/current-findings.md` states seven
claims as evidence, interpretation, and limitation; `docs/results/quality.md`
collects exact match and validation loss; every experiment stub is now a
laboratory report citing results rows, diagrams, or findings.

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

Step 5 status: complete. `docs/concepts/` holds the learning path (index
plus nine concept pages, each with a schematic, measurements, and the
four-sparsities table); `docs/results/current-findings.md` states seven
claims as evidence, interpretation, and limitation; `docs/results/quality.md`
collects exact match and validation loss; every experiment stub is now a
laboratory report citing results rows, diagrams, or findings.

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

- Saga 4 `campus-docent-v0` (paused after step 5, above; value over the
  deterministic matcher is part of its usefulness bar): the second training
  area, from
  [`research3.txt`](../research/research3.txt). A tiny MoE trained in batch
  here and run in the browser to direct visitors of the sw-campus site:
  snapshot A of the campus catalog (IBM 1130, APL, RCA 1802) with canned
  stories per place and the story-selection policy, a deterministic corpus
  generator, the dense classifier CD01, the routed
  docent CD02 with its specialization map CD03 and ambiguity panel CD04,
  the `just docent` batch export with manifest, the inference-first docent
  page CD05 on the proven `mlpl-wasm` bridge with a budgeted live-training
  probe, and the inference-only easel handoff to sw-campus.
- Saga 5 `recurrence-and-engram` (completed, above): RC01, RM01, EG01 (both
  forms: from scratch and builtin, with parity), RE01, the seven-row
  ablation table, and the live-demo and host handoffs.
- Saga 6 `animated-data-flow-landscape`: a panning animation of tokens
  moving through routing, hot and cached experts, Engram lookups,
  recurrence, decode-cache compression, and multi-token prediction, one
  scene per mechanism, each played back from a pinned recording with
  parallel work called out; next by the user's decision, its first
  scenes played from the recordings Saga 5 pinned.
- Saga 7 `campus-docent-routed`: the docent saga continued: CD02 to CD04
  routed experts and specialization, the batch export, browser inference
  with the budgeted live-training probe, and the easel handoff; ships to
  the campus only if the usefulness bar is met.
- Saga 8 `campus-docent-live`: the trained docent replaces the mockup's
  keyword matcher in the campus site: the frozen export contract and
  validator, the browser bridge module with `predict(query)` and a parity
  page, the campus model-bridge work order, and live acceptance against
  the deployed page (edition line, thirty scripted queries matching the
  export, fallback, stale badge, latency) recorded as CD09.
- Saga 9 `campus-docent-v1`: when the campus adds the 1442 card reader and
  its radio demo, the stale-model, retraining-versus-forgetting, and
  quantization study (CD06 to CD08) and the revision comparison page.
- Saga 10 `distillation`: token KD against the in-repo teacher, router warm
  start, expert-delta distillation, and the gated external-teacher export.
- Saga 11 `quantization-packing-and-cache`: INT8 and INT4 experts, the packed
  TinyMoE file, the LRU expert-cache simulator with capacity curves, and
  prefill double buffering, and KV01, decode-cache
  compression measured on the generation benchmark.
- Saga 12 `hybrid-execution-and-embedded-budget`: bandwidth calibration, the
  q-star transfer/compute split, expert banks, and the 256 MB budget report.
- Saga 13 `interactive-microscope-host`: systems recordings, live-demo
  acceptance (the only `sw-checklist` scope), and the pocket-helper demo.
- Saga 14 `configuration-frontier`: one harness over configuration records;
  sweeps of expert count, top-k, shared always-on experts, Engram slots, and
  recurrence depth; a Pareto frontier with smallest, fastest, and best picks;
  first the Engram follow-ups NG01 (a count-based n-gram yardstick over
  orders 1 to 5), EG02 (the table at 480 and 960 examples, with a frozen
  base, and over orders 2 to 5), and MT01 (a second head predicting t+2,
  as an auxiliary loss and as a draft), which can move earlier on request.
- Saga 15 `cuda-and-host-resident-experts`: backend probes for CUDA and MLX,
  lab-scale training on the GPU, expert weights in host RAM with a bounded
  GPU cache, CPU execution of missing experts, and a VRAM-budget report.
- Saga 16 `findings-and-recommendations`: `docs/report.md` with findings,
  recommendations, and ranked future improvements, every claim cited.
