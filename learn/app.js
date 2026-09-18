// MoE Microscope live demo: steps through pinned recordings frame by frame.
// The recordings are the source of truth; this file only names, lays out, and
// draws the values it finds. No lesson semantics are computed here.
'use strict';

const LESSONS = [
  { id: 'dn01', title: 'DN01 dense baseline: a training run', path: 'fixtures/recordings/dense-baseline-run-v0.json',
    caption: 'One transformer block with a single feed-forward network, trained 300 epochs on 90 windows. Frames every 25 epochs.' },
  { id: 'mx01', title: 'MX01 top-1 mixture: a training run', path: 'fixtures/recordings/moe-top1-run-v0.json',
    caption: 'The same block with four experts behind a top-1 router and a load-balance term. Watch the per-expert load spread while the loss falls.' },
  { id: 'mx02', title: 'MX02 top-2 mixture: a training run', path: 'fixtures/recordings/moe-top2-run-v0.json',
    caption: 'Two experts per token with renormalized gates. Compare the loads, the entropy, and the family-by-expert map with MX01.' },
  { id: 'rc01', title: 'RC01 recurrent block: one block applied four times', path: 'fixtures/recordings/recurrent-block-run-v0.json',
    caption: 'The DN01 block applied R=4 times to the same state with deep supervision, the same 3,812 parameters. The last frame holds the state and the argmax after each recurrence of one window.' },
  { id: 'rm01', title: 'RM01 recurrent mixture: routing over reasoning time', path: 'fixtures/recordings/recurrent-moe-run-v0.json',
    caption: 'The MX01 mixture applied R=3 times with deep supervision; every recurrence re-routes. The last frame holds loads and family maps per recurrence, the change-of-expert share, and the expert chosen per token per recurrence of one window.' },
  { id: 'eg01', title: 'EG01 Engram from scratch: hashed rows, a gathered table, a gate', path: 'fixtures/recordings/engram-run-v0.json',
    caption: 'The DN01 block plus an Engram layer after attention: the last two and three token ids are hashed into rows of one table (256 slots per order), the rows are gathered, projected, and gated into the residual stream. The last frame holds the rows one window addresses, its gate, the retrieved values, and the parity residual against the sw-MLPL builtin.' },
  { id: 're01', title: 'RE01 recurrent mixture plus Engram: all three sparsities', path: 'fixtures/recordings/recurrent-moe-engram-run-v0.json',
    caption: 'The MX01 mixture with an Engram layer between attention and the router, applied R=3 times with deep supervision; every recurrence re-routes and re-gates. The last frame holds loads, gate means, and specialization per recurrence, and the expert and Engram gate per token per recurrence of one window.' },
  { id: 'ss01', title: 'SS01 state-space block: a fixed-size state in place of attention', path: 'fixtures/recordings/state-space-run-v0.json',
    caption: 'DN01 with its attention block replaced by a diagonal linear scan of matched size: one 32-value state updated once per position with a learned decay. The last frame holds the decay, the state along one window and how much of each position survives to its end, the argmax, and the persistent bytes attention and the scan keep at 16 to 1,024 tokens of history.' },
  { id: 'walk', title: 'Routing and dispatch: one window, stage by stage', path: 'fixtures/recordings/walkthrough-v0.json',
    caption: 'A trained top-1 mixture on one 28-token window. Each frame is the next stage a token passes through, from the hidden rows the router sees to the exact sum the sparse path reassembles.' },
];

const FAMILIES = ['arithmetic', 'sequence', 'mlpl', 'prose', 'overall'];
const EXPERTS = ['E0', 'E1', 'E2', 'E3'];

