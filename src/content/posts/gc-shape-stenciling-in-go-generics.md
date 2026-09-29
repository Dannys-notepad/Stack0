---
title: "GC shape stenciling in Go generics"
description: "Generic functions in Go don't get a fresh compiled body for every type you plug in. The compiler buckets types by their GC shape and lets every type in a bucket share one function body."
date: 2026-07-11
category: "GO"
tags: ["go"]
draft: false
---

Every generic function in Go compiles to more than one version, but nowhere near one per instantiation. Instead the compiler groups the types you plug in by **GC shape**: how big a value is, and where its pointers live. Two types with the same shape share one compiled function body.

## The problem with naive monomorphization

If the compiler generated a fresh copy of `Map[K, V]` for every `K` and `V` a program used, binary size would balloon with every new instantiation, and build times would follow. C++ templates take roughly this approach, and large template-heavy codebases pay for it in compile time and binary bloat.

Go's answer is to notice that the machine code for a generic function rarely needs to know the exact type it's working with — it mostly needs to know the size of the value and where the garbage collector should look for pointers inside it.

> The compiler doesn't need to know it's holding a `*User` versus a `*Order` to scan it correctly — a pointer is a pointer.

## What a GC shape actually groups

Two concrete types share a GC shape when they agree on:

1. Size in bytes
2. Alignment requirements
3. The layout of pointer-containing fields, for the garbage collector's purposes

Under this rule, `int64`, `float64`, and `uint64` all share a shape — they're all 8 bytes with no pointers. Almost every pointer type also shares a single shape, regardless of what it points to.

Here's a rough table of how common types bucket:

| Type | Size | Contains pointers | GC shape bucket |
|------|------|-------------------|-----------------|
| `int64` | 8 | No | `8-noptr` |
| `float64` | 8 | No | `8-noptr` |
| `uint64` | 8 | No | `8-noptr` |
| `string` | 16 | Yes | `16-ptr` |
| `*User` | 8 | Yes | `8-ptr` |
| `*Order` | 8 | Yes | `8-ptr` |

## Dictionaries at the call site

Sharing a function body across a shape means the body can no longer hard-code type-specific operations like calling a method or comparing two values. Instead, the compiler passes a small **dictionary** alongside the arguments: a struct of function pointers and metadata specific to the actual instantiated type.

```go
func Sum[T Number](vals []T) T {
    var total T
    for _, v := range vals {
        total += v
    }
    return total
}
```

The real generated code is considerably uglier than this, but the shape holds: one shared function body per GC shape, with a dictionary resolving everything the shape itself doesn't pin down.

You can inspect the generated code yourself:

```bash
go build -gcflags="-G=3 -S" ./...
```

The output is Go assembly, which is dense but readable once you know what to look for. Search for `runtime.newobject` and `runtime.gcWriteBarrier` to see where the dictionary shows up.

## Where this shows up in practice

You can see the effect directly by comparing binary sizes. A program instantiating `Map[string, int]`, `Map[string, int64]`, and `Map[string, uint64]` is barely larger than one instantiating just the first, because the latter two share a shape with each other for the value type and don't need new machine code.

The dictionary passing does cost something at runtime — an extra indirection per call compared to a hand-specialized function — which is part of why hot numeric code sometimes still reaches for `go:generate`-based specialization instead of generics.

### A quick aside on `go:generate`

The `go:generate` directive is a comment that tells `go generate` to run a command. It's not part of the build; it's a codegen hook you invoke manually. It predates generics and is still the go-to for cases where the compiler can't help you.[^1]

[^1]: The directive must appear at the start of a line, with no leading whitespace, in a `.go` file. `go generate ./...` runs them all.

## A note on performance

Not every generic function pays the dictionary cost equally. Inlining can eliminate it entirely when the compiler can see through the call, and for small functions it usually does. If you're chasing cycles, start with `go build -gcflags="-m"` and look for the word `inline`.

## Takeaways

Shape stenciling is a genuine tradeoff, not a free lunch:

- It buys back the binary size and compile time that naive monomorphization would cost.
- It costs a dictionary indirection on every generic call.
- For most code that trade is the right one, which is exactly why it's the default and not an opt-in.

If you take one thing away: the compiler is doing more work than you think to keep your binary small, and it's worth knowing what it's doing.