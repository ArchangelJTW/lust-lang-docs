# Appendix

This appendix collects extra resources, glossary entries, and references to the official examples.

## Key Terms

- **Trace-based JIT** &mdash; Lust records hot loops and compiles them to native x64 via dynasm-rs.
- **`is` operator** &mdash; Unified type test and variant binding mechanism.
- **Task runtime** &mdash; Cooperative coroutine system with explicit yielding.
- **FFI boundary** &mdash; Points where Lust interacts with Rust or C.
- **`Option<T>`** &mdash; Optional values with `Some`/`None` helpers for branching, unwrapping, and defaults.
- **`Result<T, E>`** &mdash; Fallible operations that distinguish success (`Ok`) from failure (`Err`) without exceptions.
- **`Task` / `TaskStatus`** &mdash; Handles returned by `task.create` and their scheduler state (`Ready`, `Running`, `Completed`, etc.).
- **`Table`** &mdash; Dynamic key/value container that surfaces `unknown` values until narrowed or cast.
- **`unknown`** &mdash; Type used for dynamic data that must be narrowed via `is` or `:as<T>()` before use.
- **`ref` field** &mdash; Weak reference slots on structs that prevent ownership cycles while still linking related data.
- **`impl` block** &mdash; Method definitions attached to existing structs, enums, or traits.
- **`trait` / trait bound** &mdash; Interface-style contracts that types implement and generics require (`T: Drawable`).
- **`use` import** &mdash; Module and symbol importer supporting aliases, grouped paths, and deep lookups.

## Further Reading

- [Language Tour](./language-tour/overview.md) for conceptual grounding.
- [Embedding](./embedding.md) for Rust and C integration notes.
- [Roadmap](./roadmap.md) to follow upcoming features.

Feedback is welcome at `hello@lust-lang.dev`. Help shape the book by filing issues or contributing examples once the docs repository opens for collaboration.
