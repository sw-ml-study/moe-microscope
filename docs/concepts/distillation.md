# Distillation

## What problem does it solve?

A tiny student trained on hard labels alone learns slowly and overfits. A
teacher's next-token distribution carries more information per position.
"Distilled from scratch" means the student is initialized fresh and part of
its training signal comes from a teacher.

## Basic idea

Four levels, each measured alone against the baseline: token-level KD
(KL to the teacher's top-k distribution at every answer position), a
router warm start from task tags for the first part of training, expert
deltas fitted to a dense teacher's activations, and deep supervision across
recurrences.

## What exists

The in-repo teacher TE01 (19,956 parameters, two blocks) fits the training
rows far better than the students (top-1 agreement with targets 0.963,
training exact match 0.83) and exports top-8 log-probabilities at all 406
answer positions of the training split as flat parallel vectors. Its
held-out accuracy is zero: it is a legitimate source of soft targets, not
a demonstration of superior behavior. A stronger teacher (more data, wider,
or an external model exported in the same schema) is a documented option.

## What would demonstrate value

Same inference cost, better held-out exact match with KD than without.

## Status

Planned: the distillation saga. Fixture and schema:
[teacher fixture](../implementation/teacher-fixture.md).

## Experiments

- [TE01 teacher](../experiments/TE01.md)
