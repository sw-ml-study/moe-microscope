# Cross-repository handoffs

This document is a work order for agents operating in sibling repositories.
It does not authorize changes from this repository. Each request should be
revalidated against artifacts produced here before its own saga begins.

## `../demo-extensions`: generic Rust/Yew/WASM microscope host

Trigger: Saga 7 step 1 has produced version-pinned recordings for DN01, MX02,
RM01, RE01, and XC01 under the peer recording schema with a hash-checked index.

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

No request is open. A request requires a confirmed blocker in the
[capability ledger](sw-mlpl-blockers.md) with a minimal reproducer. Likely
candidates if the probes fail: a differentiable batched gather across a bank
of experts, and a KL-divergence builtin with a frozen signature.
