# sw-MLPL capability ledger

Status combines source inspection of the adjacent `../sw-mlpl` checkout
(`mlpl-repl 0.22.0`, language reference, shipped demos) with native mlplunit
probes once Saga 1 step 2 lands. No item is an authorized upstream request.

## Supported

| Capability | Current evidence | Initial use |
|---|---|---|
| Model DSL (`embed`, `linear`, `chain`, `residual`, `rms_norm`, `causal_attention`, `relu_layer`, `apply`, `freeze`, `param_count`) | language reference; `demos/tiny_lm.mlpl` | dense baseline, shared block, expert FFNs |
| Reverse-mode autograd and `adam` over a param, a list of params, or a model | reference; `momentum_sgd`/`adam` entries | training every variant |
| `train N { }` with `last_losses`, `experiment "name" { }`, `loss_curve` | reference; tiny LM demos | training loops and loss evidence |
| LM helpers (`train_bpe`, `tokenize_bytes`, `shift_pairs_x/y`, `cross_entropy`, `perplexity`, `softmax`, `top_k`, `sample`, `attention_weights`) | Saga 13 milestone in `../sw-mlpl` | tokenization, windows, loss, sampling |
| KV-cached generation (`gen_state`, `gen_logits`, `gen_append`, `gen_clone`, `gen_reset`, `gen_stats`) | reference; kv-cache design | decode-phase cache lessons |
| Engram builtins (`ngram_hash`, `engram`, `apply_engram`, `engram_stats`, `engram_train_step`) | reference; `demos/tiny_lm_engram_mlx.mlpl` | parity target for the from-scratch Engram; addressing primitive |
| Routing primitives (`argtop_k`, `argmax`, `gather_rows`, `compress`, `one_hot`, `eq`/`gt`/`lt`, `scatter`, `concat` with axis, `take`) | reference | router masks, dispatch tables, specialization maps |
| Bounded byte I/O (`read_bytes` with offset/length, `read_bytes_packed`, `write_bytes`, `write_atomic`, `append_bytes`, `file_size`, `to_native`/`parse_native`, `to_json`) | reference; `../demo-ml-utils` demos | packed TinyMoE file, per-expert reads |
| Monotonic `clock_ms()` | reference | wall-clock secondary speed metric |
| Numeric observation `emit_frame(name, step, x)` returning `x` | peer measured contract in `../demo-ml-microscope` | assembly primitive for recorded observations |
| Static visuals (`svg` heatmap/scatter/curves/equation, `loss_curve`, hand-written SVG strings) | reference; peer previews | committed diagrams |
| MLX device scope `device("mlx") { }` | Engram MLX demo | opt-in lab scale |

## Awkward but apparently expressible

| Capability | Why awkward | Downstream experiment |
|---|---|---|
| Sparse expert dispatch | no scatter-add or batched gather across experts on the tape; per-token loops in the interpreter | dense-masked training plus forward-only sparse dispatch with parity assertion |
| Top-k gate on the tape | `argtop_k` is not differentiable; gate must be softmax over masked logits | masked-softmax probe in step 2 |
| Integer arithmetic | arrays are f64; hashing exact below 2^53, no bitwise XOR | mul-add-mod hashing (already how `ngram_hash` is specified) |
| Quantized weights | no integer dtype; INT8/INT4 are integer-valued f64 arrays plus packed byte files | byte accounting from packed files, not from in-memory arrays |
| Multiple observations per step and non-numeric annotations | numeric-only frames; no typed envelope | stable slash names plus lesson text, as in the peer |
| Wall-clock speed | interpreter timing is machine-dependent | counted costs are primary; `clock_ms()` reported with binary version |

## To be probed in Saga 1 step 2

1. `adam(loss, [expert_0, expert_1, router, shared], ...)` over a mixed list
   of models and raw params in one call.
2. Gradient flow through the same model applied `R` times inside `repeat`
   with an accumulated loss.
3. Differentiability of `gather_rows` and of `softmax` over masked logits.
4. Existence and signature of a KL-divergence builtin; otherwise KL is
   written from `softmax` and `log`.
5. Interpreter cost of a per-token routing loop at `T` 16, `E` 8, measured
   with `clock_ms()`.
6. Whether `emit_frame` inside `train { }` streams every step or only the
   final one on the connect path.

A confirmed blocker must add a minimal `.mlpl` reproducer, the configured
binary version, expected signature and semantics, positive/negative/boundary
acceptance cases, affected lessons, and an explicit currently-unavailable
result. Until then, no `sw-mlpl` change is requested.
