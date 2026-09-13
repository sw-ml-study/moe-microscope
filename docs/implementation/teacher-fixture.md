# Teacher fixture schema

`fixtures/teacher/teacher-v0.json` holds the in-repo teacher's soft targets
for the training split. Distillation lessons (Saga 4) read it; an external
teacher export must produce the same shape so the student code does not
change. `scripts/run-teacher write` trains the teacher once (about a minute)
and installs the fixture, its index, diagram, and results row;
`scripts/run-teacher check` validates the committed fixture without training.

## Layout

A single JSON object with flat, parallel vectors. Nested arrays are
deliberately absent so that both `parse_json` and ordinary tools read it.

| Field | Type | Meaning |
|---|---|---|
| `schema` | string | `sw-ml-study.moe-microscope-teacher` |
| `version` | integer | 0 |
| `teacher.id` | string | lesson id of the producer (`TE01`) |
| `teacher.config` | string | human-readable configuration |
| `teacher.params` | number | trainable parameter count |
| `teacher.seed`, `teacher.epochs` | numbers | reproducibility |
| `teacher.binary` | string | producer binary label |
| `teacher.train_loss`, `teacher.val_loss` | numbers | masked next-token loss on the two splits |
| `teacher.top1_agreement` | number | fraction of entries whose top-1 id equals the target |
| `vocab` | integer | vocabulary size (52) |
| `alphabet` | string | the restricted alphabet; a character's index is its id |
| `mixture` | string | path of the mixture fixture used |
| `split.train_fraction`, `split.seed` | numbers | split parameters |
| `split.train_index` | integer vector | training row indices in split order |
| `top_k` | integer | ids kept per position (8) |
| `count` | integer | number of entries (masked training positions) |
| `rows` | integer vector `[count]` | index into `split.train_index` order |
| `positions` | integer vector `[count]` | position in the row's window (0-based, target position) |
| `targets` | integer vector `[count]` | the true next-token id at that position |
| `topk_ids` | integer vector `[count * top_k]` | row-major `[count, top_k]`, descending probability |
| `topk_logprobs` | number vector `[count * top_k]` | natural log-probabilities aligned with `topk_ids` |

Entries are ordered by training row, then position. Only masked positions
(answer and stop targets) are exported; prompt positions are not scored and
are not present.

## Invariants the gate checks

- every log-probability is at most zero and each top-k set's mass is at most
  one, with a mean mass above 0.9;
- `count` equals the number of masked training positions and every entry
  sits on a masked position with the correct target;
- the recorded `top1_agreement` equals the recomputed value;
- the fixture is at most 256 KiB and its SHA-256, byte size, count, and the
  producer source hash match `fixtures/teacher/index-v1.json`;
- `teacher.train_loss` is below DN01's 0.19 and `top1_agreement` above 0.9.

## Producing the same shape from an external teacher

An exporter for a local quantized model (Saga 4 step 4) must tokenize with
this alphabet (the domain is byte-level over 52 symbols, so an external
tokenizer needs a character-level mapping), score the same training texts,
and emit the same fields with `teacher.id` set to its own label. It may set
`top_k` differently; consumers read `top_k` from the file. It must not add
nested arrays.

## How distillation consumes it

For entry `i`, the student computes its own log-softmax at row `rows[i]`,
position `positions[i]`, gathers the `top_k` ids, renormalizes both sides
over those ids, and adds `beta * KL(teacher || student)` to the masked
cross-entropy on `targets[i]`. The mass outside the top-k is dropped by both
sides, which the lesson states.
