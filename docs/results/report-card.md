# Report card

Every experiment graded and ranked: what it was expected to show, what it
showed (as expected, better, or worse), whether it has already added value
at this scale, and if not, what would make it effective and which planned
lesson does that. Grades are for demonstrated value in a tiny model on a
CPU, not for the idea; a low grade with a clear next step is a lesson we
have not finished, not one we have given up on. Every number is a results
row, a report, or a finding; the [quality table](quality.md) and the
[results table](../reference/results.md) hold the full rows.

Grading: A, the mechanism did what it was meant to and the evidence is
usable now; B, it did what it was meant to with a limitation we can name;
C, mixed: useful as a measurement, not as a mechanism yet; D, it did not
help here and the reason is understood; F would be "does not work and we
do not know why", and nothing has earned it.

## Ranked by value demonstrated so far

| Rank | Experiment | Grade | Outcome against expectation | One line |
|---:|---|:---:|---|---|
| 1 | DS01 data scale | A | better than expected | eightfold data cuts dense validation loss from 3.48 to 1.11; nothing architectural moves the held-out columns as much |
| 2 | MX01 top-1 mixture | A | as expected | 1.86 times the parameters at 1.02 times the active parameters per token at the same loss (3.76 against 3.79) |
| 3 | RM01 recurrent mixture | A- | better than expected | the best 120-example loss in the table (3.42) at the mixture's 7,096 parameters; the router re-decides at every pass |
| 4 | LD01 shared expert plus sixteen deltas | B+ | as expected, one correction | 3.46 at 1,024 bytes per expert, the best non-recurrent row; deltas alone match dense (3.79) once a contaminated 3.37 was re-measured |
| 5 | SD01 sparse dispatch | B+ | as expected for work, worse for time | 13,440 to 3,360 expert row evaluations with outputs equal to the bit, and slower in the interpreter |
| 6 | RC01 recurrent block | B | mixed | R=2 beats R=1 at fixed parameters (3.45 against 3.79), but every model is best when stopped after one pass: regularization, not a reasoning loop |
| 7 | MX02 top-2 | B- | worse than expected on loss, better on tasks | twice the expert work, worse validation loss (3.92), the first held-out MLPL answers; a knob, not a free improvement |
| 8 | MX01 specialization (MX02 map) | B | as expected | 0.61 against a 0.25 family-blind baseline without a family label; the families are separable by construction |
| 9 | MB01 matcher and CD01, CD01b docent | C+ | worse than expected | the docent loses to a keyword matcher on paraphrases (0.407 against 0.685); the yardstick is the value |
| 10 | EG01 Engram | D+ mechanism A | worse than expected | equal to the builtin to the bit; at 90 windows every table size raises validation loss (3.93 to 4.67 against 3.79) |
| 11 | RE01 all three sparsities | D | worse than expected | training loss 0.006, validation 4.76, the worst row of the ablation; the mechanisms work, the composition memorizes |
| 12 | TE01 in-repo teacher | C- | worse than expected | the teacher is worse held out (4.14) than the student it is meant to teach; distillation cannot start from it |
| 13 | SS01 state-space block | C+ mechanism A | as expected on memory, worse on loss | 256 B of sequence state at any history against 262,144 B for attention at 1,024 tokens, exactly; validation loss 4.56 against 3.79 and a slower sequential scan in the interpreter |
| 14 | SAN01 no-FFN docent | B | better than expected | the hidden layer removed at matched budget loses nothing: intent 0.946 and destination 0.934 against 0.938 and 0.925, paraphrases 0.389 against 0.296; the answer sw-atlas needed |

Infrastructure lessons are graded below the mechanisms; they are what
makes the numbers above trustworthy.

## Each experiment

### DS01 data scale: A, better than expected

- Expected: more examples help; more epochs at the same examples do not.
- Result: dense 3.48 to 1.66 to 1.11 and the mixture 3.49 to 1.42 to 1.22
  from 120 to 480 to 960 examples; prose becomes a solved family; doubling
  epochs at 120 examples makes both worse. Better than expected in size.
- Value now: yes. It is the lens for every other row: at 120 examples
  every model memorizes, so a mechanism that cannot show value at 480 or
  960 examples has not been given a fair test.
- Next: run the mechanisms that lost at 120 examples at the 480 and 960
  points (EG02, SE01); the configuration frontier sweeps data size as a
  first-class knob.

### MX01 top-1 mixture: A, as expected

- Expected: more stored capacity at nearly the same active cost, at
  unchanged quality.
- Result: exactly that (finding 1); the balance term at 0.01 kept all four
  experts in use.
- Value now: yes; the base every later mixture lesson builds on.
- Next: the frontier's expert-count and shared-expert sweeps.

### RM01 recurrent mixture: A-, better than expected