// Labels per observation name (naming only). rows/cols for matrices, items for vectors.
const LABELS = {
  'dense/config': { items: ['d_model', 'hidden', 'T', 'epochs', 'train', 'val'] },
  'moe/config': { items: ['d_model', 'hidden', 'E', 'top-k', 'T', 'epochs', 'train', 'val'] },
  'moe2/config': { items: ['d_model', 'hidden', 'E', 'top-k', 'T', 'epochs', 'train', 'val'] },
  'dense/accuracy/val': { items: FAMILIES }, 'dense/accuracy/train': { items: FAMILIES },
  'moe/accuracy/val': { items: FAMILIES }, 'moe/accuracy/train': { items: FAMILIES },
  'moe2/accuracy/val': { items: FAMILIES }, 'moe2/accuracy/train': { items: FAMILIES },
  'moe/load': { items: EXPERTS }, 'moe2/load': { items: EXPERTS },
  'moe/family-by-expert': { rows: FAMILIES.slice(0, 4), cols: EXPERTS },
  'moe2/family-by-expert': { rows: FAMILIES.slice(0, 4), cols: EXPERTS },
  'moe/route/example': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'moe2/route/example': { rows: ['2', '+', '3', '=', '|', '5', '.'], cols: EXPERTS },
  'dense/logits/example-argmax': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'dense/attention/example': { rows: ['2', '+', '3', '=', '|', '5', '.'], cols: ['2', '+', '3', '=', '|', '5', '.'] },
  'walk/config': { items: ['d_model', 'hidden', 'E', 'T', 'epochs'] },
  'recur/config': { items: ['d_model', 'hidden', 'T', 'epochs', 'train', 'val', 'R'] },
  'rm/config': { items: ['d_model', 'hidden', 'E', 'top-k', 'T', 'epochs', 'train', 'val', 'R'] },
  'ssm/config': { items: ['d_model', 'hidden', 'state', 'T', 'epochs', 'train', 'val'] },
  'ssm/accuracy/val': { items: FAMILIES }, 'ssm/accuracy/train': { items: FAMILIES },
  'ssm/logits/example-argmax': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'ssm/survival/example': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'ssm/state/example': { rows: ['2', '+', '3', '=', '|', '5', '.'] },
  'ssm/kv-bytes': { items: ['16', '64', '256', '1024'] }, 'ssm/state-bytes': { items: ['16', '64', '256', '1024'] },
  'rm/load': { rows: ['r=1', 'r=2', 'r=3'], cols: EXPERTS },
  'rm/specialization-per-recurrence': { items: ['r=1', 'r=2', 'r=3'] },
  'rm/family-by-expert/1': { rows: FAMILIES.slice(0, 4), cols: EXPERTS }, 'rm/family-by-expert/2': { rows: FAMILIES.slice(0, 4), cols: EXPERTS }, 'rm/family-by-expert/3': { rows: FAMILIES.slice(0, 4), cols: EXPERTS },
  'rm/route/example': { rows: ['r=1', 'r=2', 'r=3'], cols: ['2', '+', '3', '=', '|', '5', '.'] },
  'engram/config': { items: ['d_model', 'hidden', 'T', 'epochs', 'train', 'val', 'slots', 'head_dim', 'orders', 'builtin'] },
  'engram/collisions': { items: ['2-gram collisions', '3-gram collisions', '2-gram contexts', '3-gram contexts', 'table rows', 'rows addressed'] },
  'engram/accuracy/val': { items: ['arith', 'seq', 'mlpl', 'prose', 'overall'] },
  'engram/accuracy/train': { items: ['arith', 'seq', 'mlpl', 'prose', 'overall'] },
  'engram/parity': { items: ['forward (30 windows)', 'table gradient', 'gate gradient'] },
  'engram/rows/example': { rows: ['2', '+', '3', '=', '|', '5', '.'], cols: ['2-gram row', '3-gram row'] },
  'engram/gate/example': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'engram/value/example': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  're/config': { items: ['d_model', 'hidden', 'E', 'top-k', 'T', 'epochs', 'train', 'val', 'R', 'slots', 'head_dim'] },
  're/load': { rows: ['r=1', 'r=2', 'r=3'], cols: ['E0', 'E1', 'E2', 'E3'] },
  're/specialization-per-recurrence': { items: ['r=1', 'r=2', 'r=3'] },
  're/gate/per-recurrence': { items: ['r=1', 'r=2', 'r=3'] },
  're/route/example': { rows: ['r=1', 'r=2', 'r=3'], cols: ['2', '+', '3', '=', '|', '5', '.'] },
  're/gate/example': { rows: ['r=1', 'r=2', 'r=3'], cols: ['2', '+', '3', '=', '|', '5', '.'] },
  're/accuracy/val': { items: ['arith', 'seq', 'mlpl', 'prose', 'overall'] },
  're/accuracy/train': { items: ['arith', 'seq', 'mlpl', 'prose', 'overall'] },
  'rm/accuracy/val': { items: FAMILIES }, 'rm/accuracy/train': { items: FAMILIES },
  'recur/accuracy/val': { items: FAMILIES }, 'recur/accuracy/train': { items: FAMILIES },
  'recur/loss/per-recurrence': { items: ['r=1', 'r=2', 'r=3', 'r=4'] },
  'recur/argmax/1': { items: ['2', '+', '3', '=', '|', '5', '.'] }, 'recur/argmax/2': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'recur/argmax/3': { items: ['2', '+', '3', '=', '|', '5', '.'] }, 'recur/argmax/4': { items: ['2', '+', '3', '=', '|', '5', '.'] },
  'walk/load': { items: EXPERTS },
  'walk/expert-evals': { items: ['dense-masked', 'sparse'] },
};

