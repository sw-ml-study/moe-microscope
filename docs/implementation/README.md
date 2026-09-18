# Implementation

For modifying or reproducing the microscope.

- [Generic host handoff](host-handoff.md): the recordings the
  Rust/Yew/WASM microscope in `../demo-extensions` renders, and what it
  must not add
- [Cross-repository handoffs](cross-repo-handoffs.md): read-only work
  orders for sibling repositories, including the open sw-MLPL findings
- [Teacher fixture schema](teacher-fixture.md): the soft-target export
  the distillation lessons consume

The [literate reading](../literate/moe-microscope.org) tangles to the
mechanism modules and the dense lesson byte for byte and is checked by
`scripts/check-tangle`.

Every lesson is an MLPL program under `demos/` built from `lib/` modules
with native mlplunit tests under `tests/`; `just check` is the gate and
`AGENTS.md` the process. The gate serves unchanged lessons from a content-keyed
cache and `just check-docs` covers documentation-only commits; see the
incremental gate section of the [architecture](../overview/architecture.md).
