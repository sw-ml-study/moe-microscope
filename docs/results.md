# Results table

One row per lesson run, appended by the lesson's results writer once Saga 1
step 3 lands. Columns are fixed so the ablation matrix from the research can
be read straight down.

| Lesson | Config | Binary | Params | Active params/token | Bytes/expert | Packed bytes | Expert evals/token | Bytes/token | Cache hit rate | ms/token | Val loss | PPL | Arith acc | Seq acc | MLPL acc | Prose acc | KL to teacher | Router entropy | Balance | Specialization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

No rows yet. DN01 adds the first row in Saga 1 step 4.
| DN01 | dense d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | 23968 | - | 0.0201 | 3.7888 | 44.2 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| TE01 | dense d32 h64 2blocks 1head T28 120ex 300ep lr0.001 | mlpl-repl 0.22.0 | 19956 | 18324 | - | - | 2 | 146592 | - | 0.0791 | 4.1355 | 62.52 | 0 | 0 | 0 | 0 | - | - | - | - |
