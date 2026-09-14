# Results table

One row per lesson run, appended by the lesson's results writer once Saga 1
step 3 lands. Columns are fixed so the ablation matrix from the research can
be read straight down.

| Lesson | Config | Binary | Params | Active params/token | Bytes/expert | Packed bytes | Expert evals/token | Bytes/token | Cache hit rate | ms/token | Val loss | PPL | Arith acc | Seq acc | MLPL acc | Prose acc | KL to teacher | Router entropy | Balance | Specialization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

No rows yet. DN01 adds the first row in Saga 1 step 4.
| TE01 | dense d32 h64 2blocks 1head T28 120ex 300ep lr0.001 | mlpl-repl 0.22.0 | 19956 | 18324 | - | - | 2 | 146592 | - | 0.0791 | 4.1355 | 62.52 | 0 | 0 | 0 | 0 | - | - | - | - |
| DN01 | dense d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | 23968 | - | 0.0202 | 3.7888 | 44.2 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| SD01 | MX01 sparse dispatch, 40ep, inference over 120 windows | mlpl-repl 0.22.0 | 7096 | 3064 | 8576 | - | 1 | 24512 | - | 0.0246 | - | - | - | - | - | - | - | - | - | - |
| MX01 | moe E4 top1 d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | 24512 | - | 0.046 | 3.7641 | 43.12 | 0 | 0 | 0 | 0.667 | - | 0.623 | 1.166 | - |
| MX02 | moe E4 top2 d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 7096 | 4136 | - | - | 2 | 33088 | - | 0.047 | 3.9157 | 50.18 | 0 | 0 | 0.286 | 0 | - | 0.506 | 0.53 | - |
| DN01@120 | dense 120ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.0245 | 3.4811 | 32.5 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| DN01@120 | dense 120ex 400ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.0246 | 3.8873 | 48.78 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| DN01@480 | dense 480ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.0257 | 1.6555 | 5.24 | 0.088 | 0.03 | 0.077 | 1 | - | - | - | - |
| DN01@960 | dense 960ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.024 | 1.1092 | 3.03 | 0.195 | 0.099 | 0.081 | 1 | - | - | - | - |
| MX01@120 | moe 120ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.0534 | 3.4864 | 32.67 | 0 | 0.111 | 0 | 0.667 | - | - | - | - |
| MX01@120 | moe 120ex 400ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.0532 | 4.1719 | 64.84 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| MX01@480 | moe 480ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.0465 | 1.4174 | 4.13 | 0.088 | 0.061 | 0.077 | 1 | - | - | - | - |
| MX01@960 | moe 960ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.047 | 1.2226 | 3.4 | 0.091 | 0.025 | 0.081 | 0.75 | - | - | - | - |
| LD01 | shared ffn + 16 rank4 deltas top1 d16 T28 120ex 300ep lr0.003 alpha0.01 routerMACs272 | mlpl-repl 0.22.0 | 6132 | 3396 | 1024 | - | 1 | 27168 | - | 0.0496 | 3.456 | 31.69 | 0 | 0 | 0 | 0 | - | 1.682 | 1.528 | 0.241 |
| LD01r | 16 rank4 deltas only top1 d16 T28 120ex 300ep lr0.003 alpha0.01 routerMACs272 | mlpl-repl 0.22.0 | 5060 | 2324 | 1024 | - | 1 | 18592 | - | 0.0443 | 3.3652 | 28.94 | 0 | 0 | 0 | 0 | - | - | - | - |
| CD00 | campus snapshot A: 12 places, 28 stories, 965 rows (724 train, 241 val), hash 1356782549, no model | mlpl-repl 0.22.0 | - | - | - | - | - | - | - | 0.2993 | - | - | - | - | - | - | - | - | - | - |
| RC01@1 | recurrent block R=1 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | 23968 | - | 0.0201 | 3.7888 | 44.2 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| RC01@2 | recurrent block R=2 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 5092 | - | - | 1 | 40736 | - | 0.037 | 3.4545 | 31.64 | 0 | 0 | 0 | 0.667 | - | - | - | - |
| RC01@3 | recurrent block R=3 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 7188 | - | - | 1 | 57504 | - | 0.0537 | 3.7294 | 41.65 | 0 | 0 | 0.286 | 0.667 | - | - | - | - |
| RC01@4 | recurrent block R=4 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 9284 | - | - | 1 | 74272 | - | 0.0708 | 4.2207 | 68.08 | 0 | 0 | 0.143 | 0.667 | - | - | - | - |
