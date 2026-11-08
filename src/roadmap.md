# Roadmap

This roadmap outlines recent milestones achieved in Lust as well as active and future development initiatives.

---

## Recently Completed Milestones

- [x] **Language Contract v2.0 & Full Lua 5.4 Operator Parity** &mdash; Complete mathematical and bitwise operator coverage (`//`, `^`, `&`, `|`, `~`, `<<`, `>>`, `^^`), right-associative exponentiation (`-2 ^ 2 == -4`), shift normalization, and 12 compound assignments (`+=` through `>>=`) with single evaluation guarantees.
- [x] **Mid-Level IR (MIR) & Verification Pipeline** &mdash; SSA/CFG representation with single-terminator verification (`MirVerifier`), constant folding, and multi-backend lowering (`vm_backend`, `cranelift_backend`, `zig_backend`).
- [x] **Cranelift JIT Backend** &mdash; Native machine code generation via Cranelift JIT 0.137 through the MIR pipeline with multi-function module compilation.
- [x] **Zig 0.17.1 Ahead-Of-Time (AOT) Backend** &mdash; Direct compilation to native executables, shared libraries (`--cdylib`), static libraries (`--staticlib`), and portable C-ABI headers (`--emit-h`).
- [x] **Zero-Cost `table.*` Standard Library Facade** &mdash; High-performance unboxed `Array<T>` and `Map<K, V>` collections exposed via `table.*` and `Table<T>` / `Table<K, V>` generic type aliases.
- [x] **Resource Governance & Bounded Allocator** &mdash; `--max-memory <size>` memory ceilings, gas limiting in loops, and zero-overhead non-GC execution (`--no-gc`, `LUST_NO_GC`).
- [x] **Unified CLI Architecture** &mdash; `lust run --backend [vm|cranelift|zig|auto]` and `lust build --backend zig` for end-to-end multi-target development.
- [x] **Safe Array Indexing Model** &mdash; Non-trapping array bracket access returning `Result<T, IndexError>` with `.index` and `.length` fields.
- [x] **I/O & Operating System Modules** &mdash; Safe, opt-in `io` and `os` standard library modules for file manipulation and system interaction.
- [x] **Modular Configuration** &mdash; Granular sandboxing through `lust-config.toml`, allowing environments to toggle standard modules, JIT execution, and low-memory modes.
- [x] **Cooperative Task Runtime** &mdash; Complete coroutine orchestration with `task.create`, `task.run`, `task.resume`, `task.yield`, and `TaskInfo` structured diagnostics.
- [x] **Generics & Nominal Traits** &mdash; Compile-time erased generics, `trait` declarations, `impl Trait for Type`, trait bounds (`<T: Trait>`), dynamic trait objects, and automatic `ToString` concatenation.
- [x] **Native Rust Extensions & Lua 5.1 C ABI** &mdash; Dynamic extension loading via `cdylib` crates and automated extern stub generation (`lust --dump-externs`).
- [x] **Package Tooling** &mdash; CLI package manager with `lust pkg add`, `remove`, `sync`, `login`, and `publish`.

---

## Active & Upcoming Initiatives

- [ ] **Trace JIT Optimizations**
  - Continuous refinement of loop trace compilation and side-trace linking.
  - Development of additional architecture backends (including RV32 JIT codegen).
  - Specialization for monomorphic loop operations.

- [ ] **Multi-VM Multithreading**
  - Implement safe concurrent execution via multi-VM spawning with worker thread isolation.
  - Coordinated channel-based result collection on the main host thread without shared-memory data races.

- [ ] **LSP & Tooling Expansion**
  - Expand `lust-analyzer` with signature help, workspace symbol searches, rename refactoring, and quick-fix diagnostics.
  - Improve tree-sitter highlighting queries for complex generic expressions.

- [ ] **Advanced Trait Features**
  - Explore support for generic traits and default method implementations.
  - Richer trait dispatch mechanisms.

- [ ] **Licensing Evolution**
  - Transition core language runtime from PolyForm Noncommercial 1.0.0 to an open-source permissive license (MIT / Apache 2.0).
