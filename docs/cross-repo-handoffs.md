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

Trigger: Saga 4 step 4. The gated Rust-native training and generation path
documented in `docs/rust-native-model-training.md` there is the intended way
to obtain top-k next-token log probabilities from a local quantized 1B to 7B
model. This repository defines the fixture schema; the export tool would live
beside the existing gated recipes and exit with the documented status when
the capability is unavailable.

## `../sw-mlpl`: language and generic host

Open work orders, each with a reproducer under `probes/` and a pinned probe,
are in [`sw-mlpl-findings.md`](sw-mlpl-findings.md): F5 (index and mask
builtins as stop-gradient constants on the tape), F6 (`repeat` inside a
traced function), F7 (models as user-function arguments), F8 (`emit_frame`
with a non-literal name), and D1 (a loud error for an untracked `wrt` leaf).
Upstream has queued them as `moe-microscope-followups`; the recommended order
is F5, F8, F7, F6, D1, because F5 and F8 change what the lessons and the
observation facade can express. F1 to F4 were fixed upstream in
`moe-microscope-findings` and are verified here.
