# Cross-repository handoffs

This document is a work order for agents operating in sibling repositories.
It does not authorize changes from this repository. Each request should be
revalidated against artifacts produced here before its own saga begins.

## `../demo-extensions`: generic Rust/Yew/WASM microscope host

Trigger: the end of each saga, starting with Saga 1 step 5 (DN01), produces
version-pinned recordings under the peer recording schema with a hash-checked
index. The DN01 work order is [`host-handoff.md`](host-handoff.md). The live demo (editable lesson, `mlpl-serve` SSE, generic timeline)
is handed off after Saga 3 on the MLPL web framework proven there.

The extension agent should:

1. vendor the pinned producer revision and its `SHA256SUMS`;
2. render the new recordings through the existing generic shape-directed
   viewer; router masks, dispatch tables, cache traces, and q-star splits are
   ordinary rank-1/rank-2 observations with slash-separated names;
3. add no `MoeViewer`, `RouterViewer`, or cache-policy type in Rust;
4. run `sw-checklist` over the affected Rust crates; this is the only
   `sw-checklist` scope in the whole MoE microscope effort;
5. report any recording that the generic viewer cannot present as a shape or
   budget finding, not as a request for lesson-specific rendering.

If the live-demo host is instead built inside this repository, it lives under
`crates/` and inherits the same rules, including `sw-checklist`.

## `../demo-mlpl-libraries`: shared MLPL helpers

Trigger: three unrelated lessons here use the same helper surface without
lesson-specific branches. Candidates, in likely order: the observation facade
over `emit_frame`, symmetric INT8 and teaching Q4 arithmetic already proven
in `../demo-ml-utils`, and bounded record readers over packed byte files.

The library agent should freeze only the domain-neutral API, add module
comments, docstrings, canonical formatting, mlplunit contract tests, catalog
metadata, and an immutable revision this repository can vendor by hash.

## `../demo-ml-utils`: external teacher export

Trigger: the distillation saga. The gated Rust-native training and generation path
documented in `docs/rust-native-model-training.md` there is the intended way
to obtain top-k next-token log probabilities from a local quantized 1B to 7B
model. This repository defines the fixture schema; the export tool would live
beside the existing gated recipes and exit with the documented status when
the capability is unavailable.

## `../../software-wrighter-lab/sw-campus`: the campus docent easel

Trigger: the campus docent saga (`docs/overview/plan.md`, Saga 4). This
repository trains the docent in batch (`just docent`), commits the export
under `fixtures/campus/`, and publishes the docent lesson page; the campus
site hosts inference only and never trains. Updating the docent after a
catalog change is a batch procedure here: regenerate the corpus, rerun the
recipe, commit the new weights and manifest, and the campus site picks up
the new files on its next build. The campus agent should:

1. adopt `fixtures/campus/snapshot-a.json` as the shape of a reviewable
   docent block on `Place` (aliases, concepts, example queries, and canned
   stories with id, title, text, concepts, and kind) without changing the
   human-facing catalog fields, and export the catalog with a
   stable hash so the docent manifest can name the revision it was trained
   on;
2. add one easel per lobby with a passive face (featured exhibit, visit
   link) and an interactive face (ask the docent, "why this?", open the full
   microscope);
3. load the exported model, labels, and manifest at startup and show a
   stale badge when the manifest's catalog hash differs from the live
   catalog; the catalog, never the model, supplies titles, URLs, breadcrumbs,
   and status, and "no sufficiently specific destination" is a valid answer;
4. keep the docent context (current place, recent places, interests, recent
   queries, told stories) in IndexedDB and transient route state in session
   storage; volunteer a place's arrival story once, apply the story policy
   from this repository (untold first, no repeat unless asked, offer another
   while untold ones remain), and let the visitor clear the context;
5. run inference through the same `mlpl-wasm` session the microscope page
   uses, or a headless build of it once upstream publishes one; no Rust
   model code; `sw-checklist` applies to the Yew easel as to the rest of the
   campus app.

The campus repository's own plan (its `campus-docent` saga) already carries
the easel, drawer, keyword-matcher fallback, and a model-bridge step; this
repository's Saga 5 delivers what that bridge consumes and verifies the
live result.

The 1442 card read punch and its radio demo are deliberately absent from
snapshot A; when the campus publishes them, that revision is snapshot B and
starts the docent v1 saga here.

## `../sw-mlpl`: language and generic host

Open work orders, each with a reproducer under `probes/` and a pinned probe,
are in [`sw-mlpl-findings.md`](../reference/sw-mlpl-findings.md): F5 (index and mask
builtins as stop-gradient constants on the tape), F6 (`repeat` inside a
traced function), F7 (models as user-function arguments), F8 (`emit_frame`
with a non-literal name), and D1 (a loud error for an untracked `wrt` leaf).
Upstream has queued them as `moe-microscope-followups`; the recommended order
is F5, F8, F7, F6, D1, because F5 and F8 change what the lessons and the
observation facade can express. F1 to F4 were fixed upstream in
`moe-microscope-findings` and are verified here. The fourth batch
(`followups-4`) shipped F19, F20, and F21 on 2026-09-15 (verified here,
probes flipped) and closed; F22 needed a second fix (a per-parameter Adam
step counter, `3ffd7266`, in `followups-5`) and is verified resolved; the
global step counter had also contaminated the one lesson that trained a
second model with distinct names in one process (LD01r), re-measured.
`followups-5` shipped F23's parameter-bound form and F24 on 2026-09-16
(verified here, probes flipped); what remains open is F23's first form,
a reshape sized from `shape()` of a tracked value inside `grad`, which
drops the gradient without an error (met in RM01 as a silent routing
collapse) and should lead the next batch, because a silent wrong gradient
is worse than a panic.

