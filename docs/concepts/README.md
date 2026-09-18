# Concepts

A visual learning path. Each step adds one mechanism and asks one
question; each page answers what problem the mechanism solves, the basic
idea, what the microscope measures, what would demonstrate value, and
which experiments exist. Pages read front to back in this order.

```mermaid
flowchart LR
  A[1 Dense model] --> B[2 Add experts]
  B --> C[3 Route to top-k]
  C --> D[4 Skip inactive experts]
  D --> E[5 Reuse one block recursively]
  E --> F[6 Add Engram memory]
  F --> G[7 Quantize experts]
  G --> H[8 Keep only hot experts resident]
  H --> I[9 Schedule across CPU and NPU]
```

| Step | Question | Page | Status |
|---|---|---|---|
| 1 | How good is a tiny dense model? | [Dense versus MoE](dense-vs-moe.md) | measured (DN01) |
| 2, 3 | Can we store more model than we execute, and what does the second expert cost? | [Routing and top-k](routing.md) | measured (MX01, MX02) |
| 4 | Can conditional compute actually avoid the unused work? | [Sparse dispatch](sparse-dispatch.md) | measured (SD01, GB01) |
| 2b | How many experts can we afford? | [Low-rank delta experts](delta-experts.md) | measured (LD01) |
| 5 | Can compute replace parameters? | [Recurrence](recurrence.md) | measured (RC01, RM01) |
| 6 | Can cheap lookup memory replace learned memorization? | [Engram](engram.md) | measured (EG01, RE01) |
| 6b | Can a teacher improve a tiny student? | [Distillation](distillation.md) | teacher fixture exists (TE01) |
| 7 | How many experts fit in the same storage? | [Quantization](quantization.md) | projected (RB01) |
| 8 | Does the whole model need to be resident? | [Expert cache](expert-cache.md) | estimated (RB01) |
| 9 | Should every expert run on the same device? | [Heterogeneous execution](heterogeneous-execution.md) | planned |
| 10 | Can a state-space block replace attention, and does a hybrid keep the best of each? | [State-space block](state-space.md) | measured (SS01: constant 256 B state, validation loss 4.56 against 3.79); SS02 and HA01 next |

## Resource allocation axes

The four sparsities the project started with, extended by
[`research4.txt`](../research/research4.txt) to the axes a tiny model on a
small CPU has to allocate; each has, or will have, a lesson that turns it
on alone against the dense baseline.

| Axis | The question it answers | Mechanism | Where it is measured |
|---|---|---|---|
| Compute | which computation executes? | top-k routing and sparse dispatch | MX01, MX02, SD01 |
| Parameters | how many transformations share weights? | recurrence | RC01, RM01, RE01 (measured) |
| Memory | what can be retrieved instead of recomputed? | Engram | EG01, RE01 (measured; not yet valuable at 90 windows) |
| State | how much sequence history stays resident? | state-space block | SS01 (measured: 256 B at any history against 262,144 B for attention at 1,024 tokens); SS02, HA01 (Saga 7) |
| Residency | what must be in fast memory right now? | expert cache | XC01 (planned); RB01 gives the estimates |
| Precision | how many bits represent each parameter? | quantization | QZ01 (planned); RB01 projects |
| Time | how many future tokens can one state predict? | multi-token prediction | MT01 to MT03 (planned, Saga 10) |

## The parts and why they exist

| Part | Job | Why it matters |
|---|---|---|
| Router | chooses experts per token | activates only useful capacity |
| Experts | learn different transformations | raise stored capacity |
| Top-k | sets experts used per token | the quality-versus-compute knob |
| Load balancing | prevents expert collapse | keeps capacity usable |
| Sparse dispatch | runs only selected experts | turns sparsity into less work |
| Recurrence | reuses one block several times | more computation without more parameters |
| State-space block | carries the context in a fixed-size state that decays per token | constant memory per token during decode; attention kept only where recall needs it |
| Engram | retrieves memorized n-gram information | moves lookup-like knowledge out of weights |
| Distillation | transfers behavior from a larger model | improves tiny-model quality |
| Quantization | shrinks expert representation | lets more experts fit in memory |
| Expert cache | keeps hot experts in fast memory | lets the model exceed fast memory |
| CPU/NPU scheduling | sends work where it fits | exploits heterogeneous hardware |
| Packed model | bounded inference artifact | tests whether the design fits constrained devices |

Metrics are grouped the same way everywhere: quality (exact match by task
family and overall), model economics (total and active parameters, bytes
per token), runtime (expert evaluations, cache hits, latency), and
diagnostics (loss, perplexity, entropy, KL, balance).
