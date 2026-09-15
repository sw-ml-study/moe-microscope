set shell := ["sh", "-cu"]

# Show available repository tasks.
default:
    @just --list

# Check canonical formatting and documentation for tracked MLPL source.
mlpl-style:
    ./scripts/check-mlpl-style

# Run native mlplunit tests; arguments select paths, tags, or filters.
tests *args:
    ./scripts/run-tests {{args}}

# Re-run the upstream-finding reproducers and require the documented outcome.
probes:
    ./scripts/run-probes

# Run the domain microscope and check its three diagrams; `just domain write` regenerates them.
domain mode="check":
    ./scripts/run-domain-demo {{mode}}

# Run CD00, the campus snapshot and docent corpus microscope, and check its diagrams, fixture, and row; `just campus write` regenerates them.
campus mode="check":
    ./scripts/run-campus-demo {{mode}}

# Run CD01, the docent dense classifier (about a minute), and check its diagrams and docent row; `just docent write` regenerates them.
docent mode="check":
    ./scripts/run-docent-demo {{mode}}

# Run MB01, the deterministic matcher baseline (seconds), and check its diagram and docent rows; `just matcher write` regenerates them.
matcher mode="check":
    ./scripts/run-matcher-demo {{mode}}

# Run CD01b, the docent over word vectors from the campus's own text (about three minutes), and check its diagrams and rows; `just wordvec write` regenerates them.
wordvec mode="check":
    ./scripts/run-wordvec-demo {{mode}}

# Reassemble fixtures/campus/docs-a.txt from the snapshot's text and the linked repositories' READMEs (network).
campus-docs:
    ./scripts/assemble-campus-docs

# Export (or check) the routing and dispatch walkthrough fixture the live demo steps through; `just walkthrough write` regenerates it.
walkthrough mode="check":
    ./scripts/run-walkthrough-export {{mode}}

# Check that the live demo page references committed files only and carries the standard footer.
check-learn:
    ./scripts/check-learn

# Compose the live demo into tmp/site and serve it locally.
serve-learn port="8765":
    ./scripts/build-site tmp/site && cd tmp/site && python3 -m http.server {{port}}

# Run RC01, the recurrent block sweep over R = 1..4 (minutes), and check its diagrams and rows; `just recur write` regenerates them.
recur mode="check":
    ./scripts/run-recur-demo {{mode}}

# Run RM01, the recurrent mixture at R = 2 and 3 (minutes), and check its diagrams and rows; `just rm write` regenerates them.
rm mode="check":
    ./scripts/run-rm-demo {{mode}}

# Run the DN01 dense baseline (about 16 seconds) and check its diagrams and results row; `just dense write` regenerates them.
dense mode="check":
    ./scripts/run-dense-demo {{mode}}

# Prove that emit_frame streams every train step and while iteration over live SSE, and pin F16.
emit-frame-loops:
    ./scripts/run-emit-frame-loops

# Validate every committed recording and the pinned index.
recording-check:
    ./scripts/check-recordings

# Prove that live mlpl-serve runs equal the committed recordings; `just recordings write MX01` recaptures one (or all).
recordings mode="check" *ids:
    ./scripts/run-recording-parity {{mode}} {{ids}}

# Build a current mlpl-serve from the adjacent source into tmp/ (the sibling is never modified).
build-local-serve:
    ./scripts/build-local-serve

# Validate the committed teacher fixture; `just teacher write` retrains the teacher (about a minute) and reinstalls it.
teacher mode="check":
    ./scripts/run-teacher {{mode}}

# Run the MX01 routing microscope and check its diagram; `just router write` regenerates it.
router mode="check":
    ./scripts/run-router-demo {{mode}}

# Run MX01, the dense-masked mixture of experts (about 36 seconds), and check its diagrams and results row; `just moe write` regenerates them.
moe mode="check":
    ./scripts/run-moe-demo {{mode}}

# Run SD01, sparse dispatch with parity against the dense-masked path; `just dispatch write` regenerates its diagram and row.
dispatch mode="check":
    ./scripts/run-dispatch-demo {{mode}}

# Run MX02, top-2 routing with the specialization map (about 36 seconds); `just moe2 write` regenerates its diagrams and row.
moe2 mode="check":
    ./scripts/run-moe2-demo {{mode}}

# Validate the committed DS01 data-scale points and redraw their diagram; `just scale write` reruns the whole sweep (minutes).
scale mode="check":
    ./scripts/run-scale-sweep {{mode}}

# Run LD01, low-rank delta experts with a shared FFN (under a minute); `just delta write` regenerates its diagrams and rows.
delta mode="check":
    ./scripts/run-delta-demo {{mode}}

# Regenerate or check the RB01 resource budget (no training): docs/results/resource-economics.md and its storage diagram.
budget mode="check":
    ./scripts/run-budget-demo {{mode}}

# Validate the GB01 generation benchmark fixture and document; `just benchmark write` re-measures (seconds).
benchmark mode="check":
    ./scripts/run-benchmark {{mode}}

# Print the selected sw-MLPL executable.
mlpl-path:
    ./scripts/select-mlpl

# Run the complete precommit gate.
check:
    ./scripts/check