// One line of what/why/how per observation name, taken from the lesson pages.
const CAPTIONS = {
  'dense/config': 'WHAT: the run configuration. Frame 0 of every recording states the shapes so the rest can be read without the source.',
  'dense/loss/train': 'WHAT: mean masked cross-entropy on the training rows. WHY it keeps falling: 3,812 parameters can memorize 90 windows.',
  'dense/loss/val': 'WHAT: the same loss on the 30 held-out rows. WHY it turns up after a few frames: the model memorizes instead of generalizing (finding 4: data, not epochs).',
  'dense/accuracy/val': 'WHAT: exact match by task family on held-out prompts. Only prose, a local pattern, generalizes at 120 examples.',
  'dense/accuracy/train': 'WHAT: exact match on the training prompts, the memorization the loss curve shows.',
  'dense/logits/example-argmax': 'WHAT: the argmax prediction at each position of the example window 2+3=|5. (the answer 5 and the stop token are the graded positions).',
  'dense/attention/example': 'WHAT: the causal attention weights of the example, rows attend to columns at or before them. HOW: attention_weights over the trained block.',
  'moe/config': 'WHAT: the mixture configuration: four experts, top-1, the same widths as DN01, plus the balance weight in the lesson.',
  'moe/loss/train': 'WHAT: masked cross-entropy on training rows, dense-masked training: every expert runs and the gate zeroes the unchosen ones.',
  'moe/loss/val': 'WHAT: held-out loss. The mixture stores 1.86 times the parameters of DN01 and lands at the same validation loss (finding 1).',
  'moe/load': 'WHAT: tokens routed to each expert in the last epoch. WHY it stays spread: the balance term (weight 0.01) penalizes collapse onto one expert.',
  'moe/entropy': 'WHAT: mean router entropy over tokens; lower means more decisive routing.',
  'moe/balance': 'WHAT: the Switch balance term E times the sum of routed fraction times mean probability; 1.0 when perfectly even.',
  'moe/family-by-expert': 'WHAT: the share of each task family\'s answer tokens sent to each expert. The router never saw a family label; the structure is emergent (finding 2).',
  'moe/accuracy/val': 'WHAT: held-out exact match by family, same harness as DN01.',
  'moe/accuracy/train': 'WHAT: training exact match by family.',
  'moe/route/example': 'WHAT: the expert chosen for each position of the example window.',
  'moe2/config': 'WHAT: the top-2 configuration: the same four experts, two per token, gates renormalized over the kept pair.',
  'moe2/loss/train': 'WHAT: training loss under top-2; two experts per token fit the rows better (finding 3).',
  'moe2/loss/val': 'WHAT: held-out loss under top-2, worse than top-1 at this data size while training fit is better.',
  'moe2/load': 'WHAT: tokens per expert; every token counts twice under top-2.',
  'moe2/entropy': 'WHAT: mean router entropy.',
  'moe2/balance': 'WHAT: the balance term, computed over the top-2 mask.',
  'moe2/family-by-expert': 'WHAT: family-by-expert shares under top-2, flatter than top-1 by construction (specialization 0.42 against 0.61).',
  'moe2/accuracy/val': 'WHAT: held-out exact match by family; the first held-out MLPL answers appear here.',
  'moe2/accuracy/train': 'WHAT: training exact match by family.',
  'moe2/route/example': 'WHAT: the top-2 gate per position of the example window; two nonzero entries per row.',
  'moe2/specialization': 'WHAT: mean over families of the largest expert share; 0.25 would mean routing ignores the family.',
  'recur/config': 'WHAT: the recurrent block run: the DN01 widths, 300 epochs, and R=4 recurrences of one shared block.',
  'recur/loss/train': 'WHAT: deep-supervised training loss is not shown; this is the masked loss at the final recurrence on the training rows.',
  'recur/loss/val': 'WHAT: the masked loss at the final recurrence on the 30 held-out rows.',
  'recur/state/1': 'WHAT: the token state of the window 2+3=|5. after one recurrence (7 positions by 16).',
  'recur/state/2': 'WHAT: the same state after two recurrences of the same block.',
  'recur/state/3': 'WHAT: after three recurrences.',
  'recur/state/4': 'WHAT: after four recurrences, the state the head reads at inference.',
  'recur/argmax/1': 'WHAT: the argmax next token at each position after one recurrence.',
  'recur/argmax/2': 'WHAT: after two recurrences.',
  'recur/argmax/3': 'WHAT: after three recurrences.',
  'recur/argmax/4': 'WHAT: after four recurrences; the graded positions are the answer 5 and the stop.',
  'recur/loss/per-recurrence': 'WHAT: the trained R=4 model\'s held-out loss when stopped after 1, 2, 3, or 4 recurrences. WHY: a repeatable step should make stopping early cost something.',
  'recur/accuracy/val': 'WHAT: held-out exact match by family at R=4.',
  'recur/accuracy/train': 'WHAT: training exact match by family at R=4.',
  'rm/config': 'WHAT: the recurrent mixture run: MX01 widths, four experts, top-1, 300 epochs, R=3 recurrences.',
  'rm/loss/train': 'WHAT: the masked loss at the final recurrence on the training rows.',
  'rm/loss/val': 'WHAT: the masked loss at the final recurrence on the held-out rows.',
  'rm/load': 'WHAT: tokens per expert at each recurrence over the training rows; the balance term is applied at every recurrence.',
  'rm/entropy': 'WHAT: mean router entropy over windows and recurrences.',
  'rm/balance': 'WHAT: mean balance term over windows and recurrences; 1.0 when even.',
  'rm/change-share': 'WHAT: the share of masked tokens whose expert differs between consecutive recurrences: routing over reasoning time.',
  'rm/specialization-per-recurrence': 'WHAT: the specialization score of each recurrence\'s family-by-expert map (0.25 when routing ignores the family).',
  'rm/family-by-expert/1': 'WHAT: family-by-expert counts at recurrence 1.',
  'rm/family-by-expert/2': 'WHAT: family-by-expert counts at recurrence 2.',
  'rm/family-by-expert/3': 'WHAT: family-by-expert counts at recurrence 3.',
  'rm/route/example': 'WHAT: the expert chosen for each position of 2+3=|5. at each recurrence.',
  'rm/accuracy/val': 'WHAT: held-out exact match by family at R=3.',
  'rm/accuracy/train': 'WHAT: training exact match by family at R=3.',
  'ssm/config': 'WHAT: the state-space run: the DN01 widths, a 32-value state, 300 epochs, 90 training and 30 validation windows.',
  'ssm/loss/train': 'WHAT: the masked loss on the training rows; it falls to 0.01, lower than DN01 (the scan memorizes at least as readily).',
  'ssm/loss/val': 'WHAT: the masked loss on the 30 held-out rows; it bottoms out at the first checkpoint like DN01 and climbs higher (4.56 against 3.79).',
  'ssm/accuracy/val': 'WHAT: held-out exact match by family: the same prose answers as DN01 and one more MLPL answer.',
  'ssm/accuracy/train': 'WHAT: training exact match by family, 0.99 overall against DN01 0.70.',
  'ssm/decay': 'WHAT: the learned decay per state dimension, sigmoid of 32 logits trained from 0.9: 0 forgets at once, 1 accumulates forever. HOW: it spans 0.26 to 0.98, mean 0.76.',
  'ssm/state/example': 'WHAT: the 32-value state after each position of 2+3=|5. (rows are positions): s_t = a * s_(t-1) + x_t B on the normalized embedding.',
  'ssm/logits/example-argmax': 'WHAT: the argmax next token at each position of the example window through the trained block.',
  'ssm/survival/example': 'WHAT: the share of each position still present in the state at the last position, mean over dimensions of a^(6-t); the lesson draws it as a fading chip.',
  'ssm/kv-bytes': 'WHAT: persistent state bytes one-head attention keeps at f64 for 16, 64, 256, and 1,024 tokens of history: a key and a value row per token, 2 x history x 16 x 8 (derived).',
  'ssm/state-bytes': 'WHAT: persistent state bytes the scan keeps at the same histories: one 32-value vector, 256 bytes, whatever the history (derived).',
  'engram/config': 'WHAT: the Engram run: DN01 widths, 300 epochs, 256 slots per n-gram order, 8 values per row, two orders (2-gram and 3-gram); builtin 0 means the from-scratch form trained.',
  'engram/collisions': 'WHAT: over the 90 training windows, distinct n-gram contexts per order, how many of them were forced to share a row (collisions), and how many of the table rows were addressed at all. HOW: contexts use the same pad-0 windowing as the frozen hash.',
  'engram/loss/train': 'WHAT: the masked loss on the training rows.',
  'engram/loss/val': 'WHAT: the masked loss on the held-out rows; compare DN01 at 3.79.',
  'engram/slots/nonzero': 'WHAT: table rows that hold any nonzero value; only addressed rows ever move (gather_rows scatter-adds the gradient).',
  'engram/gate/mean': 'WHAT: the mean gate over every position and dimension of the training windows; it starts at sigmoid(-2), about 0.12.',
  'engram/accuracy/val': 'WHAT: held-out exact match by family. WHY: prose is a fixed local pattern (animal to place), the family Engram should move first.',
  'engram/accuracy/train': 'WHAT: training exact match by family.',
  'engram/parity': 'WHAT: the from-scratch form against the sw-MLPL engram builtin on the same trained parameters: summed absolute output difference over the 30 held-out windows, and the table and gate-weight gradient differences on one window. Zero means both forms are the same function.',
  'engram/rows/example': 'WHAT: the table rows each position of 2+3=|5. addresses: the 2-gram row (first region) and the 3-gram row (second region, offset by the slot count). HOW: ngram_hash, the frozen cross-backend contract, plus the region offset.',
  'engram/gate/example': 'WHAT: the mean gate per position of the example window: how much retrieved memory joins the residual stream there.',
  'engram/retrieved/example': 'WHAT: the sixteen values read for each position (eight from the 2-gram row, eight from the 3-gram row) before the projection.',
  'engram/value/example': 'WHAT: the mean absolute projected value per position; zero where the addressed rows never trained.',
  're/config': 'WHAT: the composed run: MX01 widths, four experts, top-1, 300 epochs, R=3 recurrences, an Engram table of 256 slots per order with 8 values per row.',
  're/loss/train': 'WHAT: the masked loss at the final recurrence on the training rows.',
  're/loss/val': 'WHAT: the masked loss at the final recurrence on the held-out rows; compare RM01 at 3.42 and EG01 at 4.67.',
  're/load': 'WHAT: tokens per expert at each recurrence over the training rows; the router decides on a state that already holds retrieved memory.',
  're/entropy': 'WHAT: mean router entropy over windows and recurrences.',
  're/balance': 'WHAT: mean balance term over windows and recurrences; 1.0 when even.',
  're/change-share': 'WHAT: the share of masked tokens whose expert differs between consecutive recurrences.',
  're/specialization-per-recurrence': 'WHAT: the specialization score of each recurrence\'s family-by-expert map (0.25 when routing ignores the family).',
  're/gate/per-recurrence': 'WHAT: the mean Engram gate at each recurrence over the training windows: how much retrieved memory each recurrence admits.',
  're/slots/nonzero': 'WHAT: table rows that hold any nonzero value after training; only addressed rows ever move.',
  're/route/example': 'WHAT: the expert chosen for each position of 2+3=|5. at each recurrence.',
  're/gate/example': 'WHAT: the mean Engram gate per position of 2+3=|5. at each recurrence.',
  're/accuracy/val': 'WHAT: held-out exact match by family at R=3.',
  're/accuracy/train': 'WHAT: training exact match by family at R=3.',
  'walk/config': 'WHAT: the walkthrough model: d_model 16, hidden 32, four experts, window 28, trained 40 epochs so routing is learned.',
  'walk/tokens': 'WHAT: the token ids of the window 17+25=|42. padded with id 0. HOW: u:domain_encode maps characters to alphabet indices.',
  'walk/hidden': 'WHAT: what the router sees: 28 rows of 16 after embedding, position, attention with a residual, and RMS norm.',
  'walk/logits': 'WHAT: router logits, one row per token, one column per expert. HOW: a single linear layer 16 to 4.',
  'walk/probs': 'WHAT: softmax of the logits per row. WHY: the chosen expert\'s probability becomes the gate, which is how the router gets a gradient.',
  'walk/entropy': 'WHAT: mean entropy of the rows; decisive routing is low.',
  'walk/mask': 'WHAT: the top-1 mask, a one-hot per row from argmax. HOW: argmax and one_hot are stop-gradient constants on the tape (finding F5).',
  'walk/load': 'WHAT: rows per expert in this window.',
  'walk/balance': 'WHAT: the balance term for this window, 1.0 when even.',
  'walk/gate': 'WHAT: gate = probabilities times mask (Switch style). Each row keeps one nonzero entry.',
  'walk/gate-row-sum': 'WHAT: the kept probability per token; a renormalized top-1 gate would be identically 1 and give the router no gradient.',
  'walk/groups': 'WHAT: the expert index per token: the dispatch table.',
  'walk/group-order': 'WHAT: token indices sorted by expert: the order the sparse path gathers rows in.',
  'walk/expert0-rows': 'WHAT: the hidden rows gathered for expert 0 (compress by its mask column); the expert runs once on this sub-batch.',
  'walk/expert0-out': 'WHAT: expert 0\'s output rows, scaled by the gate before the scatter.',
  'walk/expert-evals': 'WHAT: expert row evaluations, dense-masked (every expert on every token) against sparse (one expert per token).',
  'walk/dense-out': 'WHAT: the dense-masked mixture output, sum over experts of expert(x) times its gate column.',
  'walk/sparse-out': 'WHAT: the sparse output, each expert\'s rows scattered back through a one-hot selection matmul (u:place_rows).',
  'walk/parity': 'WHAT: max |dense - sparse| over the window. WHY it is 0: the two paths are the same function (SD01).',
  'walk/next-tokens': 'WHAT: the argmax next token at every position through the head; the graded positions are the answer 42 and the stop.',
};

