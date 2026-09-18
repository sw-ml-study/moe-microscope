# Landscape storyboard

The animated data-flow landscape is one wide scene that a camera pans
along, roughly in the order one forward pass happens: tokens become
vectors, attention mixes them, the Engram lookup adds memory, the router
sends each token to one expert, the experts run on their sub-batches, the
block repeats, and the head predicts the next token. It replaces tables
with movement: chips travel between stations, and every chip carries a
value read from a pinned recording. This storyboard fixes the scenes,
their sources, their call-outs, and their acceptance rules before any
drawing; the player (step 2) and the scenes file (step 3) implement it.

## Rules

1. Nothing animates that a recording does not hold. A scene declares the
   recording and the observation names it reads; a chip's value, count,
   or destination comes from those observations and from nothing else.
   If a scene needs a value no recording holds, an MLPL exporter pins it
   first (as the walkthrough fixture was pinned); the browser computes
   nothing.
2. The player is generic. It knows recordings, scenes, stations, chips,
   and lanes; it does not know what a router, a table, or an expert is.
   Meaning lives in the scene captions in the scenes file.
3. Two example windows appear, and the landscape says so. The token,
   attention, routing, and dispatch scenes follow the walkthrough window
   `17+25=|42.` (28 positions, ten of them real); the Engram and
   recurrence scenes follow the seven-position window `2+3=|5.`, which
   is what those lessons recorded. The camera passes a labeled seam
   between them.
4. Placeholders are honest. Mechanisms without a pinned recording (the
   expert cache, decode-cache compression, multi-token prediction) are
   drawn as labeled empty stations with the planned lesson id and no
   moving chips.
5. Parallel call-outs are labeled lanes drawn only where a recorded
   value or a documented property of the mechanism justifies them, and
   the justification is written in the scene caption.

## Chip vocabulary

