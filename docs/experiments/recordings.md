# Recordings and host handoff

## Question

Can the generic demo-extensions host render these lessons from recorded
frames without any repo-specific code?

## Change from the previous experiment

Not a model change. DN01, MX01, and MX02 stream named frames through
`emit_frame` during training; the streams are captured from the live
server and pinned.

## Configuration

Schema `fixtures/recordings/recording-schema-v0.json`; three recordings
listed with budgets, first and last frame names, and hashes in
`scripts/recordings.conf`; the gate replays each lesson through a live
`mlpl-serve` and compares against the committed recording.

## Results

Three recordings pinned; every train step and while iteration emits in
order; live replay equals the committed frames. The host work order is
[host handoff](../implementation/host-handoff.md).

## What we learned

Findings F8 (literal frame names, so no forwarding facade) and F16
(no include or arguments in the server, so a bundler and inline fixture
twin) shaped the recording pipeline; see
[sw-MLPL findings](../reference/sw-mlpl-findings.md).

## What we did not prove

That the host renders them: that is the demo-extensions side of the
handoff, tracked in
[cross-repo handoffs](../implementation/cross-repo-handoffs.md).

## The live demo

The recordings are also what the live demo steps through:
<https://sw-ml-study.github.io/moe-microscope/>. The page (`learn/`, static
JavaScript, no build step) fetches the three pinned training recordings and
a fourth fixture, `fixtures/recordings/walkthrough-v0.json`, written by
`demos/walkthrough_export.mlpl`: the MX01 mixture trained 40 epochs, then
one window recorded stage by stage (hidden rows, router logits,
probabilities, top-1 mask, gate, dispatch groups, one expert's sub-batch and
output, the dense-masked and sparse outputs, their parity, the next tokens).
Scalars are drawn with their history, vectors as bars, matrices as shaded
tables, and the dispatch groups as token chips colored by expert; every
number is a recorded value and the page is a playback (no sw-MLPL code
runs in the browser). `?verify=1` makes the page step every lesson to
its last frame and print a report, which is how the deploy is checked.
The verification record of the published site is
[live-demo.md](../results/live-demo.md).

## Raw evidence

```sh
just emit-frame-loops     # every train step and while iteration streams in order
just recording-check      # schema, budgets, shapes, names, and pinned hashes for every recording
just recordings           # live server runs of DN01, MX01, and MX02 equal the committed recordings
just recordings write MX01   # recapture one recording (or all, with no id)
just build-local-serve    # compile a current mlpl-serve into tmp/ without touching ../sw-mlpl
just walkthrough          # check the walkthrough fixture (write regenerates it, about ten seconds)
just check-learn          # the live demo page references committed files only and carries the footer
just serve-learn          # compose the live demo into tmp/site and serve it locally
```

Index: [`fixtures/recordings/index-v1.json`](../../fixtures/recordings/index-v1.json).
