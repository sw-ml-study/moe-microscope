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

## Raw evidence

```sh
just emit-frame-loops     # every train step and while iteration streams in order
just recording-check      # schema, budgets, shapes, names, and pinned hashes for every recording
just recordings           # live server runs of DN01, MX01, and MX02 equal the committed recordings
just recordings write MX01   # recapture one recording (or all, with no id)
just build-local-serve    # compile a current mlpl-serve into tmp/ without touching ../sw-mlpl
```

Index: [`fixtures/recordings/index-v1.json`](../../fixtures/recordings/index-v1.json).