- Expected: routing over reasoning time, whatever it did to quality.
- Result: 38 to 46 percent of tokens change expert between recurrences,
  loads stay spread, and the R=3 mixture has the best 120-example loss in
  the table with the lowest training exact match (0.43): the least
  memorizing model here. R=2 is worse than R=1.
- Value now: yes, as the strongest tiny model measured.
- Next: seeds (one seed per point), the 480-example point, and whether the
  later recurrences refine or only regularize (the stop-early rows).

### LD01 low-rank delta experts: B+, as expected, with one correction

- Expected: many cheap experts for the price of few full ones.
- Result: sixteen rank-4 deltas cost 2,048 parameters against 4,288; with
  the shared always-on expert the loss is 3.46, the best non-recurrent
  row; deltas alone land on the dense baseline (3.79) with the first
  held-out MLPL answers of a non-recurrent model. The deltas-only number
  was first reported as 3.37 and re-measured after upstream fixed Adam's
  global step counter (finding F22): a correction, and a reason to keep
  one training run per process.
- Value now: yes: the shared expert plus cheap deltas is the shape to
  carry forward (it is also Nemotron's latent-expert direction, LM01).
- Next: LM01 latent experts beside deltas and full experts.

### SD01 sparse dispatch: B+, as expected for work, worse than expected for time

- Expected: a quarter of the expert work with identical outputs.
- Result: identical outputs (max difference 0) and a quarter of the row
  evaluations; slower per window in the interpreter (0.74 against 0.42
  ms) because gather, scatter, and loop overhead exceed three tiny matmuls.
- Value now: the exactness; the speed claim is honestly negative.
- Next: it turns into a time saving only when experts are big enough for
  the kernels to matter (the lab scale, the CUDA saga) or when the
  interpreter's dispatch is a builtin.

### RC01 recurrent block: B, mixed

- Expected: compute replacing parameters, with accuracy rising with R.
- Result: R=2 reaches 3.45 against 3.79 at the same 3,812 parameters, R=3
  gives the first held-out MLPL answers of a dense model, R=4 is worse
  than R=1; every model scores best when stopped after one pass, so deep
  supervision regularized the block rather than building a converging
  loop. Worse than expected on the loop, better on the loss.
- Value now: the fixed-parameter gain and the honest stop-early rows.
- Next: seeds and data; the state-space saga reuses the machinery for
  depth.

### MX02 top-2 routing: B-, worse than expected on loss, better on tasks

- Expected: better quality for twice the expert work.
- Result: better training fit (0.86), the first held-out MLPL answers,
  worse validation loss (3.92), a flatter specialization map (0.42).
- Value now: as a demonstration that top-k is a cost and quality knob.
- Next: the frontier's k sweep at more data.

### Specialization (MX02 map): B, as expected

- Result: 0.61 for top-1 against a 0.25 blind baseline with no family
  label; the four synthetic families are separable by construction, so
  this is a floor on what routing can find, not evidence about real text.
- Next: specialization at 480 and 960 examples; the docent's real text.

### The campus docent (CD00, CD01, MB01, CD01b): C+, worse than expected

- Expected: a tiny trained model beats keyword matching on paraphrases.
- Result: the matcher scores 0.685 on paraphrases, the best docent 0.407
  (word vectors lifted it from 0.296); the docent wins only on intent
  (0.938 against 0.759). The usefulness bar (plus 20 points, unsupported
  recall 0.8) is not met, so the docent stays out of the campus site.
- Value now: the yardstick and the honest number; the mockup's matcher is
  what the campus ships.
- Why it lost: hashed features learn the templates; the catalog's own
  words carry the signal a matcher reads directly; 724 templated rows are
  few.
- Next: routed experts under the docent (Saga 11), more campus text as the
  campus grows, a larger table with fewer collisions; if the bar is still
  unmet, the matcher stays and the docent remains a lesson.

### EG01 Engram: D+ for value, A for the mechanism, worse than expected

- Expected: prose, a fixed local pattern, moves first.
- Result: the hand-written form equals the sw-MLPL builtin to the bit in
  outputs and gradients; at every table size training loss falls below
  and validation loss rises above the dense baseline (3.93 at 1,024 slots
  to 4.67 at 256); prose keeps 0.667 only at the largest table.
- Why it did not help here: the table is written by the same gradient as
  the block on 90 windows whose held-out contexts rarely recur in
  training, so the cheapest fit is to write the training answers into the
  addressed rows; the gate opens from 0.12 to about 0.7 and admits them.
  Neither context length nor collisions is the limit at 1,024 slots.
- Not giving up: the [Engram page](../concepts/engram.md) names the
  conditions under which it should pay (recurring contexts, a frozen base,
  a domain with more local structure) and the lessons that test them: NG01
  (how much of the held-out set pure context recall can answer at all),
  EG02 (480 and 960 examples, a frozen base, orders 2 to 5), SE01 (with
  the state block at 480 examples).

### RE01 all three sparsities: D, worse than expected

- Expected: memory sparsity and compute sparsity complement each other.
- Result: with routing the table gives 4.60, with routing and recurrence
  4.76 at training loss 0.006 and training exact match 0.99: the composed
  model fits the 90 windows almost perfectly and generalizes worst. The
  mechanisms still behave (31 percent of tokens change expert per
  recurrence, the gate stays open, loads stay spread).
- Why: the table turns every extra mechanism's capacity into memorization
  at this data size; recurrence gives it more compute to do so with.
- Next: the same composition at 480 examples (SE01, SEM01) and with a
  distilled signal (Saga 8), before any conclusion about the composition.

### TE01 in-repo teacher: C-, worse than expected

- Expected: a larger dense model, measurably better than the student, as a
  source of soft targets.
- Result: 19,956 parameters, top-1 agreement 0.963 on training rows,
  validation loss 4.14: worse held out than the 3,812-parameter student.
  The fixture and its schema are sound; the teacher is not a teacher.
- Next: Saga 8 starts by training a teacher that is better held out (more
  data, the RM01 shape, or the gated external teacher) before any
  distillation term is measured; a distillation result against a worse
  teacher would be meaningless.


### SS01 state-space block: C+ (mechanism A), as expected on memory, worse on loss

- Expected: constant sequence memory at a small loss margin against
  attention at matched parameters.
- Result: the memory claim holds by construction (256 bytes at any
  history against 4,096 to 262,144 for attention at 16 to 1,024 tokens);
  the loss margin does not (4.56 against 3.79) while training exact match
  is higher (0.99 against 0.70); the sequential scan is two to eight times
  slower per token in the interpreter, stated in the fixture.
- Value now: the first row with a measured state-bytes column, the decay
  and the fading state drawn from recorded values, and an honest speed
  number.
- Next: SS02 makes the decay depend on the token; HA01 keeps one attention
  block among state blocks and asks how little attention is enough.


### SAN01 no-FFN docent: B, better than expected

- Expected: a small loss from removing the hidden layer, to be weighed
  against the structural guarantee sw-atlas wants (no place to memorise).
- Result: no loss at all on this corpus. Both variants match or beat their
  dense twins on every held-out column (SAN01 intent 0.946, destination
  0.934, paraphrases 0.389, unsupported recall 0.5; SAN01b's ambiguous
  top-2 pairs 0.545 against 0.182) with lower validation loss.
- Value now: the answer Atlas needed before its Saga 5, with the
  limitation stated (no sequence mixing in this model).
- Next: none here; the MoE line stays as the fallback (MOE-RETURN) if
  Atlas's attention-only no-FFN model disappoints at its scale.

## Infrastructure lessons

| Lesson | Grade | Why |
|---|:---:|---|
| DM01 synthetic domain | A | four families with oracles, an honest held-out split, and the data-scale generators DS01 needed |
| RB01 resource budget, GB01 generation benchmark | A | every size labeled measured, derived, or estimate; throughput and tail latency measured, with the sparse path honestly slower |
| Recordings, live demo, landscape | A- | seven training recordings pinned with live parity, replayed in the browser and verified after every deploy; the landscape player is new and has two proving scenes |
| sw-MLPL findings loop | A | twenty-four language findings with executable probes; most fixed upstream within a day and verified by flipping the probe; one (F22) exposed a contaminated row and corrected it |

## What has added value already

1. Data before architecture (DS01): the single most useful fact for a
   tiny model, and the reason every negative result below carries a "at
   90 windows" qualifier.
2. Sparse stored capacity at unchanged active cost (MX01), with
   specialization that arises on its own (MX02).
3. Recurrence with re-routing (RM01): the best tiny model here.
4. A shared expert plus many cheap experts (LD01).
5. The measurement discipline: exact parity checks (SD01, EG01), one run
   per process, rows regenerated by the gate, deploys verified.

## What needs more work before it bears fruit

- Engram (EG01, RE01): test at 480 and 960 examples and with a frozen
  base; measure the n-gram order; establish the recall yardstick (NG01).
- The docent (CD01b): routed experts and more text; otherwise the matcher
  stays.
- Distillation (TE01): a teacher that is actually better, then the student
  matrix.
- Recurrence as reasoning (RC01, RM01): seeds and data before any claim
  beyond regularization.

## What is not useful for tiny models, and why

Nothing here is written off. Two things are not useful at this data
size, for reasons we can state: a hashed memory table, because with few
windows it can only memorize training answers, and the composition of
memory with routing and recurrence, because it compounds that. Both are
scheduled to be re-tested where the reason no longer holds (more data, a
frozen base, a teacher's signal). Sparse dispatch is not useful for time
in the interpreter at this expert size, and will not be until experts are
large enough for kernels to dominate; its exactness is useful now.
