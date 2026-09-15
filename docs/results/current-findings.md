# Current findings

What can reasonably be concluded today, each as evidence, interpretation,
and limitation. Numbers are from the [results table](../reference/results.md),
[resource economics](resource-economics.md), and the
[generation benchmark](../reference/generation-benchmark.md).

## 1. Sparse capacity works

Evidence: DN01 stores 3,812 parameters and touches 2,996 per token; MX01
stores 7,096 and touches 3,064; validation loss 3.79 against 3.76.

Interpretation: top-1 routing nearly doubles stored capacity without nearly
doubling per-token parameter use, at unchanged quality.

Confidence: strong for this architecture and scale.

Limitation: it does not establish better held-out quality; DS01 shows that
takes data.

## 2. Experts specialize

Evidence: specialization score 0.61 for top-1 against 0.25 family-blind;
prose puts 87 percent of its tokens on one expert and arithmetic 53
percent on another; the router never saw a family tag (MX02 map).

Interpretation: the hidden states carry enough task information for the
router to segregate work. This is the property that makes expert caching,
placement, quantization, and heterogeneous execution interesting later.

Limitation: the four synthetic families are deliberately separable. This
shows specialization can emerge when the task distribution has latent
structure, not that it emerges in ordinary language.

## 3. Top-k is a cost and quality knob

Evidence: MX02 active parameters 4,136 against 3,064; expert evaluations 2
against 1; training exact match 0.86 against 0.62; the first held-out MLPL
answers (2 of 7); validation loss 3.92 against 3.76; specialization 0.42
against 0.61.

Interpretation: top-2 buys fitting capacity and occasional generalization
gains, doubles expert execution, and weakens specialization. Its value is
workload dependent.

Limitation: one data size, one seed.

## 4. Data matters more than epochs

Evidence: at 120, 480, and 960 examples, dense validation loss 3.48, 1.66,
1.11 and mixture 3.49, 1.42, 1.22; doubling epochs at 120 examples gives
3.89 and 4.17; prose held-out reaches 1.0 at 480 and above.

Interpretation: the poor early generalization was data-limited, not an
architecture failure; optimization cannot substitute for information; the
small mixture wins at 480 and loses at 960, so it does not dominate dense.

Limitation: fixed epoch budget, one seed per point, training cost grows
linearly with data.

## 5. Sparse compute saves work, not yet time

Evidence: dense-masked and sparse outputs equal to the bit over 120
windows; expert row evaluations 13,440 against 3,360; interpreter time
0.42 against 0.74 ms per window; generation 5,960 tokens per second dense
against 3,170 top-1 and 2,020 top-2.

Interpretation: reduced FLOPs do not mean reduced latency; at this scale
dispatch overhead dominates the tiny matrix products avoided, which is the
problem batching, fused kernels, and large enough experts solve at full
scale.

Limitation: interpreter timings on one machine; a compiled runtime would
move every number.

## 6. Cheap experts are worth trying

Evidence: sixteen rank-4 deltas cost 2,048 parameters against 4,288 for
four full experts; validation loss 3.46 with a shared FFN and 3.37 without,
the best in the table; no prose generalization on that run; noisier
training.

Interpretation: expert count is cheap when experts are deltas; what to buy
with the budget is the configuration frontier's question.

Limitation: one run each; the deltas-only model is linear per token and
leans on attention.

## 7. The teacher is a fixture, not a demonstration

Evidence: TE01 top-1 agreement 0.963, training exact match 0.83, held-out
accuracy 0 everywhere.

Interpretation: it provides richer soft targets than one-hot labels, which
can help distillation, but it does not model superior generalizable
behavior. A stronger teacher (more data, wider, or an external model in the
same fixture schema) is the documented option if KD01 needs one.

## 8. A trained docent does not yet beat keyword matching

Evidence: on the docent's held-out rows the mockup's deterministic matcher
scores 0.954 destination accuracy and 0.630 on paraphrases with no
parameters; the dense docent CD01 scores 0.925 and 0.296 with 26,003
parameters; the docent wins only on intent (0.938 against 0.780).

