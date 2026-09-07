# Roadmap

This roadmap outlines recent milestones achieved in Lust as well as active and future development initiatives.

---

## Recently Completed Milestones

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
