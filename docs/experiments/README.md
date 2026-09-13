# Experiments

Each experiment introduces one mechanism and answers one question. These
pages hold the lesson sections moved out of the README; Saga 3 step 5
rewrites each as a laboratory report (question, change from the previous
experiment, configuration, results, what we learned, what we did not prove,
raw evidence).

Sequence:

1. [DM01 synthetic domain](DM01.md): windows, tags, and a held-out split
2. [DN01 dense baseline](DN01.md): the reference model
3. [MX01 routing](MX01-routing.md): logits, mask, gate, dispatch, before training
4. [MX01 top-1 mixture](MX01.md): four experts trained with load balance
5. [SD01 sparse dispatch](SD01.md): exact parity at a quarter of the work
6. [MX02 top-2 and specialization](MX02.md): the family-by-expert map
7. [DS01 data scale](DS01.md): data moves the held-out columns, epochs do not
8. [LD01 low-rank delta experts](LD01.md): sixteen experts for the price of two
9. [TE01 in-repo teacher](TE01.md): soft targets for distillation
10. [RB01 resource budget](RB01.md): how big it is
11. [GB01 generation benchmark](GB01.md): how fast it is
12. [Recordings and host handoff](recordings.md): what the generic host renders

The machine-readable inventory is [`catalog/lessons.toml`](../../catalog/lessons.toml);
every run is a row in the [results table](../reference/results.md).