Interpretation: hashed features learn the training templates and nothing
beyond them, while the catalog's own words carry most of the signal a
matcher needs. Value must come from features that generalize (word vectors
from the campus's text) or from capacity that specializes, and it must be
shown on the paraphrase set.

Word vectors trained on the campus's own text (CD01b) lift the paraphrase
number to 0.407 fine-tuned; frozen vectors alone give 0.204: meaning helps, but a few
thousand words of text give too little of it to beat a matcher that reads
the same words directly (0.685).

Limitation: 54 paraphrases and 241 templated held-out rows; one corpus
revision.

## 9. Reusing a block buys quality per parameter, and the router re-decides

Evidence: the dense block applied twice with deep supervision (RC01)
reaches validation loss 3.45 against 3.79 for the same 3,812 parameters
applied once, and the mixture block applied three times (RM01) reaches
3.42 against 3.76 for the same 7,096 parameters. In RM01 the router runs
at every recurrence and 38 to 46 percent of tokens change expert between
consecutive recurrences; specialization is strongest at the first
recurrence (0.65) and weaker after it (0.45, 0.49).

Interpretation: compute can substitute for parameters at this scale, but
the gain is not a converging reasoning loop: the RC01 models score best
when stopped after their first recurrence, and RM01's R=2 point is worse
than R=1. Deep supervision regularizes the block; the later recurrences
are new routing decisions whose value is not yet separated from that
regularization.

Limitation: one seed per point, 90 training windows, a non-monotonic curve
over R.

RE01 adds the composition: the recurrent mixture with the Engram table in
the loop (all three sparsities) reaches training loss 0.006 and the
highest validation loss of the seven ablation rows (4.76); the router
still re-decides at every recurrence (31 percent of tokens change expert)
but specialization falls (0.53, 0.38, 0.36). The claim that compute
sparsity and memory sparsity complement each other is not supported at
this data size.

## 10. External memory is memorization capacity at this data size

Evidence: the DN01 block plus an Engram table (EG01) reaches training
loss 0.08 to 0.12 against DN01's 0.19 and validation loss 3.93 to 4.67
against 3.79, at every table size from 16 to 1,024 slots per order; prose
held-out accuracy keeps DN01's 0.667 only with the largest table. The
hand-written form and the sw-MLPL builtin agree to zero in outputs and
gradients.

Interpretation: a table addressed by the last two and three tokens gives
the model rows to write the training answers into, and 90 windows are
too few for the held-out contexts to read anything useful back. The
mechanism is verified; its value is not shown here, and the candidates
are more data (DS01's 480 and 960 points) and a frozen dense block.

Limitation: one seed, 90 training windows, one learning rate for the
table and the block.

With routing (ME01) the table takes validation loss from 3.76 to 4.60,
and with routing and recurrence (RE01) to 4.76 at training loss 0.006:
the table turns every extra mechanism's capacity into memorization. The
ablation matrix is in the [RE01 report](../experiments/RE01.md).

## Supported now versus plausible but not demonstrated

Supported: more stored than active capacity; measurable specialization; a
real top-k tradeoff; exact sparse dispatch; dispatch overhead outweighing
theoretical savings at tiny scale; data quantity governing whether
architectural differences show; a deterministic matcher as a hard baseline
for a tiny classifier over templated data; a reused block improving
validation loss per parameter, with the router re-deciding at every
recurrence.

Plausible, not demonstrated: recurrence as a converging reasoning loop;
Engram removing memorization pressure (at 90 windows it adds it, alone
and composed with routing and recurrence); distillation improving this student;
quantization raising expert count at acceptable quality; routing locality
giving useful cache hit rates; heterogeneous execution beating simpler
placement; the whole design being useful within 256 MB and 0.5 TOPS. Each
is the hypothesis of a planned lesson, and every lesson must answer one
sentence: what frontier moved?
