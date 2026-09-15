# Results

Concise answers first; the evidence is one link deeper.

- [Current findings](current-findings.md): what can be concluded today,
  as evidence, interpretation, and limitation per claim
- [Resource economics](resource-economics.md): sizes, expert cost, stored
  versus active, projections, residency, transfer estimates (M/D/E)
- [Quality](quality.md): exact match by task family and validation loss,
  including the data-scale sweep
- [Generation benchmark](../reference/generation-benchmark.md): measured
  time to first token, throughput, tail latency
- [Live demo verification](live-demo.md): what was checked on the
  published GitHub Pages site after each deploy
- [Full results table](../reference/results.md): every run, every column
- [Docent results table](../reference/docent-results.md): the campus
  docent runs (CD series), including the held-out paraphrase columns where
  value over the deterministic matcher is measured

| Question | Current answer | Detail |
|---|---|---|
| Does top-1 routing increase stored capacity efficiently? | Yes: 1.86 times the parameters at 1.02 times the active parameters per token | [finding 1](current-findings.md) |
| Do experts specialize? | Yes at this synthetic scale: 0.61 for top-1 against a 0.25 blind baseline | [finding 2](current-findings.md) |
| Is top-2 clearly better? | No: better fit and the first held-out MLPL answers, worse validation loss, twice the work | [finding 3](current-findings.md) |
| Does more training fix low-data behavior? | No: doubling epochs at 120 examples worsens validation loss | [finding 4](current-findings.md) |
| Does more data help? | Yes: eightfold data cuts validation loss by two thirds | [finding 4](current-findings.md) |
| Does sparse dispatch save work? | Yes: 13,440 to 3,360 expert row evaluations, outputs exactly equal | [finding 5](current-findings.md) |
| Is sparse dispatch faster yet? | No: dispatch bookkeeping outweighs the tiny matmuls skipped | [finding 5](current-findings.md) |
| Are cheap experts worth it? | Sixteen rank-4 deltas cost half of four full experts and give the best validation losses so far | [finding 6](current-findings.md) |
| Can compute replace parameters? | Partly: the mixture block applied three times reaches the lowest 120-example validation loss (3.42), and 38 to 46 percent of tokens change expert between recurrences; not a converging loop | [finding 9](current-findings.md) |
| Does external memory help? | Not at 90 windows: every table size lowers training loss and raises validation loss (3.93 to 4.67 against 3.79); the from-scratch form equals the builtin exactly | [finding 10](current-findings.md) |
| Do memory and compute sparsity complement each other? | Not at 90 windows: routing plus the table gives 4.60, routing plus recurrence plus the table 4.76 at training loss 0.006, the worst held-out row of the seven-row ablation | [RE01](../experiments/RE01.md) |
