# Quality

Quality means exact match on held-out prompts by task family, with masked
validation loss as a diagnostic. All runs use the 120-example fixture (90
training rows, 30 validation) unless the row says otherwise; full rows are
in the [results table](../reference/results.md).

| Lesson | Validation loss | Arithmetic | Sequence | MLPL | Prose | Training exact match |
|---|---:|---:|---:|---:|---:|---:|
| DN01 dense | 3.79 | 0 | 0 | 0 | 0.667 | 0.70 |
| MX01 top-1 of 4 | 3.76 | 0 | 0 | 0 | 0.667 | 0.62 |
| MX02 top-2 of 4 | 3.92 | 0 | 0 | 0.286 | 0 | 0.86 |
| LD01 shared + 16 deltas | 3.46 | 0 | 0 | 0 | 0 | 0.60 |
| LD01r 16 deltas only | 3.79 | 0 | 0 | 0.286 | 0 | 0.59 |
| TE01 teacher | 4.14 | 0 | 0 | 0 | 0 | 0.83 |
| RC01 recurrent R=3 | 3.73 | 0 | 0 | 0.286 | 0.667 | 0.74 |
| RM01 recurrent MoE R=3 | 3.42 | 0 | 0 | 0.286 | 0.667 | 0.43 |
| EG01 Engram 256 slots | 4.67 | 0 | 0 | 0 | 0 | 0.80 |
| ME01 MoE + Engram | 4.60 | 0 | 0 | 0 | 0.333 | 0.79 |
| RE01 recurrent MoE + Engram | 4.76 | 0 | 0 | 0.286 | 0 | 0.99 |
| SS01 state-space block for attention | 4.56 | 0 | 0 | 0.286 | 0.667 | 0.99 |

Data scale (DS01, 200 epochs):

| Examples | Dense val loss | Dense arith / seq / mlpl / prose | MoE val loss | MoE arith / seq / mlpl / prose |
|---|---:|---|---:|---|
| 120 | 3.48 | 0 / 0 / 0 / 0.667 | 3.49 | 0 / 0.111 / 0 / 0.667 |
| 480 | 1.66 | 0.088 / 0.030 / 0.077 / 1.0 | 1.42 | 0.088 / 0.061 / 0.077 / 1.0 |
| 960 | 1.11 | 0.195 / 0.099 / 0.081 / 1.0 | 1.22 | 0.091 / 0.025 / 0.081 / 0.75 |

Reading it: at 120 examples every model memorizes and only prose (a local
animal-to-place pattern) generalizes; validation loss and exact match do
not always move together (LD01 has the best non-recurrent loss and no held-out answers,
MX02 the worst loss and the first MLPL answers); more data moves every
column. The recurrent mixture (RM01) has the best 120-example loss with
the lowest training exact match; every Engram row has the worst losses
with the highest training exact match, memorization by table. Loss, perplexity, entropy, KL, and balance remain diagnostics.
