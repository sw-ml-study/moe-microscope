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
| F11 nested traced call lost a parameter used in index arithmetic | gather index arithmetic resolves in the traced scope | `813526d6`, verified against the 13:29 rebuilt binary | probe file expects success ("grad rows 0 0 0" then the selected rows of ones); lessons keep eager slicing by choice |
| F13 `attention_weights` could not find an attention layer inside `residual(chain(...))` | the walk now enters `residual` and nested `chain` blocks | `8282cd6a`, verified against the 14:37 rebuilt binary | probe file expects success ("weights 5 5"); DN01 keeps its explicit residual by choice, for readability |
| F16 `eval_stream` had no include, sandbox, or args | the eval request takes an `includes` map (in-memory provider, relative-only and no-escape), `--fs-root` gives a filesystem sandbox, and an `args` field feeds `args()` | `902f14e2`, `855fb551`, `f85cc657`, verified against the 16:35 rebuilt server | `scripts/run-emit-frame-loops` resolves nested includes through the map; residual: a parent-relative include (`../lib/x.mlpl`, how the demos are written) is refused by the no-escape rule, so `scripts/bundle-program` stays until a program path can be declared |
| F19 matmul inner-dimension mismatch inside `grad` panicked the process | a structured "shape mismatch: 8 vs 16 elements" error, no panic | `bbcf59dc`, verified against the 2026-09-15 11:36 rebuilt binary | probe file expects the error and forbids a panic |
| F20 `take`'s index parameter unbound inside an inlined function on the tape | the axis and index resolve in the traced scope; out-of-range is a clean error | `e6070964`, verified against the 2026-09-15 11:36 rebuilt binary | probe file expects success (`grad 1 7 1 1`) |
| F21 `adam` inside a user function trained local copies | the optimizer step inside an inlined user function updates the global param and model | `9d69cd04`, verified against the 2026-09-15 13:14 rebuilt binary | probe file expects `param moved 1 model moved 1` |
| F22 `adam` state keyed by name outlived a re-created model, and the step counter was global | `reset_optimizer()`, moments cleared on rebind, and a per-parameter Adam step counter | `7d89e953` and `3ffd7266`, verified against the 2026-09-15 20:08 rebuilt binary | probe file expects `same 1`; the global step counter had also contaminated a second model with distinct names (LD01r, re-measured) |
| F23 (second form) reshape dims bound to function parameters lost the gradient inside `grad` | reshape, window, and reduce dims resolve through the traced scope | `fca6043c`, verified against the 2026-09-16 11:08 rebuilt binary | probe `f23b` expects the literal and parameter forms to agree; the shape-derived first form stays open below |
| F24 `apply_engram`'s ids bound to a function parameter were not seen inside `grad` | the ids resolve through the traced scope | `1b4d29e5`, verified against the 2026-09-16 11:08 rebuilt binary | probe file expects the global and parameter forms to agree |
| S1 stale adjacent `mlpl-serve` | serve is rebuilt on evaluator changes | process | `scripts/select-mlpl-serve` prefers `MLPL_SERVE`, then a local build, then the adjacent binary |

## Open, queued upstream as `moe-microscope-followups` (F7, F8, F17, and F23's shape-derived form; upstream shipped F19 to F22 on 2026-09-15 and F23's parameter form and F24 on 2026-09-16)

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

### F23: a reshape whose row count comes from `shape()` loses the gradient inside `grad`

```
def u:lit(x) { g = softmax(matmul(x, W)); reshape(take(g, 1, 0), [4, 1]) * x }
def u:der(x) { g = softmax(matmul(x, W)); n = reduce_mul(shape(take(g, 1, 0))); reshape(take(g, 1, 0), [n, 1]) * x }
grad(reduce_add(u:lit(x) * u:lit(x)), W)   # a gradient
grad(reduce_add(u:der(x) * u:der(x)), W)   # error: the loss does not depend on 'W'
```

Reproducer: `probes/f23_shape_derived_reshape_in_grad.mlpl`. Met in RM01:
the mixture block computed its gate row count from the gate's shape so
that prompts of any length could pass through it, and the R = 2 run
collapsed onto expert 0 (loads 406, 0, 0, 0; change share 0; every
accuracy 0) with no error, because the router's gradient vanished while
the experts still trained. With a literal count the same run routes
normally (loads 145, 101, 110, 50). In the small reproducer the loss
depends on W only through the reshaped gate, so the tape reports "no
gradient flows"; in the lesson the experts kept a path to the loss and
the failure was silent. Second form (EG01, `probes/f23b_param_bound_reshape_in_grad.mlpl`):
dims bound to user-function parameters (`reshape(x, [n, w])` with `n`
and `w` arguments) lost the gradient the same way; resolved upstream on
2026-09-16 (`fca6043c`), the probe now expects agreement. The
shape-derived form of this entry is what remains open. Workaround: literal or global shapes inside
traced blocks (the window length and the retrieved width are globals),
and pad evaluation prompts to that length. Affects: any traced block that
sizes a reshape from a value's shape or from an argument. Proposed fix: treat `shape()` of a tracked value as a constant
whose consumer keeps the tracked operand differentiable, or reject
shape-derived reshapes inside `grad` with an error instead of dropping
the gradient.

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
