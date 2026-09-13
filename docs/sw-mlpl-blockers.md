# sw-MLPL capability ledger

Status combines source inspection of the adjacent `../sw-mlpl` checkout
(`mlpl-repl 0.22.0` at `a2aa68a4`, language reference, shipped demos) with
the native mlplunit probes in `tests/test_capability_probes.mlpl` and
`tests/test_observe.mlpl`, and the standalone reproducers under `probes/`.
Gaps with reproducers are written up as upstream work orders in
[`sw-mlpl-findings.md`](sw-mlpl-findings.md).

## Supported

| Capability | Current evidence | Initial use |
|---|---|---|
| Model DSL (`embed`, `linear`, `chain`, `residual`, `rms_norm`, `causal_attention`, `relu_layer`, `apply`, `freeze`, `param_count`) | language reference; `demos/tiny_lm.mlpl` | dense baseline, shared block, expert FFNs |
| Reverse-mode autograd and `adam` over a mixed list of models and params, with the loss written as user functions | probe "adam trains a list of expert models plus a router param through a user function" | training every variant as reusable source |
| One shared block applied `R` times by nested `apply` | probe "one shared block applied R times trains through nested apply"; `chain` copies rather than shares (F3, documented) | recurrence lessons |
| `gather_rows` on the tape (scatter-add backward) | probe "gather_rows scatter-adds gradient into addressed rows only" (F4) | from-scratch Engram addressing that trains |
| KL divergence as `reduce_add(P * (log(P) - log(Q)))`, eager and on the tape | probe "KL divergence is a composition of shipped builtins" | token-level distillation |
| `softmax(x)` with one argument, eager and on the tape | probe "softmax takes one argument in eager and tape evaluation" (F1) | one loss expression for evaluation and training |
| Packed INT8 bytes with bounded `read_bytes(path, offset, length)` | probe "packed INT8 expert bytes round-trip through a bounded range read" | packed TinyMoE file, per-expert reads |
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
| Sparse expert dispatch | no batched gather across experts on the tape; per-token loops in the interpreter (16 routing decisions measured well under a millisecond) | dense-masked training plus forward-only sparse dispatch with parity assertion |
| Top-k gate on the tape | `argmax`/`one_hot`/`argtop_k` are rejected inside `grad` (F5), so the mask is computed eagerly each step and passed in as a constant; the Switch-style gate `softmax(logits) * mask` then gives the router a gradient (a renormalized top-1 gate is identically 1 and gives none) | probe "adam trains a list of expert models..." |
| Recurrence depth as a runtime value | `repeat` is rejected inside a traced function (F6) | one user function per depth, nested `apply` |
| Models as user-function parameters | models cannot be arguments (F7); they are reached as globals | lesson helpers name their globals |
| Observation facade | `emit_frame` requires a literal name (F8); no forwarding wrapper is possible | `lib/observe.mlpl` provides naming helpers only |
| Pre-evaluated loss variables | `grad(l, W)` on an assigned `l` is silently zero (D1) | always write the loss as an expression or user-function call |
| Rank-one gather, reverse, sort | `gather_rows` is rank-two only; no `reverse` or value `sort` builtin | `u:domain_slice` reshapes to a column, gathers, reshapes back; sort is `gather_rows(column, grade_up(v))` |
| String lists | no append; `for` does not iterate a string list | accumulate a `;`-joined string and `str_split` it; index with `list_get` in a `while` loop |
| Dynamic record access | `record_get(r, key)` returns a Result | `unwrap` before `type_of` or use |
| Script includes | `include` resolves relative to the script directory, sandboxed under `--source-dir` | demos use `../lib/...`; tests use `lib/...` through mlplunit's source root |
| Integer arithmetic | arrays are f64; hashing exact below 2^53, no bitwise XOR | mul-add-mod hashing (already how `ngram_hash` is specified) |
| Quantized weights | no integer dtype; INT8/INT4 are integer-valued f64 arrays plus packed byte files | byte accounting from packed files, not from in-memory arrays |
| Multiple observations per step and non-numeric annotations | numeric-only frames; no typed envelope | stable slash names plus lesson text, as in the peer |
| Wall-clock speed | interpreter timing is machine-dependent | counted costs are primary; `clock_ms()` reported with binary version |

## Blocked (pinned by probes, queued upstream)

| Finding | Pinned by | Workaround in use |
|---|---|---|
| F5 index/mask builtins inside `grad` | probe "one_hot and argmax are rejected inside a traced function"; `probes/f5_one_hot_in_grad.mlpl` | eager mask passed as a constant |
| F6 `repeat` inside a traced function | probe "repeat inside a traced function is rejected"; `probes/f6_repeat_in_grad.mlpl` | nested `apply` |
| F7 model as user-function argument | probe "a model value cannot be a user-function argument"; `probes/f7_model_argument.mlpl` | globals |
| F8 `emit_frame` literal name | probe "emit_frame rejects a name held in a variable"; `probes/f8_emit_frame_name.mlpl` | literal names |
| D1 silent zero gradient | probe "grad of a pre-evaluated loss variable is silently zero"; `probes/d1_silent_zero_grad.mlpl` | expression-form losses |

## Still to be probed

1. Whether `emit_frame` inside `train { }` streams every step or only the
   final one on the connect path (Saga 1 step 6).
2. The user-function MoE loss under `device("mlx") { }` at lab scale.

A confirmed blocker must add a minimal `.mlpl` reproducer, the configured
binary version, expected signature and semantics, positive/negative/boundary
acceptance cases, affected lessons, and an explicit currently-unavailable
result. Until then, no `sw-mlpl` change is requested.
