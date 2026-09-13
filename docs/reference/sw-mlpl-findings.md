# sw-MLPL dogfooding findings

This repository dogfoods sw-MLPL (and, for the visualization host,
`../demo-extensions`). Every gap met while building the microscope is
recorded here with a reproducer, a workaround, the lesson it affects, and its
upstream status. The executable evidence is `tests/test_capability_probes.mlpl`
and `tests/test_observe.mlpl` (native mlplunit) plus the standalone
reproducers under `probes/` that `scripts/run-probes` re-checks on every
`just check`. When an upstream fix lands, the pinned probe fails loudly and
this document is updated in the same step.

Binary under test: `mlpl-repl 0.22.0` from the adjacent `../sw-mlpl`
checkout at `369cfeb1` (2026-09-13), rebuilt after the fourth step of the
upstream `moe-microscope-followups-2` saga (`mlpl-repl` 08:11, `mlpl-serve`
2026-09-12 21:51).

## Resolved upstream (verified here)

| Finding | Upstream resolution | Commit | Local evidence |
|---|---|---|---|
| F1 `softmax` arity differed between eager and tape evaluation | `softmax(x)` defaults to the last axis eagerly, matching the tape | `ae7ec747` | probe "softmax takes one argument in eager and tape evaluation" |
| F2 user-defined functions rejected inside `grad`/`adam` | `u:` calls are inlined onto the tape | `41faf626` | probe "adam trains a list of expert models plus a router param through a user function" |
| F3 `chain(blk, blk, blk)` does not share weights | documented as by design; weight sharing is spelled by reusing one block through nested `apply` | `b28fdf45` | probe "one shared block applied R times trains through nested apply" |
| F4 `gather_rows` not differentiable; no `kl_divergence` | scatter-add backward for `gather_rows`; KL documented as `reduce_add(P * (log(P) - log(Q)))` | `e1d693af` | probes "gather_rows scatter-adds gradient" and "KL divergence is a composition" |
| F6 `repeat` rejected inside a traced function | `repeat N` with a literal count unrolls onto the tape | `a9ae2a79` | probe "repeat with a literal count unrolls inside a traced function"; `probes/f6_repeat_in_grad.mlpl` expects success |
| F10 labeled positional table panicked the tape inside a residual block | partial axis labels are unified per axis, so a labeled table broadcasts against an unlabeled activation on the tape as eagerly | `9cd62367` | probe file expects success; `u:positions` keeps stripping labels only as documentation of the old workaround |
| F18 shape mismatch inside `grad` panicked the process | the tape now reports "shape mismatch: 4 vs 3 elements" as a structured error | upstream `followups-2`, verified against the 08:11 rebuilt binary | probe requires the error and fails if the process panics |
| F15 `repeat` with a parameter-bound count failed inside `grad` | the count resolves in the traced scope | `369cfeb1` | probe file expects success; depth can now be a function argument |
| F9 `embed` rejected the documented `[B, T]` input | rank-two tokens return `[B, T, d]` | `042d2d79` | probe file expects success; DN01 keeps per-example training by choice (no cross-example attention, no shared positions) |
| F14 `fill`/`zeros`/`ones` rejected inside `grad` | constant constructors are constant leaves on the tape | `61da67ae` | probe file expects success |
| D1 silent zero gradient for an untracked `wrt` leaf | loud error: "the loss does not depend on 'W' (no gradient flows to it)" | upstream `moe-microscope-followups` step 3 | probe "grad of a pre-evaluated loss variable raises a loud error"; `probes/d1_silent_zero_grad.mlpl` expects the error |
| F5 `one_hot`/`argmax` rejected inside `grad` | index and mask builtins (`argmax`, `one_hot`, `eq`, `gt`, `lt`, `argtop_k`) are stop-gradient constants on the tape | `54ad5849` | probe "one_hot and argmax act as stop-gradient constants"; `probes/f5_one_hot_in_grad.mlpl` now expects success |
| F12 shape-derived size arithmetic rejected inside `grad` | parameter-independent subexpressions such as `reduce_mul(shape(...))` are constant-folded on the tape | `82e55a6a`, verified against the 12:52 rebuilt binary | probe file expects success ("grad 3 3 3"); `u:masked_ce` keeps its explicit `vocab` argument by choice |

## Open, queued upstream as `moe-microscope-followups` (F7, F8, F11, F13, F16, F17, S1; upstream is working F11 and F13 in `followups-2`)

### F7: a model value cannot be a user-function argument

```
def u:apply_twice(b, x0) { "..."; apply(b, apply(b, x0)) }
u:apply_twice(linear(2, 2, 1), [[1, 1]])
# error: unsupported: u:apply_twice: argument 'b' must be an array, Result,
#        string, string list, record, function reference, or partial
```

