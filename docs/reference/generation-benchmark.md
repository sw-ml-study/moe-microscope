# Generation benchmark (GB01)

Measured with `mlpl-repl 0.22.0` on the machine named in `fixtures/benchmark/generation-v0.json`; regenerate with `just benchmark write` (seconds). Legend: **M** measured directly, **D** derived from measured values, **E** estimate. Models are freshly built with the lesson architectures; latency does not depend on weight values. Every forward runs the full 28-token window (the mixture blocks are fixed to the window length), so a generated token costs one window forward; there is no KV cache on this path yet.

| Model | Build [M] | Cold TTFT [M] | Warm TTFT [M] | Prefill tok/s [D] | Gen tok/s [M] | p50 token [M] | p95 token [M] | max token [M] | Expert evals/token [D] |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| DN01 dense | 0.4045 ms | 0.228 ms | 0.1764 ms | 158747.0324 | 5961.5439 | 0.1638 ms | 0.1874 ms | 0.2017 ms | 1 FFN |
| MX01 top-1 (sparse dispatch) | - | 0.3937 ms | 0.3166 ms | 88444.3368 | 3174.1057 | 0.3074 ms | 0.3392 ms | 0.3723 ms | 1 |
| MX02 top-2 (sparse dispatch) | - | 0.5086 ms | 0.4868 ms | 57514.0576 | 2019.8195 | 0.4801 ms | 0.5908 ms | 0.6635 ms | 2 |
| LD01 shared + 16 deltas (packed) | - | 0.3199 ms | 0.3039 ms | 92126.1279 | 3109.446 | 0.3074 ms | 0.3542 ms | 0.499 ms | 1 + shared |

Definitions: build is the time to construct all four models' parameters; cold TTFT is the first forward of an already-encoded padded prompt after building; warm TTFT is the mean of 20 further prompt forwards (encoding excluded); prefill tok/s is the window length over warm TTFT; generation tok/s and the percentiles come from 60 greedy tokens (10 prompts times 6 new tokens), each one full-window forward; expert evaluations per token are by construction. Peak memory is not exposed by the interpreter [M needed]. Model-open time will exist once PK01 writes a packed file.

What to read from it: MX01 and MX02 pay the sparse-dispatch bookkeeping (SD01) on every token, so at this size the mixture is slower than the dense model even though it touches about the same bytes; LD01's packed deltas add two matmuls and no per-expert loop. These are interpreter timings on one machine and say nothing about a compiled runtime; the counted columns in the results table are the portable metric.
