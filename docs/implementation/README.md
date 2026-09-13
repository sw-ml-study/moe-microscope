# Implementation

For modifying or reproducing the microscope.

- [Generic host handoff](host-handoff.md): the recordings the
  Rust/Yew/WASM microscope in `../demo-extensions` renders, and what it
  must not add
- [Cross-repository handoffs](cross-repo-handoffs.md): read-only work
  orders for sibling repositories, including the open sw-MLPL findings
- [Teacher fixture schema](teacher-fixture.md): the soft-target export
  the distillation lessons consume

Every lesson is an MLPL program under `demos/` built from `lib/` modules
with native mlplunit tests under `tests/`; `just check` is the gate and
`AGENTS.md` the process.