| Chip | Drawn as | Value it carries |
|---|---|---|
| token chip | a small square with the character and its id | one entry of a `[T]` id vector (`walk/tokens`, decoded by the caption's alphabet, never by the player) |
| vector chip | a thin strip of 16 shaded cells | one row of a `[T, 16]` matrix (`walk/hidden`, `engram/retrieved/example`, `walk/dense-out`) |
| score chip | a short bar with the number | one entry of a `[T, E]` or `[T]` vector (`walk/probs`, `walk/gate-row-sum`, `engram/gate/example`) |
| row chip | a numbered tag | one entry of `engram/rows/example` (a table row index) |
| expert lane | a horizontal band, one per expert, colored | the destination of the token chips a `[T]` group vector sends there (`walk/groups`, `rm/route/example`) |
| call-out lane | a labeled band above or below the main path | the parallel work named in the caption |

The camera path is a single horizontal track; stations sit on it left to
right in scene order, and scenes 6 and 7 (recurrence and the
composition) draw the return arrow from the head back to attention so
the loop is visible without the camera moving backwards.

## Scenes

Each scene lists what moves, the source, the parallel call-out, and the
acceptance rule (the values a verifier reads back from the recording and
must find on screen).

### Scene 1: tokens become vectors

- What moves: ten token chips for `17+25=|42.` (positions 11 to 28 are
  padding and are drawn dim and still) travel from the input strip into
  the embedding station and leave as vector chips.
- Source: `walkthrough-v0`, `walk/config` (widths), `walk/tokens` `[28]`
  (frame 0), `walk/hidden` `[28, 16]` (frame 1) for the vectors that
  leave the attention station in scene 2; the embedding output itself is
  not recorded, so the chips leaving the embedding are drawn as blank
  strips that fill with values only after attention (the caption says
  so).
- Call-out: none. The embedding is a row lookup; the caption says it
  reads one of 52 rows per token.
- Acceptance: the ten decoded characters and ids match `walk/tokens`;
  the vector chips after scene 2 match `walk/hidden` row by row (first
  and last cell values shown).

### Scene 2: attention mixes the window

- What moves: the vector chips enter the attention station; thin lines
  from each position to the positions it attends to appear in the order
  of the recorded weights; the chips leave with their post-attention
  values.
- Source: `dense-baseline-run-v0`, `dense/attention/example` `[7, 7]`
  (frame 300) for the seven-position window `2+3=|5.` (the walkthrough
  did not record its attention map, so this scene is the first to use
  the seam: it draws the seven-position window's map beside the
  walkthrough's chips and says which is which); `walk/hidden` `[28, 16]`
  for the chips that leave.
- Call-out: none in the recordings. The caption notes that the Engram row
  hashing of scene 3 depends only on the token ids and so could run
  alongside attention; the lane for that appears in scene 3, not here.
- Acceptance: the `[7, 7]` weights drawn as line opacities match the
  recording (the verifier reads the three largest weights per row); the
  causal zero above the diagonal is drawn as absent lines.

### Scene 3: the Engram lookup

- What moves: for each of the seven positions of `2+3=|5.`, a row chip
  for the 2-gram row and one for the 3-gram row travel from the id strip
  to a table drawn as a tall column of 512 thin rows (256 per order);
  the two addressed rows light up and a vector chip of sixteen values
  travels back; a score chip shows the gate per position; the gated
  value joins the position's vector chip.
- Source: `engram-run-v0` (frame 300): `engram/rows/example` `[7, 2]`,
  `engram/retrieved/example` `[7, 16]`, `engram/gate/example` `[7]`,
  `engram/value/example` `[7]`; `engram/config` for slots and head_dim;
  `engram/collisions` `[6]` for the table's occupancy caption (364 of 512
  rows addressed by the training windows).
- Call-out (lane above the path): "row addresses depend only on the ids":
  the row chips start moving at the same time as the token chips of scene
  1, in their own lane, and wait at the table until the vector chips
  arrive. Justification: the addresses are `ngram_hash` of the ids (the
  EG01 report and `lib/engram.mlpl`); the recording holds the addresses
  and nothing about timing, so the caption states this as a property of
  the mechanism, not a measurement.
- Acceptance: the fourteen row numbers on the chips equal
  `engram/rows/example`; the gate percentages equal
  `engram/gate/example` rounded; the retrieved strips equal
  `engram/retrieved/example` row by row.

### Scene 4: the router decides

- What moves: each of the ten real vector chips of the walkthrough window
  enters the router station; four score chips (one per expert) appear
  beside it with the recorded probabilities; the largest is kept and the
  other three fade; a mask tick marks the chosen expert.
- Source: `walkthrough-v0`: `walk/logits` `[28, 4]` (frame 2),
  `walk/probs` `[28, 4]` (frame 3), `walk/entropy` (frame 3), `walk/mask`
  `[28, 4]` and `walk/load` `[4]` and `walk/balance` (frame 4), `walk/gate`
  `[28, 4]` and `walk/gate-row-sum` `[28]` (frame 5).
- Call-out (lane below): "the balance term is computed from the same
  mask": a small station beside the router shows `walk/load` filling and
  `walk/balance` as the tokens are assigned. Justification: both values
  are in frame 4 and are functions of the mask (SD01 and MX01 reports).
- Acceptance: the four probabilities per position equal `walk/probs`;
  the kept expert per position equals the argmax of `walk/mask`; the
  gate kept per position equals `walk/gate-row-sum`; the load bars equal
  `walk/load`.

### Scene 5: dispatch and the four experts

- What moves: the token chips leave the router along four expert lanes
  according to their groups; expert 0's lane shows its sub-batch of
  sixteen rows arriving as vector chips and leaving transformed; the
  four lanes rejoin at the scatter station, where the dense-masked and
  sparse outputs are compared and the difference is shown as zero.
- Source: `walkthrough-v0`: `walk/groups` `[28]` and `walk/group-order`
  `[28]` (frame 6), `walk/expert0-rows` `[16, 16]` and `walk/expert0-out`
  `[16, 16]` and `walk/expert-evals` `[2]` (frame 7), `walk/dense-out`
  and `walk/sparse-out` `[28, 16]` (frame 8), `walk/parity` (frame 9).
- Call-out (four lanes): "the four sub-batches are independent": the
  lanes advance at the same time, each labeled with its row count from
  `walk/load`; a counter shows `walk/expert-evals` (dense-masked against
  sparse). Justification: each expert is applied once to its compressed
  sub-batch (SD01), and the recording holds the group of every token and
  the row count per expert.
- Acceptance: each token chip's lane equals `walk/groups`; the sixteen
  rows in expert 0's lane equal `walk/expert0-rows`; the two evaluation
  counts equal `walk/expert-evals`; the parity readout equals
  `walk/parity` (zero).

### Scene 6: the block repeats, and the router re-decides

- What moves: at the seam the landscape switches to `2+3=|5.`; a return
  arrow carries the seven vector chips from the end of the block back to
  the attention station three times; at each pass the expert lane each
  chip takes is drawn from the recorded strip, so a chip that changes
  lane between passes visibly crosses; a per-pass load bar fills.
- Source: `recurrent-moe-run-v0` (frame 300): `rm/route/example`
  `[3, 7]`, `rm/load` `[3, 4]`, `rm/change-share`,
  `rm/specialization-per-recurrence` `[3]`, `rm/entropy`, `rm/balance`;
  `rm/config` for R.
- Call-out: "nothing here runs in parallel": the caption states that the
  three passes are sequential by construction (the state of pass two is
  the output of pass one), and the lane drawn is a single one; the
  recorded change-of-expert share (0.381) is shown as the count of chips
  that crossed lanes over the training rows.
- Acceptance: the twenty-one lane assignments equal `rm/route/example`;
  the three load bars equal `rm/load`; the share readout equals
  `rm/change-share` rounded.

### Scene 7: all three sparsities together

- What moves: the same loop as scene 6 with the Engram station inside it:
  at each pass the row chips of scene 3 light the same two rows, a gate
  score per position and pass shows how much memory joined, and the
  expert lane per pass is drawn from the composed recording.
- Source: `recurrent-moe-engram-run-v0` (frame 300): `re/route/example`
  `[3, 7]`, `re/gate/example` `[3, 7]`, `re/gate/per-recurrence` `[3]`,
  `re/load` `[3, 4]`, `re/change-share`, `re/slots/nonzero`; the row
  addresses are the same as scene 3's because both lessons hash the same
  window with the same contract (`engram/rows/example`; the caption says
  the composed recording did not re-record them).
- Call-out (lane above): the row addresses again arrive ahead of the
  vector chips at every pass, for the same reason as scene 3; the caption
  adds that the table is read three times but hashed once.
- Acceptance: lane assignments equal `re/route/example`; gate
  percentages per position and pass equal `re/gate/example`; the three
  gate means equal `re/gate/per-recurrence`.

### Scene 8: the head predicts, and the result

- What moves: the vector chips of the walkthrough window enter the head
  station and leave as token chips of the predicted next characters,
  drawn beside the targets; the scene ends on the results strip.
- Source: `walkthrough-v0`: `walk/next-tokens` `[28]` (frame 9);
  `dense-baseline-run-v0` `dense/logits/example-argmax` `[7]` for the
  seven-position window; the results strip reads `walk/config` and the
  captions cite the results table rows (DN01, MX01, RM01@3, EG01@256,
  RE01) by name, with their validation losses typed into the caption
  from the committed table, marked as such.
- Call-out: none.
- Acceptance: the predicted characters equal the decoded
  `walk/next-tokens`; the argmax strip equals
  `dense/logits/example-argmax`.

### Placeholders (no moving chips)

| Station | Where on the track | Planned lesson |
|---|---|---|
| Hot and cached shards | beside the expert lanes of scene 5 | TW01 (Saga 14): the per-token `tier/trace` moves chips between a resident shelf and a fetched shelf, with the tier a miss was served from on the chip |
| Decode-cache compression | after the head, on the return path of a generation loop | KV01 (Saga 14), applied only to the attention blocks the hybrid keeps |
| Multi-token prediction | after the head | MT01 to MT03 (Saga 10): a second head drafting position t+2 for the main head to verify; the station is labeled "not yet measured" until it is |
| Prefetch during attention | a dashed lane above scene 2 | TW01: drawn only when a recorded schedule exists |
| Sequence state | a station beside attention in scene 2 | SS01 (Saga 7): the fixed-size state chip carried along the window, decaying |

## Camera and pacing

The track is about six screens wide at 960 px per screen. The camera
pans one station at a time (play advances automatically, previous and
next jump, a scrubber sets the position), pausing on each station while
its chips move. The reduced-motion mode replaces every tween with a jump
between the station's start and end states; every state is drawable
without motion, so the still frame at any station is complete.

## Acceptance for the saga

- `?verify=1` on the landscape page lists, per scene, every observation
  it read (name, shape, frame) and the values it placed on chips, and
  reports a missing observation as an error; the report must be empty of
  errors on the published site.
- Each scene's acceptance rule above is checked by
  `scripts/check-landscape` (in the gate): every read must exist in its
  fixture with a usable shape, and with a Chrome binary the composed
  page's verify report must be error-free with every value placed on a
  chip equal to its fixture value.
- The placeholders carry no numbers.
- Every caption that states a mechanism property (the two call-out
  justifications that are not measurements) cites the report that
  documents it.

## Sources

- Recordings: `fixtures/recordings/walkthrough-v0.json`,
  `dense-baseline-run-v0.json`, `engram-run-v0.json`,
  `recurrent-moe-run-v0.json`, `recurrent-moe-engram-run-v0.json`,
  with their budgets in `scripts/recordings.conf` and the index in
  `fixtures/recordings/index-v1.json`.
- Reports: [SD01](../experiments/SD01.md) (dispatch),
  [recordings](../experiments/recordings.md) (the walkthrough),
  [EG01](../experiments/EG01.md), [RM01](../experiments/RM01.md),
  [RE01](../experiments/RE01.md), [DN01](../experiments/DN01.md).
- Plan: [Saga 6](plan.md).
