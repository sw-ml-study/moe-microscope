<!-- Moved verbatim from README.md in Saga 3 step 4; rewritten as a laboratory report in step 5. -->

# Recording and host handoff

Every lesson's observations are also captured over the live `mlpl-serve`
SSE path into a recording under the peer version-zero schema from
`../demo-ml-microscope`, pinned by hash in
[`fixtures/recordings/index-v1.json`](../../fixtures/recordings/index-v1.json). The
generic Rust/Yew/WASM microscope in `../demo-extensions` renders these
recordings without lesson-specific Rust; the work order is
[`docs/implementation/host-handoff.md`](../implementation/host-handoff.md). Because the server surface
has no `include`, `scripts/bundle-program` inlines a lesson's library tree
into the single program a host submits.

```sh
just emit-frame-loops     # every train step and while iteration streams in order
just recording-check      # schema, budgets, shapes, names, and pinned hashes for every recording
just recordings           # live server runs of DN01, MX01, and MX02 equal the committed recordings
just recordings write MX01   # recapture one recording (or all, with no id)
just build-local-serve    # compile a current mlpl-serve into tmp/ without touching ../sw-mlpl
```

Three lessons are recorded so far: DN01 (13 frames, 29 observations), and
MX01 and MX02 with their per-expert loads, family-by-expert counts, and
routing examples, all listed in `scripts/recordings.conf`.

The scripts select an absolute `MLPL_SERVE` override, then a local build
under `tmp/` made by `scripts/build-local-serve` (which compiles the adjacent
source into this repository's ignored directory and never touches the
sibling), then `../sw-mlpl/target/release/mlpl-serve`. Rebuild locally when
the adjacent server binary is older than the evaluator fixes it needs.
