# Documentation

The repository documents are the canonical source; the README is the
executive summary and this page is the landing page. Three reader journeys:

## I want to understand the idea

- [Project overview](../README.md)
- [Architecture](overview/architecture.md): the model under the lens, the
  four sparsities, ownership and layering
- [Delivery plan](overview/plan.md): the sagas, the two scales, the visual
  and measurement contract, the answers on distillation and domain
- [How experts specialize, how routing decides, how Engram is sized](research/moe-engram-discussion.md)
- [Concepts](concepts/README.md): the learning path, one mechanism per
  page with a schematic and the four-sparsities table

## I want to know whether it works

- [Results](results/README.md): the current findings as evidence,
  interpretation, and limitation; resource economics; the quality table
- [Full results table](reference/results.md): one row per lesson run
- [Generation benchmark](reference/generation-benchmark.md): measured
  latency and throughput
- [Experiments](experiments/README.md): one laboratory report per
  experiment, in sequence

## I want to modify or reproduce it

- [Implementation](implementation/README.md): recordings and the generic
  host handoff, sibling work orders, the teacher fixture schema
- [Reference](reference/README.md): results table, capability ledger,
  upstream findings, benchmark
- [Saga queue](overview/sagas.md): what is done, active, and planned
- [Research inputs](research/README.md): the design discussion and the
  Saga 2 review that reshaped this documentation
