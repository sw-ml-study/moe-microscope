# Quantization

## What problem does it solve?

Bytes. Smaller expert weights mean more experts fit in a cache and less
data crosses a bus; for an offloaded mixture, quantized experts matter more
than quantized shared weights.

## What the projections say

A 1,072-parameter expert is 8,576 bytes at f64, 4,288 at FP32, 2,144 at
FP16, 1,072 at INT8, and 536 bytes of INT4 payload. The whole four-expert
model is 55.4 KiB at f64 and about 4.8 KiB with INT8 shared weights and
INT4 experts, payload only. These are estimates; QZ01 and PK01 replace them
with measured file sizes including scales, headers, and alignment.

## What the microscope will measure

Quality loss at INT8 and INT4 (exact match and loss), bytes per expert,
packed file size, and how many more experts a byte budget holds.

## Status

Planned: the quantization, packing, and cache saga; arithmetic reused from
the peer repository by handoff rather than rewritten.

## Deeper reference

- [Resource economics](../results/resource-economics.md), sections 2 and 4