For the campus docent, one ask is shared with `../demo-abstract-algebra`
(its blocker B7): a headless `--target web` build of `mlpl-wasm` alone, so a
page can load the evaluator as a library instead of the whole playground in
a hidden iframe. Until then both projects use the iframe bridge.

## `../../software-wrighter-lab/sw-campus`: the landscape in the lobby

The Computational Sciences Institute's featured moe-microscope demo can
link both pages: the frame-by-frame live demo
(<https://sw-ml-study.github.io/moe-microscope/>) and the panned animation
(<https://sw-ml-study.github.io/moe-microscope/landscape.html>), described
as playbacks of pinned recordings. Both pages carry the campus link in
their footer; nothing else is needed from the campus side.

## `../../software-wrighter-lab/sw-atlas`: the no-FFN check and the tiered-weights workload

Atlas's plan (its `docs/plan.md`, section 11) carries three work orders
for this repository. They are answered here, never by changing Atlas.

### SAN01, is no-FFN real? (answered 2026-09-18)

Atlas bets its architecture on dropping feed-forward layers so the model
cannot memorise facts it was not shown. The microscope checked the cost on
the campus docent corpus it already has: CD01 and CD01b with the hidden
layer removed and the budget kept (the hashed embedding widened to 25;
the word-vector table's width is fixed by the vectors).

| Model | Params | Intent | Destination | Paraphrase dest | Unsupported recall |
|---|---:|---:|---:|---:|---:|
| CD01 dense (with FFN) | 26,003 | 0.938 | 0.925 | 0.296 | 0.3 |
| SAN01 no-FFN | 26,094 | 0.946 | 0.934 | 0.389 | 0.5 |
| CD01b dense + word vectors | 26,003 | 0.942 | 0.917 | 0.407 | 0.3 |
| SAN01b no-FFN + word vectors | 25,051 | 0.938 | 0.925 | 0.444 | 0.3 |

No-FFN does not lose on this corpus: both variants match or beat their
dense twins on every held-out column with lower validation loss. The
limitation Atlas should carry forward: the docent is a pooled bag of
hashed features with no sequence mixing, so this is evidence about the
hidden layer's contribution at this size and nothing about attention-only
encoders; and the deterministic matchers still beat every docent on
paraphrases (finding 8). Report: [SAN01](../experiments/SAN01.md); rows
in the [docent results table](../reference/docent-results.md).

### MOE-RETURN

Mixture-of-experts stays here as the built and measured line (MX01, MX02,
SD01, LD01, RM01, RE01, the routed docent CD02 and CD03 in Saga 11). If
Atlas's attention-only no-FFN model underperforms at its scale, the
routed docent is the alternative already measured on the same corpus and
the same usefulness bar; nothing in Atlas needs to change for it to come
back.

### TW01, tiered weights reframed (planned 2026-09-18)

Accepted as reframed. [Saga 14](../overview/plan.md) is now quantization,
the packed file, and tiered weight residency, and the residency unit is a
**shard record** rather than an expert, so one simulator serves the
microscope's expert bank and Atlas's depth-sharded model without a second
code path. Three tiers: resident (no read), near (a real bounded
`read_bytes` on the packed file, timed), far (the same read plus a
calibrated added latency, declared as an estimate).

**What we will accept from Atlas.** A manifest naming shards, consumed
read-only by name and hash; nothing in Atlas changes for us, and we never
edit it. One entry per shard:

```text
ShardManifestEntry {
  id           text, unique within the manifest
  kind         "depth-shard" | "embedding" | "head" | "expert"
  layer_range  [first, last] for a depth shard, else null
  bytes        stored size of the shard
  payload      bytes that are real weights (bytes - padding)
  quantization "f32" | "f16" | "int8" | "int4"
  sha256       checksum of the payload
  tier_hint    "resident" | "near" | "far", advisory only
}
```

Plus a request sequence: the shard ids a query touches, in order, one list
per query. That sequence is the workload; how Atlas produced it is its own
business.

**What we will emit.** A per-token residency trace under the observation
name `tier/trace`, pinned as a fixture and playable by the generic host
and the landscape:

```text
TraceRecord {
  step         token index
  shard        shard id requested
  tier         0 resident, 1 near, 2 far
  bytes_read   bytes that crossed a tier boundary (0 on a hit)
  latency_ms   measured for tier 1, modelled for tier 2
  evicted      shard id dropped to make room, or null
  next_use     token index of this shard's next request, labelled
               afterwards, or -1 if never again
}
```

The `next_use` field is there for `sw-os-ml`'s open gate G4 ("known next
use beats LRU"): TW01 runs the same capacity sweep under LRU and under the
oracle policy and commits both curves, so the gap is measured rather than
argued. A docent or navigator session has unusually legible next-use
structure, which is what makes Atlas's sequence worth having.

**Metric names**, shared by both sides so the two scoreboards read the
same: shard bytes, cache hit rate, bytes read per token, load latency per
token, evictions per token, beside RB01's stored, resident, active,
transferred, and executed. Each is labelled measured, derived, or
estimated.

**Why we still pad.** A MicroMoE expert is 1,072 parameters, 536 bytes at
INT4. No hierarchy shows an I/O cost at that size, so the packed file's
records are padded to realistic sizes with the padding declared in the
directory and never decoded. The routing, the shard identities, and the
hit sequence stay exactly those of the trained model; the record sizes are
chosen, and every lesson and row says so. Atlas's shards are already
realistic, which is why replaying its manifest is the better half of the
experiment.

