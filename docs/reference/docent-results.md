# Docent results table

One row per campus docent run (the CD series), appended by each lesson's
results writer and checked by the gate. Quality columns are exact match on
held-out rows: intent accuracy (six intents including unsupported),
destination accuracy over the nine places plus none, top-3 destination
accuracy, exhibit accuracy (held-out rows whose destination is one of the
three exhibits), the share of authored ambiguous rows whose top-2 set equals
the expected pair, unsupported recall, and accuracy on the held-out
paraphrase set (`fixtures/campus/paraphrases-a.json`: phrasings that
contain no alias verbatim, plus off-topic questions, never trained on),
where the value of a model over the deterministic matcher (MB01) is
measured. Economics are parameters, active
parameters per query, and bytes at f64 and INT8; runtime is milliseconds per
query in the interpreter. Routing diagnostics apply to CD02 onward. CD00 (no
model) has its row in the [results table](results.md).

| Lesson | Config | Binary | Params | Active params/query | Bytes f64 | Bytes INT8 | ms/query | Train loss | Val loss | Intent acc | Dest acc | Top-3 acc | Exhibit acc | Ambiguous top-2 | Unsupported recall | Paraphrase acc | Paraphrase intent acc | Expert evals | Router entropy | Balance | Specialization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CD01 | docent dense S1024 F24 d24 h32 relu, corpus A train rows, 40 ep, lr 0.003, per-row adam | mlpl-repl 0.22.0 | 26003 | 1664 | 208024 | 26003 | 0.907 | 0 | 1.4972 | 0.938 | 0.925 | 0.963 | 0.927 | 0.091 | 0.3 | 0.296 | 0.481 | 0 | - | - | - |
