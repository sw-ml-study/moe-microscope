# Results

Concise answers first; the evidence is one link deeper.

| Question | Current answer | Detail |
|---|---|---|
| Does top-1 routing increase stored capacity efficiently? | Yes: 1.86 times the parameters at 1.02 times the active parameters per token | [resource economics](resource-economics.md) |
| Do experts specialize? | Yes at this synthetic scale: specialization 0.61 for top-1 against a 0.25 blind baseline | [results table](../reference/results.md), MX01 and MX02 rows |
| Is top-2 clearly better? | No: better training fit and the first held-out MLPL answers, worse validation loss, twice the expert work | MX02 row |
| Does sparse dispatch save work? | Yes: 13,440 to 3,360 expert row evaluations with exactly equal outputs | SD01 row |
| Is sparse dispatch faster yet? | No: dispatch bookkeeping outweighs the tiny matmuls it skips at this size | [generation benchmark](../reference/generation-benchmark.md) |
| Does more training fix low-data behavior? | No: doubling epochs at 120 examples worsens validation loss | DS01 rows |
| Does more data help? | Yes: eightfold data cuts validation loss by two thirds and solves prose held-out | DS01 rows |
| Are cheap experts worth it? | Sixteen rank-4 deltas cost half of four full experts and give the best validation losses so far | LD01 rows |

- [Resource economics](resource-economics.md): sizes, expert cost, stored
  versus active, projections, residency, transfer estimates (M/D/E)
- [Generation benchmark](../reference/generation-benchmark.md): measured
  time to first token, throughput, tail latency
- [Full results table](../reference/results.md)
- Current findings and quality pages arrive in Saga 3 step 5.
