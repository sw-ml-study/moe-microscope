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

Limitation: 54 paraphrases and 241 templated held-out rows; one corpus
revision.

## Supported now versus plausible but not demonstrated

Supported: more stored than active capacity; measurable specialization; a
real top-k tradeoff; exact sparse dispatch; dispatch overhead outweighing
theoretical savings at tiny scale; data quantity governing whether
architectural differences show; a deterministic matcher as a hard baseline
for a tiny classifier over templated data.

Plausible, not demonstrated: recurrence improving quality per parameter;
Engram removing memorization pressure; distillation improving this student;
quantization raising expert count at acceptable quality; routing locality
giving useful cache hit rates; heterogeneous execution beating simpler
placement; the whole design being useful within 256 MB and 0.5 TOPS. Each
is the hypothesis of a planned lesson, and every lesson must answer one
sentence: what frontier moved?
