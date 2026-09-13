# MoE and Engram: questions and answers

Captured on 2026-09-12 during Saga 2 step 1, after the MX01 routing
microscope was first drawn. The questions are the user's; the answers are the
working understanding this repository builds its lessons on, tied to what
the lessons can measure.

## What determines each expert's expertise?

Only the training feedback loop. Nobody labels experts as "the arithmetic
expert." At initialization the routes are arbitrary (the routing diagram is
exactly that: random weights, one expert taking four of six tokens). Then a
self-reinforcing loop runs: an expert that happens to handle some kind of
token slightly better gets more of that kind, trains more on it, and gets
better still. Specialization is an emergent property of routing plus
gradient, shaped by three things: what the router can see in the hidden
state, the balance pressure that stops collapse, and the data mixture. It is
not guaranteed; experts can end up splitting tokens by position or frequency
rather than by anything a human would call a topic.

That is why the plan treats specialization as something to measure, not
assume. The domain carries task tags precisely so MX02 can draw the
family-by-expert heatmap and report a specialization score, and why the
router warm start in Saga 4 (nudging the router toward task tags early, then
releasing it) is an experiment with a control rather than a design
assumption.

## How are MoE experts trained?

Nothing trains an expert on its own. The whole network is trained on one
loss, and the router decides which experts see which tokens:

1. For each token, the router computes a score per expert and picks the
   top-k (top-1 in Switch style, top-2 in MX02).
2. Only the chosen experts run on that token, and their outputs are
   combined, each scaled by its gate value. In this repository's training
   path every expert runs but the gate zeroes the unchosen ones, which is
   mathematically identical and keeps autograd simple. Inference runs only
   the chosen ones.
3. Backpropagation sends the token's error only into the experts that
   handled it. An expert that received no tokens gets no gradient that step.
4. The router learns through the gate factor. The pick itself is an
   `argmax` and has no gradient, so the gate multiplies the chosen expert's
   probability into the output. If raising that probability would have
   lowered the loss, the router raises it. That is why the routing diagram
   keeps the probability in the gate instead of a bare one-hot.
5. A load-balance term (the `balance` value in the diagram, 1.0 when even)
   penalizes sending everything to one expert, because otherwise the first
   expert to get slightly better attracts all tokens and the rest never
   learn.

## After training, how does the router choose? Training time or inference time?

Both. The rule is fixed at training; the choice for each token is made fresh
at inference.

What is fixed at training: the router's weights. The router is one small
linear layer (`h @ Wr + b`): a hidden-state vector in, one score per expert
out. Training shapes those weights so that tokens which an expert handles
well score highest for that expert. After training the weights are frozen.
There is no lookup table of "token X goes to expert Y" anywhere.

What happens at inference, per token, per layer:

1. Take the token's current hidden state at that layer. It already encodes
   the token, its context from attention, and everything earlier layers did.
2. Multiply by the router weights to get E scores, one per expert.
3. Keep the k highest scores (`argtop_k`). That is the whole selection: no
   search, no ranking beyond a sort of E numbers, no notion of "appropriate"
   beyond the score.
4. Run only those k experts and combine their outputs weighted by their
   softmax probabilities.

With 64 experts and top-2, every token at every layer computes 64 dot
products and takes the two largest. In DeepSeek-V4-Flash's case that is 256
scores and 6 winners, 43 times per token.

Two consequences for the microscope: the same word can go to different
experts depending on context, because the router sees the hidden state, not
the token id; and in the recurrent variant (RM01) the same token can switch
experts between recursion steps because its hidden state changes, which is
the "routing over reasoning time" effect the plan wants to observe. Because
routing is decided per token at inference, the FreeToken expert-cache
lessons (XC01) are about exactly this moment: which experts the router asks
for next is unknown until the token arrives, so the cache can only follow
the router's recent choices.

One nuance: some systems change selection at training time only. Capacity
limits (dropping tokens when an expert is over-subscribed) and the
load-balance term exist during training to keep experts from collapsing. At
inference those pressures are gone; the frozen router simply scores and
picks.

## How does Engram fit in, and how do we choose what goes in the table?

Engram is conditional memory next to MoE's conditional compute. Where the
router asks "which computation should this token get," Engram asks "have I
seen this exact local context before, and what did I learn about it."
Mechanically (what sw-MLPL's `engram` builtin does, and what EG01 rebuilds by
hand): take the last 2 or 3 token ids, hash them to a slot in a table, read
the vector stored there, project it, and add it to the hidden state through
a learned gate.

You do not choose what goes in the table. Addressing is deterministic
hashing, so every 2-gram and 3-gram the model ever sees has a slot; the
contents of the slots are learned by gradient exactly like expert weights,
and the gate learns when to trust them. What you do choose:

- the n-gram orders (2, 3, 4);
- table size and value width (collisions versus bytes);
- which layer's hidden state gets the injection (early layers are where
  surface patterns live);
- whether the table is frozen, trainable, or updated on-device.

What ends up in it is emergent and inspectable: `engram_stats` reports which
slots became non-zero and how strong the gate is. In this domain the
prediction is that prose fragments ("on the" followed by the animal-specific
place), prompt boilerplate like `reduce_add([`, and the `=|` boundary will
light up, while arithmetic will not, because a sum depends on both operands
rather than on the last two characters. That is the ablation EG01 measures.

## Can we have shared always-on experts plus top-16 of a large pool?

Yes, and cheaply. That is DeepSeek-V3's layout: one or two shared experts
run on every token, plus top-k routed experts from a large pool. In MLPL it
is one extra line: `h + apply(shared, h) + sum of gated routed experts`. The
plan's low-rank-delta step is a close cousin (a shared FFN plus small
per-expert deltas), so a `shared` count parameter belongs there, with a
three-way measurement: shared only, routed only, both. Top-16 of a large
pool is k=16 in `argtop_k`; the cost that grows is expert evaluations per
token, which is the counted metric in every results row.

## Can we configure how much time is spent choosing experts?

Choosing is cheap by design: E scores per token from one matrix multiply,
then a top-k sort. With 256 experts that is 256 dot products, negligible
next to running even one expert. The knobs that exist, and that this
repository can make measurable:

- Router width: project the hidden state to a small router dimension before
  scoring, so cost is E times d_router instead of E times d_model.
- Grouped or hierarchical routing: score G groups first, then experts within
  the winning groups. DeepSeek does this for hardware locality; the plan's
  "expert banks" step (Saga 6) is the NPU-friendly version.
- Hash routing: pick the expert from a hash of the token id, zero router
  cost and no learning. It is the same mechanism as Engram addressing
  applied to compute, and a good comparison lesson.
- Recurrence depth: in RM01 each recursion re-routes, so R multiplies
  routing decisions per token. That is the only knob that spends more time
  choosing.

Router cost should be one more counted column (router multiply-adds per
token) so these variants sit in the same results table as everything else.

## Is the Engram table size a function of how much training data is used?

No. The table size is a design choice made before training, and the
training data then fills it. The relation between the two is collisions.

A hashed table has a fixed number of slots, S. Every n-gram that occurs maps
to `hash(n-gram) mod S`. The number of distinct n-grams in the training
data, N, is what the data determines. When N is much smaller than S, most
n-grams get their own slot and the table behaves like an exact dictionary.
When N approaches or exceeds S, unrelated n-grams share slots and one slot's
vector has to serve several contexts. Collisions are graceful, since the
gate can learn to distrust a muddy slot, but the memory becomes lossy. The
data sets how many distinct contexts want storage; you set how many slots
there are; the ratio decides how much the table forgets. Vocabulary size
matters more than corpus length, because distinct 2-grams are bounded by V
squared and 3-grams by V cubed, and real text uses a small fraction.

Numbers for this repository: the domain has 52 symbols, so at most 2,704
distinct 2-grams exist and far fewer occur; the 120-example fixture contains
a few hundred distinct 2-grams and 3-grams. A table of 1,024 slots is
already collision-free at that scale, and 65,536 slots would be almost
empty. That is why the microscope-scale configuration uses 256 to 1,024
slots and the lab scale 65,536. Qwen3.8-Flash-Next's 47.7 GiB table is the
same logic at the other end: a 100K-plus vocabulary, several n-gram orders,
several hash heads, and billions of distinct contexts.

What the microscope can show: EG01 can sweep S downward (1,024, 256, 64, 16)
on the same data and plot collisions from `engram_stats`, gate magnitude,
and prose accuracy against it. The expected shape is a knee: accuracy flat
until slots run out, then falling, with the gate shrinking as slots get
muddy. That is the memory-side twin of the expert-cache capacity curve in
Saga 5. Table size is a memory cost, not a compute cost: reading a slot is
O(1) whatever S is, which is why huge tables can live in host RAM.

## Consequences recorded in the plan

- MX02 measures specialization with the family-by-expert heatmap and a
  specialization score; it is never assumed.
- The low-rank-delta step gains a `shared` expert count and a three-way
  comparison (shared only, routed only, both).
- Router multiply-adds per token join the results table as a counted cost;
  router width, grouped routing, and hash routing are candidate variants.
- EG01 includes the table-size sweep with collisions, gate magnitude, and
  prose accuracy.
