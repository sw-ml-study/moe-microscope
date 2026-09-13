# MX01 routing microscope

## Question

What does a router compute, step by step, before anything is trained?

## Change from the previous experiment

A router layer over the hidden state and the four matrices it produces:
logits, probabilities, top-1 mask, gate. No training.

## Configuration

Router width 16 to 4 experts on one fixed window of the DN01 hidden
states; softmax, argmax one-hot, Switch gate (probabilities kept by the
mask), the load-balance term with T passed explicitly, top-2 mask by two
argmax passes.

## Results

One diagram: the four aligned matrices, the dispatch load per expert, the
top-2 mask, router entropy, and the balance term for the untrained router.

![MX01 routing: logits, probabilities, one-hot mask, and gate as four aligned matrices, with the dispatch load, top-2 mask, entropy, and balance below](../../assets/previews/router-routing.svg)

## What we learned

The pick is non-differentiable and the gate carries the gradient; that is
why the Switch gate multiplies by the chosen probability rather than by
one. Findings F5 (argmax and one-hot are stop-gradient) came from here.

## What we did not prove

Anything about trained behavior; MX01 does that.

## Raw evidence

```sh
just router          # run the routing microscope and check its diagram
just tests tests/test_moe.mlpl
```

Code: [`lib/moe.mlpl`](../../lib/moe.mlpl),
[`demos/router_microscope.mlpl`](../../demos/router_microscope.mlpl).
