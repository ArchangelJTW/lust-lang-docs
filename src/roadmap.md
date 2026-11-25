# Roadmap

This roadmap summarizes the milestones shipped across Waves 0–18 as well as active and future development initiatives.

---

## Completed Milestones (Waves 0–18)

- [x] **Language Contract v2.0 & Full Lua 5.4 Operator Parity** &mdash; Complete mathematical and bitwise operator coverage (`//`, `^`, `&`, `|`, `~`, `<<`, `>>`, `^^`), right-associative exponentiation (`-2 ^ 2 == -4`), shift normalization, and 12 compound assignments (`+=` through `>>=`) with single-evaluation guarantees.
- [x] **Mid-Level IR (MIR), SROA & Optimization Pipeline** &mdash; SSA/CFG verification (`MirVerifier`), scalar replacement of aggregates (SROA), loop-body SROA, LICM, small-loop inlining, Q=64 loop strip-mining, 32-bit `PackedInstruction` ISA, and 4-slot VM polymorphic inline caches.
- [x] **Cranelift JIT Backend & Dynasm Retirement** &mdash; Native machine code generation via Cranelift JIT 0.137 with production OSR, lazy deoptimization (`resume_from_deopt` including empty-stack entry validation), and complete retirement of the legacy Dynasm backend.
- [x] **Cranelift Object AOT (`--backend cranelift-aot`)** &mdash; Opt-in (`--features cranelift-aot`) native `.o`/`.obj` emission and automatic `cc -llust` executable linking across 64-bit targets (`aarch64`, `x86_64`, `riscv64`, `s390x`) with SROA and post-SROA optimization.
- [x] **Rust AOT & `#![no_std]` `lust-aot-rt` (`--backend rust`)** &mdash; Zero-dependency `#![no_std] + alloc` runtime crate (`lust-aot-rt`), CFG structurer, `#[repr(C)]` zero-DOM `decode_binary`/`decode_json`, Zero-FFI Cargo interop (`--emit=rust-crate`, `--link-crate`), ThinLTO (`--lto=thin`), and PGO (`--pgo-generate`, `--pgo-use`, `--pgo-sample-use`).
- [x] **Algebraic Effect Handlers (VM & Rust AOT CPS)** &mdash; Nominal services, `handle { ... } with { ... }`, tail-resumptive handlers, and one-shot non-tail continuations (`resume(val)`) lowered to a CPS state machine in Rust AOT (supporting loops and helper callees) alongside `AotScope` LIFO cleanup.
- [x] **Borrowed Views, Static Lifetimes & Generation Safety (`lust::w17_lifetime`)** &mdash; Script-level `&T`/`&mut T` references and `view.{borrow, borrow_mut, read, materialize}`, compile-time diagnostics (`E4G001`–`E4G006`), runtime generation-checked handles (`LifetimeVm`, `GenStructHandle`, `PreparedScalarHandle`), and `!Send`-safe cross-thread `OwnedTransferPayload`.
- [x] **C11 Layout Parity & Semantic FFI Boundaries (`lust::w17_layout`)** &mdash; `LogicalLayoutV1`, `ContiguousStruct`, `Gate-SCHEMA-09`/`Gate-SCHEMA-13` verification, `ModelContract`, and watchdog-contained FFI boundary execution.
- [x] **WASI Preview 1 & Preview 2 Execution (`lust-wasi-runner`)** &mdash; `wasm32-wasip1` and `wasm32-wasip2` targets compiled via Rust AOT (`lust-aot-rt`) and verified under embedded Wasmtime with `--fuel`, `--timeout-ms`, `--env`, `--dir-ro`, and `--deny-stdio`.
- [x] **Multi-Tenant OS Sandbox (`lust::sandbox`)** &mdash; Darwin POSIX baseline plus Linux `S-SANDBOX` (`cgroups v2` `memory.max`/`cpu.max`/`pids.max`/`cgroup.kill` against `setsid()`, `seccomp-bpf`, and `CLONE_NEWNET` with `fork()` probe).
- [x] **Tier-3 Embedded `#![no_std]` DST & Live Bare-Metal QEMU Verification** &mdash; `src/no_std/trace.rs` (`DeterministicScheduler`, `CanonicalTraceCodec`, `replay_verify`), `StaticSlabAllocator`, `LustBudgetAlloc`, and `OutOfGas` enforcement verified live on ARM Cortex-M4 (`thumbv7em-none-eabihf` via `qemu-system-arm`) and RISC-V 32 (`riscv32imafc-unknown-none-elf` via `qemu-system-riscv32`).
- [x] **Ecosystem Bindings, Telemetry & Service Adapters** &mdash; Node.js bindings (`lust-napi` C Node-API v8 and `lust-napi-rs` `napi` v2), telemetry exporters (`lust-telemetry-{metrics,otel,prometheus,tracing}` with opt-in `--features upstream`), and built-in `hyper`/`rusqlite` plus opt-in `svc-reqwest`/`svc-sqlx` adapters.
- [x] **Zig AOT & C-ABI Libraries** &mdash; Direct compilation to native executables, shared libraries (`--cdylib`), static libraries (`--staticlib`), and portable C-ABI headers (`--emit-h`).
- [x] **Permissive Open-Source Licensing** &mdash; Dual-licensed under **MIT OR Apache-2.0**.

---

## Active & Upcoming Initiatives

- [ ] **LSP & Editor Tooling Expansion**
  - Expand `lust-analyzer` with signature help, workspace symbol searches, rename refactoring, and quick-fix diagnostics.
  - Extend `tree-sitter-lust` highlighting queries for borrowed views (`&T`/`&mut T`) and algebraic effect handlers.

- [ ] **Multi-VM Worker Pool Ergonomics**
  - High-level Rust orchestrators built over `OwnedTransferPayload` and `TransferTaskHandle` for ergonomics on multi-core workloads while preserving `!Send` VM isolation.

- [ ] **Advanced Trait & Generic Features**
  - Explore generic traits, associated types, and default trait method implementations.

- [ ] **Continuous Compiler & AOT Optimizations**
  - Broader PGO/ThinLTO heuristics across `lust build --backend rust` and extended cross-architecture CI coverage for `--backend cranelift-aot`.
