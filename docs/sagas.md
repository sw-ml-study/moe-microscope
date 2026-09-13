# Saga queue

Only one saga is active at a time. Later sagas are initialized after the
preceding saga is completed and archived. Newly discovered work is inserted
with Agentrail commands, never by editing append-only `.agentrail/` state.
The full step prompts and exit criteria are in [`plan.md`](plan.md).

The mandatory checklist in `AGENTS.md` applies to every step: focused tests,
`just check`, affected documentation and catalog entries, `.gitignore` and
tracked-file audit, named-file staging, a detailed commit on `main`,
Agentrail completion metadata, and a verified `git push origin main`.

## Active: `mixture-of-experts-from-scratch` (Saga 2)

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
5. `low-rank-delta-experts` - shared FFN plus low-rank deltas for 16 to 32
   experts; byte accounting; quality comparison.
6. `moe-recordings-and-host-handoff` - MX01 and MX02 recorded over live SSE,
   pinned, and handed to the generic host.

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

Step 6 status: complete. TE01 (`demos/teacher.mlpl`) trained once and
exported to `fixtures/teacher/teacher-v0.json` with a hash-pinned index, a
schema document for the Saga 4 external exporter, a fixture diagram, a
results row, and a no-training gate check. Saga 1 is complete; Saga 2
(mixture of experts from scratch) is next.

Step 5 status: complete. DN01 recorded over live `mlpl-serve` SSE into
`fixtures/recordings/dense-baseline-run-v0.json` with a hash-pinned index;
`scripts/bundle-program` works around the server's missing source provider
(F16); loop streaming proven; `docs/host-handoff.md` written for
`../demo-extensions`; D1 and F10 verified fixed upstream.

Step 4 status: complete. DN01 (`demos/dense_baseline.mlpl`) with
`lib/dense.mlpl` and `lib/svg.mlpl`; two annotated diagrams; the first
results row; catalog entry; seven more findings (F9 to F15) filed with
reproducers, two of which (F5, F6) upstream fixed the same evening.

Step 3 status: complete. `lib/domain.mlpl`, `lib/evaluate.mlpl`, and
`lib/results.mlpl` with 28 native tests; the 120-example mixture fixture;
the DM01 domain microscope with three annotated diagrams (window, tags,
split) freshness-checked by `just check`; catalog entry DM01.

Step 2 status: complete. Sixteen native probes and five standalone
reproducers; F1 to F4 verified fixed upstream, F5 to F8 and D1 pinned and
queued upstream as `moe-microscope-followups`. See
[`sw-mlpl-findings.md`](sw-mlpl-findings.md).

Acceptance: `just check` passes from a clean checkout; the ledger classifies
every probed capability with executable evidence; DN01 satisfies the visual
and measurement contract and has a pinned recording; the teacher fixture is
checked in with its schema.

## Future

Every saga from here ends with a host step that pins its recordings and hands
them to the generic `../demo-extensions` microscope; see the visualization
track in [`plan.md`](plan.md).

- Saga 3 `recurrence-and-engram`: RC01, RM01, EG01 (both forms: from scratch
  and builtin, with parity), RE01, the seven-row ablation table, and the
  live-demo foundation handoff.
- Saga 4 `distillation`: token KD against the in-repo teacher, router warm
  start, expert-delta distillation, and the gated external-teacher export.
- Saga 5 `quantization-packing-and-cache`: INT8 and INT4 experts, the packed
  TinyMoE file, the LRU expert-cache simulator with capacity curves, and
  prefill double buffering.
- Saga 6 `hybrid-execution-and-embedded-budget`: bandwidth calibration, the
  q-star transfer/compute split, expert banks, and the 256 MB budget report.
- Saga 7 `interactive-microscope-host`: systems recordings, live-demo
  acceptance (the only `sw-checklist` scope), and the pocket-helper demo.
