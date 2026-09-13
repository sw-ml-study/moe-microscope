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
checkout at `a2aa68a4` (2026-09-12), rebuilt after the upstream
`moe-microscope-findings` saga.

## Resolved upstream (verified here)

| Finding | Upstream resolution | Commit | Local evidence |
|---|---|---|---|
| F1 `softmax` arity differed between eager and tape evaluation | `softmax(x)` defaults to the last axis eagerly, matching the tape | `ae7ec747` | probe "softmax takes one argument in eager and tape evaluation" |
| F2 user-defined functions rejected inside `grad`/`adam` | `u:` calls are inlined onto the tape | `41faf626` | probe "adam trains a list of expert models plus a router param through a user function" |
| F3 `chain(blk, blk, blk)` does not share weights | documented as by design; weight sharing is spelled by reusing one block through nested `apply` | `b28fdf45` | probe "one shared block applied R times trains through nested apply" |
| F4 `gather_rows` not differentiable; no `kl_divergence` | scatter-add backward for `gather_rows`; KL documented as `reduce_add(P * (log(P) - log(Q)))` | `e1d693af` | probes "gather_rows scatter-adds gradient" and "KL divergence is a composition" |

## Open, queued upstream as `moe-microscope-followups`

### F5: `one_hot` and `argmax` are rejected inside a traced function

```
grad(reduce_add(softmax(matmul(x, W)) * one_hot(argmax(matmul(x, W), 1), 2)), W)
# error: unsupported: grad: function 'one_hot' not supported inside grad()
```

Reproducer: `probes/f5_one_hot_in_grad.mlpl`. Workaround: compute the top-k
mask eagerly each training step and pass it into the loss as a constant
argument. Affects: every router lesson (MX01 onward). Proposed fix: treat
index and mask builtins (`argmax`, `argtop_k`, `one_hot`, `eq`, `gt`, `lt`)
as stop-gradient constants on the tape.

### F6: `repeat` is rejected inside a traced function

Reproducer: `probes/f6_repeat_in_grad.mlpl` ("expression form not supported
inside grad()"). Workaround: nested `apply` per depth, one user function per
`R` value. Affects: RC01, RM01, RE01. Proposed fix: unroll `repeat N` with a
literal or bound integer `N` onto the tape.

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

### D1: `grad` of a pre-evaluated loss variable is silently zero

```
l = reduce_add(W * W)
grad(l, W)                     # [0, 0]  (l is a constant on the tape)
grad(reduce_add(W * W), W)     # [2, 4]
```

Reproducer: `probes/d1_silent_zero_grad.mlpl`. Proposed fix: a loud error
when the `wrt` leaf does not appear on the tape of the expression.

## Still to be probed

- `emit_frame` inside `train { }` on the connect path: does every step
  stream, or only the last? Deferred to Saga 1 step 6, which records DN01
  over live SSE against the peer schema.
- `device("mlx") { }` at lab scale for the MoE loss written as user
  functions; deferred until a lesson runs at lab scale.