const HOWTO = [
  ['Recording', 'A JSON list of frames; each frame is a step with named observations (name, shape, values). The training runs were written by emit_frame during training; the walkthrough was written by demos/walkthrough_export.mlpl after training. The gate pins or regenerates them. Nothing is computed here.'],
  ['Scalars', 'Shown with their history across frames as a sparkline, so loss curves appear as you step.'],
  ['Vectors', 'Bars with the labels the lesson uses (experts, task families).'],
  ['Matrices', 'Tables shaded by value; pink cells are the one-hot or gate entries that are on.'],
  ['Groups', 'In the walkthrough, tokens are drawn as chips colored by the expert that received them.'],
];

const state = { lesson: null, data: null, frame: 0, timer: null, alphabet: null };

const $ = (id) => document.getElementById(id);
const fmt = (v) => (Number.isInteger(v) ? String(v) : (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3)));

function reshape(values, shape) {
  if (shape.length <= 1) return values;
  const [r, c] = shape;
  const rows = [];
  for (let i = 0; i < r; i++) rows.push(values.slice(i * c, (i + 1) * c));
  return rows;
}

function historyOf(name) {
  const out = [];
  for (let i = 0; i <= state.frame; i++) {
    const fr = state.data.frames[i];
    const o = fr.observations.find((x) => x.name === name);
    if (o && o.values.length === 1) out.push({ step: fr.step, v: o.values[0] });
  }
  return out;
}

