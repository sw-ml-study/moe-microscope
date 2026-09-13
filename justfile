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

# Regenerate or check the RB01 resource budget (no training): docs/resource-budget.md and its storage diagram.
budget mode="check":
    ./scripts/run-budget-demo {{mode}}

# Print the selected sw-MLPL executable.
mlpl-path:
    ./scripts/select-mlpl

# Run the complete precommit gate.
check:
    ./scripts/check
