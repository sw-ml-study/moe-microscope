# Documentation

The repository documents are the canonical source; the README is the
executive summary and this page is the landing page. The
[GitHub wiki](https://github.com/sw-ml-study/moe-microscope/wiki) mirrors
the same hierarchy as a navigation layer. Three reader journeys:

## I want to understand the idea

- [Project overview](../README.md)
- [Live demo](https://sw-ml-study.github.io/moe-microscope/): the pinned
  recordings stepped frame by frame in the browser
- [Architecture](overview/architecture.md): the model under the lens, the
  four sparsities, ownership and layering
- [Delivery plan](overview/plan.md): the sagas, the two scales, the visual
  and measurement contract, the answers on distillation and domain
- [Landscape storyboard](overview/landscape-storyboard.md): the scenes of
  the animated data-flow landscape, the recording each reads, and the
  acceptance rule for each
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
