# Results table

One row per lesson run, appended by the lesson's results writer and checked
by the gate (a row's deterministic columns must match what the lesson
regenerates). Columns are fixed so the ablation matrix from the research can
be read straight down; a dash is a column the lesson does not measure. The last
column is the persistent sequence state a decoder keeps at f64, at 16 and at
1,024 tokens of history (attention's key and value rows grow; a state-space
state does not).
Docent runs have their own table, [docent-results.md](docent-results.md).

| Lesson | Config | Binary | Params | Active params/token | Bytes/expert | Packed bytes | Expert evals/token | Bytes/token | Cache hit rate | ms/token | Val loss | PPL | Arith acc | Seq acc | MLPL acc | Prose acc | KL to teacher | Router entropy | Balance | Specialization | Engram gate | State bytes (16 / 1024 history) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TE01 | dense d32 h64 2blocks 1head T28 120ex 300ep lr0.001 | mlpl-repl 0.22.0 | 19956 | 18324 | - | - | 2 | 146592 | - | 0.0791 | 4.1355 | 62.52 | 0 | 0 | 0 | 0 | - | - | - | - | - | - |
| SD01 | MX01 sparse dispatch, 40ep, inference over 120 windows | mlpl-repl 0.22.0 | 7096 | 3064 | 8576 | - | 1 | 24512 | - | 0.0246 | - | - | - | - | - | - | - | - | - | - | - | - |
| MX01 | moe E4 top1 d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | 24512 | - | 0.046 | 3.7641 | 43.12 | 0 | 0 | 0 | 0.667 | - | 0.623 | 1.166 | - | - | - |
| MX02 | moe E4 top2 d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 7096 | 4136 | - | - | 2 | 33088 | - | 0.047 | 3.9157 | 50.18 | 0 | 0 | 0.286 | 0 | - | 0.506 | 0.53 | - | - | - |
| DN01@120 | dense 120ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.0245 | 3.4811 | 32.5 | 0 | 0 | 0 | 0.667 | - | - | - | - | - | - |
| DN01@120 | dense 120ex 400ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.0246 | 3.8873 | 48.78 | 0 | 0 | 0 | 0.667 | - | - | - | - | - | - |
| DN01@480 | dense 480ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.0257 | 1.6555 | 5.24 | 0.088 | 0.03 | 0.077 | 1 | - | - | - | - | - | - |
| DN01@960 | dense 960ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | - | - | 0.024 | 1.1092 | 3.03 | 0.195 | 0.099 | 0.081 | 1 | - | - | - | - | - | - |
| MX01@120 | moe 120ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.0534 | 3.4864 | 32.67 | 0 | 0.111 | 0 | 0.667 | - | - | - | - | - | - |
| MX01@120 | moe 120ex 400ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.0532 | 4.1719 | 64.84 | 0 | 0 | 0 | 0.667 | - | - | - | - | - | - |
| MX01@480 | moe 480ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.0465 | 1.4174 | 4.13 | 0.088 | 0.061 | 0.077 | 1 | - | - | - | - | - | - |
| MX01@960 | moe 960ex 200ep lr0.003 (DS01) | mlpl-repl 0.22.0 | 7096 | 3064 | - | - | 1 | - | - | 0.047 | 1.2226 | 3.4 | 0.091 | 0.025 | 0.081 | 0.75 | - | - | - | - | - | - |
| CD00 | campus snapshot A: 12 places, 28 stories, 965 rows (724 train, 241 val), hash 1356782549, no model | mlpl-repl 0.22.0 | - | - | - | - | - | - | - | 0.2993 | - | - | - | - | - | - | - | - | - | - | - | - |
| RC01@1 | recurrent block R=1 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | 23968 | - | 0.0201 | 3.7888 | 44.2 | 0 | 0 | 0 | 0.667 | - | - | - | - | - | - |
| RC01@2 | recurrent block R=2 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 5092 | - | - | 1 | 40736 | - | 0.037 | 3.4545 | 31.64 | 0 | 0 | 0 | 0.667 | - | - | - | - | - | - |
| RC01@3 | recurrent block R=3 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 7188 | - | - | 1 | 57504 | - | 0.0537 | 3.7294 | 41.65 | 0 | 0 | 0.286 | 0.667 | - | - | - | - | - | - |
| RC01@4 | recurrent block R=4 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 9284 | - | - | 1 | 74272 | - | 0.0708 | 4.2207 | 68.08 | 0 | 0 | 0.143 | 0.667 | - | - | - | - | - | - |
| RM01@2 | recurrent moe E4 top1 R=2 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 7096 | 5228 | - | - | 2 | 41824 | - | 0.0818 | 4.0934 | 59.94 | 0 | 0 | 0.143 | 0.667 | - | 0.813 | 1.116 | 0.478 | - | - |
| RM01@3 | recurrent moe E4 top1 R=3 deep supervision, d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 7096 | 7392 | - | - | 3 | 59136 | - | 0.1218 | 3.4152 | 30.42 | 0 | 0 | 0.286 | 0.667 | - | 0.808 | 1.225 | 0.532 | - | - |
| EG01@1024 | dense + engram 2,3-gram 1024 slots x8 scratch (table 16384 params 131072 B) d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 20996 | 3812 | - | - | 1 | 30496 | - | 0.1166 | 3.9323 | 51.02 | 0 | 0 | 0 | 0.667 | - | - | - | - | 0.737 | - |
| EG01@256 | dense + engram 2,3-gram 256 slots x8 scratch (table 4096 params 32768 B) d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 8708 | 3812 | - | - | 1 | 30496 | - | 0.052 | 4.6653 | 106.2 | 0 | 0 | 0 | 0 | - | - | - | - | 0.697 | - |
| EG01@64 | dense + engram 2,3-gram 64 slots x8 scratch (table 1024 params 8192 B) d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 5636 | 3812 | - | - | 1 | 30496 | - | 0.0357 | 4.4914 | 89.25 | 0 | 0 | 0 | 0 | - | - | - | - | 0.633 | - |
| EG01@16 | dense + engram 2,3-gram 16 slots x8 scratch (table 256 params 2048 B) d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 4868 | 3812 | - | - | 1 | 30496 | - | 0.0269 | 4.2651 | 71.17 | 0 | 0 | 0.286 | 0 | - | - | - | - | 0.505 | - |
| EG01b@256 | dense + engram 2,3-gram 256 slots x8 builtin (table 4096 params 32768 B) d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 8708 | 3812 | - | - | 1 | 30496 | - | 0.0497 | 4.6653 | 106.2 | 0 | 0 | 0 | 0 | - | - | - | - | 0.697 | - |
| ME01 | moe E4 top1 + engram 2,3-gram 256 slots x8, d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 11992 | 3880 | - | - | 1 | 31040 | - | 0.1112 | 4.6012 | 99.61 | 0 | 0 | 0 | 0.333 | - | 0.687 | 1.071 | 0.615 | 0.671 | - |
| RE01 | recurrent moe E4 top1 R=3 deep supervision + engram 2,3-gram 256 slots x8, d16 h32 1head T28 120ex 300ep lr0.003 alpha0.01 | mlpl-repl 0.22.0 | 11992 | 9840 | - | - | 3 | 78720 | - | 0.3249 | 4.7571 | 116.4 | 0 | 0 | 0.286 | 0 | - | 0.815 | 1.081 | 0.423 | 0.741 | - |
| LD01 | shared ffn + 16 rank4 deltas top1 d16 T28 120ex 300ep lr0.003 alpha0.01 routerMACs272 | mlpl-repl 0.22.0 | 6132 | 3396 | 1024 | - | 1 | 27168 | - | 0.0486 | 3.456 | 31.69 | 0 | 0 | 0 | 0 | - | 1.682 | 1.528 | 0.241 | - | - |
| LD01r | 16 rank4 deltas only top1 d16 T28 120ex 300ep lr0.003 alpha0.01 routerMACs272 | mlpl-repl 0.22.0 | 5060 | 2324 | 1024 | - | 1 | 18592 | - | 0.0428 | 3.7896 | 44.24 | 0 | 0 | 0.286 | 0 | - | - | - | - | - | - |
| SS01 | ssm d16 s32 h32 T28 120ex 300ep lr0.003 (DN01 with the scan for attention) | mlpl-repl 0.22.0 | 3844 | 3028 | - | - | 1 | 24224 | - | 0.0242 | 4.5618 | 95.75 | 0 | 0 | 0.286 | 0.667 | - | - | - | - | - | 256 / 256 |
| DN01 | dense d16 h32 1head T28 120ex 300ep lr0.003 | mlpl-repl 0.22.0 | 3812 | 2996 | - | - | 1 | 23968 | - | 0.0202 | 3.7888 | 44.2 | 0 | 0 | 0 | 0.667 | - | - | - | - | - | 4096 / 262144 |
