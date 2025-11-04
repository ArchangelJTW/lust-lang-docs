# Welcome to Lust

Lust is a Lua-inspired language that aims to deliver Rust-grade guarantees. It offers a production-ready toolchain built in Rust with a trace-based JIT, strict static typing, and an ergonomic runtime designed for embedding. This book walks through the core ideas, language features, and embedding workflows so you can ship Lust scripts safely and confidently.

Lust by no means aims to fully replace the safety of Rust, but offers layers of protection in the type checker and compiler that the majority of scripting languages lack. Even languages like TypeScript often suffer from ambiguity due to the prolific use of `any`, `null`, and `undefined` types, which notably do not exist in Lust. The only ambiguous type Lust has is `unknown`, which is a type that necessitates narrowing at the typechecking level. A null type is also notably absent, preferring Rust's approach of handling nullability explcitly via an `Option` wrapper type.

## What to Expect

- **Approachable syntax** &mdash; Lua-like structure with modern conveniences: structs, enums with data, inference, and multiple return values.
- **Safety first** &mdash; The `is` operator drives type narrowing and variant binding, unifying how you check and destructure data.
- **Performance focus** &mdash; A bytecode VM backed by dynasm-rs promotes hot loops to native x64 code and includes cooperative multitasking.
- **Embedding friendly** &mdash; First-class Rust bindings and a stable C ABI make Lust a natural choice for extending engines, tools, and services.

## Project Status

The core language is complete: lexer, parser, type checker, bytecode VM, trace JIT, and an ergonomic CLI with stack traces and disassembly. Preliminary module support has landed (see the examples), with ongoing work aimed at richer diagnostics and full package tooling.

This book is a WIP, but will eventually document every aspect of the language. Start with the [Quick Start](./quick-start.md) to install the CLI, explore the [Language Tour](./language-tour/overview.md) for core syntax, then dive into [Embedding](./embedding.md) when you are ready to integrate Lust into your host runtime.
