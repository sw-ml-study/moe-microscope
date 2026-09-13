# Experiments

Each experiment introduces one mechanism and answers one question. Every
page is a short laboratory report: the question, what changed from the
previous experiment, the configuration, results, what was learned, what
was not proved, and where the raw evidence lives. Numbers cite a row of the
[results table](../reference/results.md), a committed diagram, or a
[finding](../results/current-findings.md).

| Order | Experiment | Question |
|---|---|---|
| 1 | [DM01 synthetic domain](DM01.md) | What does the model see, and is the held-out split honest? |
| 2 | [DN01 dense baseline](DN01.md) | How good is a tiny dense model? |
| 3 | [MX01 routing](MX01-routing.md) | What does a router compute before anything is trained? |
| 4 | [MX01 top-1 mixture](MX01.md) | Can we store more than we execute at unchanged quality? |
| 5 | [SD01 sparse dispatch](SD01.md) | Does conditional compute avoid the unused work exactly? |
| 6 | [MX02 top-2 and specialization](MX02.md) | What does the second expert buy, and do experts specialize? |
| 7 | [DS01 data scale](DS01.md) | Does more data or more training fix low-data behavior? |
| 8 | [LD01 low-rank delta experts](LD01.md) | How many experts can we afford? |
| 9 | [TE01 in-repo teacher](TE01.md) | Is there a usable source of soft targets? |
| 10 | [RB01 resource budget](RB01.md) | How big is MicroMoE? |
| 11 | [GB01 generation benchmark](GB01.md) | How fast is it? |
| 12 | [Recordings and host handoff](recordings.md) | What does the generic host render? |
| 13 | [CD00 campus snapshot A](CD00.md) | What does the campus docent see, and is its corpus honest? |
| 14 | [CD01 docent dense classifier](CD01.md) | How well does a flat classifier predict intent and destination, and where does it fail? |

The machine-readable inventory is [`catalog/lessons.toml`](../../catalog/lessons.toml).
Experiments planned for later sagas (RC01, RM01, EG01, RE01, KD01, RW01,
AD01, DS02, QZ01, PK01, XC01, HY01, ...) are listed in the
[delivery plan](../overview/plan.md).