function sparkline(points) {
  if (points.length < 2) return '';
  const w = 360, h = 60, pad = 4;
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const sx = (i) => pad + (i * (w - 2 * pad)) / (points.length - 1);
  const sy = (v) => (hi === lo ? h / 2 : h - pad - ((v - lo) * (h - 2 * pad)) / (hi - lo));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.v).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="history"><path d="${d}" fill="none" stroke="#fbbf24" stroke-width="2"/></svg>`;
}

function tokenLabels(values) {
  if (!state.alphabet) return values.map(String);
  return values.map((id) => (state.alphabet[id] === ' ' ? 'sp' : state.alphabet[id] || String(id)));
}

function renderObservation(o, frameIndex) {
  const labels = LABELS[o.name] || {};
  const cap = CAPTIONS[o.name] || '';
  let body = '';
  if (o.values.length === 1) {
    const hist = historyOf(o.name);
    body = `<div class="scalar">${fmt(o.values[0])}</div>${sparkline(hist)}<div class="history">${hist.length} frames so far</div>`;
  } else if (o.shape.length <= 1) {
    if (o.name === 'walk/tokens' || o.name === 'walk/next-tokens') {
      const chars = tokenLabels(o.values);
      body = `<div class="chips">${chars.map((c, i) => `<span class="chip" title="position ${i}">${c}</span>`).join('')}</div>`;
    } else if (o.name === 'walk/groups') {
      const toks = state.data.frames[0].observations.find((x) => x.name === 'walk/tokens');
      const chars = tokenLabels(toks.values);
      body = `<div class="chips">${o.values.map((e, i) => `<span class="chip e${e}" title="token ${i} to expert ${e}">${chars[i]}</span>`).join('')}</div>`;
    } else {
      const max = Math.max(...o.values.map(Math.abs), 1e-9);
      const items = labels.items || o.values.map((_, i) => String(i));
      body = `<div class="bars">${o.values.map((v, i) => `<div class="bar-row"><span>${items[i] ?? i}</span><div class="bar" style="width:${(100 * Math.abs(v)) / max}%"></div><span>${fmt(v)}</span></div>`).join('')}</div>`;
    }
  } else {
    const rows = reshape(o.values, o.shape);
    const max = Math.max(...o.values.map(Math.abs), 1e-9);
    const rl = labels.rows || rows.map((_, i) => String(i));
    const cl = labels.cols || rows[0].map((_, j) => String(j));
    const wide = rows[0].length > 8;
    const shown = wide ? rows.map((r) => r.slice(0, 8)) : rows;
    const cls = (v) => (o.name.endsWith('/mask') ? (v ? 'on' : '') : (Math.abs(v) > 0.5 * max ? 'hi' : ''));
    body = `<table class="grid"><thead><tr><th></th>${cl.slice(0, shown[0].length).map((c) => `<th>${c}</th>`).join('')}${wide ? '<th>...</th>' : ''}</tr></thead><tbody>` +
      shown.map((r, i) => `<tr><th>${rl[i] ?? i}</th>${r.map((v) => `<td class="${cls(v)}">${fmt(v)}</td>`).join('')}${wide ? '<td>...</td>' : ''}</tr>`).join('') +
      `</tbody></table>${wide ? `<div class="history">first 8 of ${rows[0].length} columns shown</div>` : ''}`;
  }
  return `<div class="obs"><span class="name">${o.name}</span><span class="shape">[${o.shape.join(', ')}]</span>${cap ? `<p class="caption">${cap}</p>` : ''}${body}</div>`;
}

function render() {
  const fr = state.data.frames[state.frame];
  $('frame-label').textContent = `frame ${state.frame + 1} of ${state.data.frames.length} (step ${fr.step})`;
  $('slider').value = String(state.frame);
  $('frame').innerHTML = fr.observations.map((o) => renderObservation(o, state.frame)).join('');
}

async function loadLesson(id) {
  const lesson = LESSONS.find((l) => l.id === id) || LESSONS[0];
  const res = await fetch(lesson.path);
  if (!res.ok) throw new Error(`${lesson.path}: HTTP ${res.status}`);
  const data = await res.json();
  state.lesson = lesson; state.data = data; state.frame = 0;
  state.alphabet = data.alphabet ? data.alphabet.a : null;
  $('lesson-title').textContent = lesson.title;
  $('lesson-caption').textContent = lesson.caption + (data.text ? ` Window text: ${data.text.t}` : '');
  $('slider').max = String(data.frames.length - 1);
  render();
}

function step(delta) {
  const n = state.data.frames.length;
  state.frame = Math.min(n - 1, Math.max(0, state.frame + delta));
  render();
}

function togglePlay() {
  if (state.timer) { clearInterval(state.timer); state.timer = null; $('play').textContent = 'Play'; return; }
  $('play').textContent = 'Pause';
  state.timer = setInterval(() => {
    if (state.frame >= state.data.frames.length - 1) { togglePlay(); return; }
    step(1);
  }, 700);
}

async function verifyAll() {
  const lines = [];
  for (const l of LESSONS) {
    try {
      await loadLesson(l.id);
      let frames = 0, observations = 0;
      for (let i = 0; i < state.data.frames.length; i++) { state.frame = i; render(); frames++; observations += state.data.frames[i].observations.length; }
      lines.push(`${l.id}: ${frames} frames stepped, ${observations} observations rendered, last step ${state.data.frames[frames - 1].step}`);
    } catch (e) {
      lines.push(`${l.id}: ERROR ${e.message}`);
    }
  }
  const pre = $('verify');
  pre.hidden = false;
  pre.textContent = lines.join('\n');
  document.title = 'verified: ' + (lines.some((x) => x.includes('ERROR')) ? 'errors' : 'ok');
}

async function main() {
  const sel = $('lesson');
  for (const l of LESSONS) { const o = document.createElement('option'); o.value = l.id; o.textContent = l.title; sel.appendChild(o); }
  $('howto').innerHTML = HOWTO.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('');
  sel.addEventListener('change', () => loadLesson(sel.value).catch(showError));
  $('prev').addEventListener('click', () => step(-1));
  $('next').addEventListener('click', () => step(1));
  $('play').addEventListener('click', togglePlay);
  $('slider').addEventListener('input', (e) => { state.frame = Number(e.target.value); render(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  try {
    const bi = await (await fetch('build-info.json')).json();
    $('build-info').textContent = `${bi.host} · ${bi.sha} · ${bi.timestamp}`;
  } catch (e) { $('build-info').textContent = 'local build'; }
  const params = new URLSearchParams(location.search);
  if (params.get('verify') === '1') { await verifyAll(); return; }
  const wanted = params.get('lesson') || 'mx01';
  sel.value = wanted;
  await loadLesson(wanted);
  const f = Number(params.get('frame'));
  if (Number.isInteger(f) && f > 0) { state.frame = Math.min(f - 1, state.data.frames.length - 1); render(); }
}

function showError(e) {
  $('lesson-title').textContent = 'Could not load the recording';
  $('lesson-caption').textContent = e.message;
}

main().catch(showError);
