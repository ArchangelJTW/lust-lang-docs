# Welcome to Lust

Lust is a strongly typed, Lua-inspired scripting language implemented in Rust. It combines Lua's approachable syntax and expressive scripting feel with Rust-grade static safety, an ergonomic embedding API, and a high-performance trace-based JIT compiler.

Many scripting languages suffer from silent bugs due to pervasive dynamic typing, unexpected `nil`/`null`/`undefined` errors, or unchecked dictionary lookups. Lust addresses these challenges directly:

- **No `null` or `nil` values**: Optional values are explicitly represented with `Option<T>` (`Some` or `None`).
- **No unchecked `any`**: Dynamic values must use the `unknown` type and be narrowed via `is` or safely cast via `as` before use.
- **Safe array access**: Bracket reads (`values[i]`) return `Result<T, IndexError>` instead of causing unhandled bounds errors or returning a silent `nil`.
- **Nominal traits & generics**: Static generics are inferred and checked at compile time with zero runtime dispatch overhead.

---

## Language Highlights

| Feature | Description |
|---|---|
| **Static Types & Inference** | Declare types with `:` or let the typechecker infer them from context. |
| **Complete Lua 5.4 Math & Bitwise** | Full arithmetic and bitwise operators: `//`, `^`, `&`, `\|`, `~`, `<<`, `>>`, `^^` and compound assignments. |
| **Unified `is` Operator** | Check types, narrow union types, and destructure enum variants cleanly in conditionals. |
| **Safe `as` Casting** | Fallible downcasting from `unknown` returns `Option<T>` without runtime crashes. |
| **Typed Collections Architecture** | High-performance unboxed `Array<T>` and `Map<K, V>` collections managed via dedicated `array` and `map` standard modules. |
| **Multi-Tier Execution Pipeline** | Seamless execution across portable Bytecode VM, Cranelift JIT, and Direct Zig 0.17.1 AOT compilation (`.dylib`, `.a`, `--emit-h`). |
| **Deterministic Memory** | Reference counting frees resources immediately; fallback cycle collector cleans up graphs; supports `--no-gc` zero-overhead mode. |
| **Cooperative Multitasking** | Built-in `task` module provides coroutine scheduling with structured diagnostics. |
| **First-Class Embedding** | Rich Rust embedding bindings (`EmbeddedProgram`), C FFI (`lust_ffi.h`), and native extension loading. |

---

## Casing Conventions

Lust follows an explicit casing convention that makes code roles immediately recognizable:

- **`lowercase`** &mdash; Primitive types and keywords: `int`, `float`, `string`, `bool`, `unknown`, `local`, `function`, `struct`, `enum`.
- **`PascalCase`** &mdash; Nominal types and enum variants: `Option`, `Result`, `Array`, `Map`, `Some`, `None`, `Ok`, `Err`, `Task`, and user-defined types.
- **`snake_case`** &mdash; Variables, functions, methods, fields, and module namespaces: `max_retries`, `calculate_total`, `math.floor`, `array.len`.

---

## How to Use This Book

This guide is structured to take you from your first script to advanced language concepts and embedding:

1. **[Quick Start](./quick-start.md)** &mdash; Install the CLI, configure your project, and run your first program.
2. **[Language Guide](./language-tour/overview.md)** &mdash; Learn language features step-by-step: variables, control flow, collections, structs, enums, pattern matching, generics, modules, I/O, and concurrency.
3. **[Embedding Lust](./embedding.md)** &mdash; Integrate the Lust runtime into Rust or C applications, build Rust extensions, and link native libraries.
4. **[CLI & Tooling](./tooling.md)** &mdash; Command-line options, disassembly, package management, and `lust-config.toml` reference.
5. **[Roadmap](./roadmap.md)** &mdash; Ongoing developments and future language goals.
6. **[Appendix](./appendix.md)** &mdash; Summary of syntax differences from Lua, keywords, and standard library reference.
