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
   docent block on `Place` (aliases, concepts, example queries) without
   changing the human-facing catalog fields, and export the catalog with a
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
   queries) in IndexedDB and transient route state in session storage;
5. run inference through the same `mlpl-wasm` session the microscope page
   uses, or a headless build of it once upstream publishes one; no Rust
   model code; `sw-checklist` applies to the Yew easel as to the rest of the
   campus app.

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
`moe-microscope-findings` and are verified here.

For the campus docent, one ask is shared with `../demo-abstract-algebra`
(its blocker B7): a headless `--target web` build of `mlpl-wasm` alone, so a
page can load the evaluator as a library instead of the whole playground in
a hidden iframe. Until then both projects use the iframe bridge.