Reproducer: `probes/f7_model_argument.mlpl`. Workaround: refer to models as
globals inside user functions. Affects: reusable lesson source; every helper
that would take an expert, block, or router as a parameter. Proposed fix:
allow `Value::Model` (and tokenizer, generation state, engram) as user-function
arguments by reference.

### F8: `emit_frame` requires a literal name

```
name = str_concat("probe/", "dynamic")
emit_frame(name, 0, [1, 2, 3])
# error: unsupported: emit_frame: name must be a string literal
```

Reproducer: `probes/f8_emit_frame_name.mlpl`. Consequence: an identity
facade `u:observe(name, step, x)` cannot exist, so `lib/observe.mlpl` provides
only naming helpers and lessons call `emit_frame` with literal names.
Affects: observation facade, any generated or parameterized observation name
(per-expert, per-recurrence, per-cache-slot series). Proposed fix: accept any
string value for the name, or document the literal rule and provide a
`str`-valued form.

### F11: a nested user-function call inside `grad` loses a parameter used in index arithmetic

```
def u:rows(M, start, count) { "..."; gather_rows(M, start + range(count)) }
def u:second_pair(M) { "..."; u:rows(M, 1, 2) }
u:second_pair(W)                                 # eager: rows 1 and 2
grad(reduce_add(u:second_pair(W)), W)            # error: undefined variable: start
```

Reproducer: `probes/f11_nested_param_binding_in_grad.mlpl`. A one-level
call with plain arithmetic (`u:inner(w, 3)` returning `a * k`) traces fine,
so the failure is specific to the nested call whose parameter feeds `range`
and `gather_rows`. Workaround: slice chunks eagerly before the loss and pass
arrays into the loss function. Affects: any lesson helper that slices inside
the loss. Proposed fix: bind nested-call parameters in the inliner's scope
before walking index expressions.

### F13: `attention_weights` cannot find an attention layer inside `residual(chain(...))`

```
body = chain(residual(chain(rms_norm(8), causal_attention(8, 1, 1))), linear(8, 20, 2))
attention_weights(body, h)
# error: unsupported: attention_weights: no Attention layer found in model
```

Reproducer: `probes/f13_attention_weights_residual.mlpl`. Workaround: keep
the attention sub-model as its own global and write the residual by hand
(`h1 = h0 + apply(att, h0)`); `attention_weights(att, h0)` then works and the
weights are shared because the same model value is applied. This spelling is
also more readable for the microscope. Affects: DN01 attention diagram.
Proposed fix: walk `residual` and nested `chain` blocks in `attention_weights`.

### F16: the `eval_stream` surface has no source provider, sandbox, or arguments

```
include "lib/observe.mlpl"     # error: include is a script-mode construct ... this surface has no source provider
read_text("fixtures/x.json")   # Err(read_text: no filesystem sandbox on this surface ...)
args()                          # empty
```

Reproducer: `scripts/run-emit-frame-loops` (third check). A lesson that is
split into library modules cannot be submitted to `mlpl-serve` as written.
Workaround: `scripts/bundle-program` inlines the include tree into one
program, the mixture fixture has an inline twin (`u:domain_mixture_v0`,
pinned equal by test), and file writes are skipped when `args()` is empty.
Affects: every recorded lesson. Proposed fix: let a session declare a
read-only source root (or accept a multi-file program body) so includes and
fixture reads work on the connect path.

### F17: record field access is rejected inside `grad`

```
r = {a: [3, 4]}
grad(reduce_add(r.a * W), W)     # error: unsupported: grad: expression form not supported inside grad()
```

Reproducer: `probes/f17_record_field_in_grad.mlpl`. `take(M, 0, i)` with a
variable index is accepted, so the gap is the `r.field` expression form.
Workaround: bind fields to variables eagerly before the loss. Affects: every
lesson that keeps windows in a record. Proposed fix: evaluate field access
as a constant (or trace it when the record holds a tracked value).

### S1: the adjacent `mlpl-serve` binary was stale

`../sw-mlpl/target/release/mlpl-serve` dated 2026-09-09 rejected
`u:masked_ce` inside `grad` because it predates the F2 fix, while
`mlpl-repl` had been rebuilt. `scripts/build-local-serve` builds a current
server from the adjacent source into this repository's ignored
`tmp/sw-mlpl-target` (a separate `CARGO_TARGET_DIR`), and
`scripts/select-mlpl-serve` prefers an absolute `MLPL_SERVE`, then that local
build, then the adjacent release binary; nothing in the sibling is modified.
Upstream's rebuild step should include `mlpl-serve` (and `mlpl-web`) whenever
the evaluator changes.

## Still to be probed

- `emit_frame` inside `train` and `while` loops on the connect path streams
  every iteration in order (`train` interleaves `metric` events); proven by
  `scripts/run-emit-frame-loops`. Resolved.
- `device("mlx") { }` at lab scale for the MoE loss written as user
  functions; deferred until a lesson runs at lab scale.
