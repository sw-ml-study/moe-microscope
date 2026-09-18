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
measured. The SAN01 rows are the dense docents with the hidden layer
removed (sw-atlas's no-FFN question). Economics are parameters, active
parameters per query, and bytes at f64 and INT8; runtime is milliseconds per
query in the interpreter. Routing diagnostics apply to CD02 onward. CD00 (no
model) has its row in the [results table](results.md).

| Lesson | Config | Binary | Params | Active params/query | Bytes f64 | Bytes INT8 | ms/query | Train loss | Val loss | Intent acc | Dest acc | Top-3 acc | Exhibit acc | Ambiguous top-2 | Unsupported recall | Paraphrase acc | Paraphrase intent acc | Expert evals | Router entropy | Balance | Specialization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CD01 | docent dense S1024 F24 d24 h32 relu, corpus A train rows, 40 ep, lr 0.003, per-row adam | mlpl-repl 0.22.0 | 26003 | 1664 | 208024 | 26003 | 0.907 | 0 | 1.4972 | 0.938 | 0.925 | 0.963 | 0.927 | 0.091 | 0.3 | 0.296 | 0.481 | 0 | - | - | - |
| MB01 | mockup alias-and-concept matcher ported to MLPL: title 2, aliases 3, concepts 4, tagline 1.5, partial 0.8, phrase +4; 284 signals; no training | mlpl-repl 0.22.0 | 0 | 0 | 2272 | 284 | 80.4705 | - | - | 0.78 | 0.954 | 0.996 | 0.99 | 0.091 | 1 | 0.63 | 0.463 | 0 | - | - | - |
| MB01t | the same matcher over all catalog text (stories and status sentences at 1); 1010 signals; no training | mlpl-repl 0.22.0 | 0 | 0 | 8080 | 1010 | 82.9366 | - | - | 0.759 | 0.925 | 0.983 | 0.99 | 0.091 | 0.4 | 0.685 | 0.481 | 0 | - | - | - |
| CD01b | docent dense over word vectors (PPMI rank-24 on docs-a.txt, 586 words) in a 1024-slot table, fine-tuned; corpus A, 40 ep, lr 0.003; one process per variant | mlpl-repl 0.22.0 | 26003 | 1664 | 208024 | 26003 | 1.4239 | 0 | 1.6966 | 0.942 | 0.917 | 0.959 | 0.917 | 0.182 | 0.3 | 0.407 | 0.407 | 0 | - | - | - |
| CD01bf | the same with the table frozen: only the body and heads train; one process per variant | mlpl-repl 0.22.0 | 26003 | 1664 | 208024 | 26003 | 1.4149 | 2.24 | 2.9739 | 0.647 | 0.407 | 0.747 | 0.292 | 0.091 | 0.3 | 0.204 | 0.426 | 0 | - | - | - |
| SAN01 | no-FFN docent: hashed S1024 F24 d25, heads on the pooled embedding, no hidden layer (26094 params against CD01's 26003); corpus A, 40 ep, lr 0.003, per-row adam | mlpl-repl 0.22.0 | 26094 | 741 | 208752 | 26094 | 0.9873 | 0 | 1.1912 | 0.946 | 0.934 | 0.971 | 0.938 | 0.273 | 0.5 | 0.389 | 0.481 | 0 | - | - | - |
| SAN01b | no-FFN docent over word vectors (PPMI rank-24 on docs-a.txt, 586 words) in a 1024-slot table, fine-tuned, heads on the pooled rows, no hidden layer (25051 params against CD01b's 26003); corpus A, 40 ep, lr 0.003 | mlpl-repl 0.22.0 | 25051 | 712 | 200408 | 25051 | 1.4627 | 0 | 1.1684 | 0.938 | 0.925 | 0.967 | 0.927 | 0.545 | 0.3 | 0.444 | 0.463 | 0 | - | - | - |
