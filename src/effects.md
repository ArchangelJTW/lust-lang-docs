# Pure Core & Effects Architecture in Lust

> [!NOTE] Design Specification / RFC
> Данная глава описывает архитектурную спецификацию и дизайн системы алгебраических эффектов Lust.

Lust features a state-of-the-art **Pure Core & Typed Algebraic Effects** system. It provides static tracking of side effects, zero-allocation dependency injection, capability-based security boundaries, and predictable resource finalization across both the Bytecode VM and the high-performance Cranelift JIT / Zig AOT engines.

---

## 1. Architectural Philosophy: Pure Core & Algebraic Effects

Modern software architectures frequently face critical maintenance and security challenges:
- **Hidden Side Effects:** Pure business logic functions perform hidden database mutations, disk reads, or network telemetry.
- **Ambient Authority:** Any imported script or third-party package can silently access files, sockets, or environment variables.
- **Leaked Resources & Cancellation Bugs:** When an async operation aborts (due to timeout or gas limits), open file descriptors and sockets are leaked.
- **Runtime DI Overhead:** Dependency injection frameworks introduce dynamic reflection, heap allocations, and virtual call dispatch penalties.

Lust resolves these challenges through three core design pillars:

```mermaid
flowchart TB
    subgraph PureCore["1. Pure Core & Explicit Capabilities"]
        Intrinsics["Language Intrinsics (+, //, .., [])"]
        StdCaps["std.* Capabilities (io, fs, os, net)"]
        CapMask["CapabilityMask (allow_io=false)"]
        DCE["Transitive DCE (Zero Dead Code)"]
    end

    subgraph EffectsModel["2. First-Class Algebraic Effects"]
        FuncSig["Signatures: T ! Error ~ Requirements"]
        EagerCall["Eager Call: f(x)? in current context"]
        LazyThunk["Lazy Blueprint: effect do ... end"]
        StackProj["StackContextProjection (0-heap alloc)"]
    end

    subgraph SafetyModel["3. Fail-Closed Resource Model"]
        HostLedger["Host Resource Ledger (0 gas/alloc)"]
        Scopes["scoped do ... end Blocks"]
        Defers["defer & errdefer LIFO cleanup"]
        StickyInterrupt["Sticky Cause::Interrupted (OutOfGas)"]
    end

    PureCore --> EffectsModel
    EffectsModel --> SafetyModel
```

### 1.1 Pure Core vs. Ambient Authority

In Lust, a sandboxed or library module runs by default in **`PreludeMode::Pure`**:
- **Language Intrinsics:** String concatenation (`..`), indexing (`arr[i]`), slice access, and math operations (`+`, `-`, `//`, `^`) are built-in language primitives. They utilize the current context's memory arena and require no external library permissions.
- **Zero Ambient Authority:** There are no implicit globals for disk, network, or terminal I/O. Accessing external resources requires an explicit import (`use std.io;`, `use std.os;`) and must be declared in the function's effect signature.
- **Transitive Dead-Code Elimination (DCE):** Unused capabilities and runtime helpers are eliminated during compilation. If a pure script uses only string and math operations, the compiler generates no symbols for `libc`, POSIX sockets, or file systems.

### 1.2 Eager Execution vs. Lazy Blueprints

Lust clearly separates immediate effect execution from lazy program descriptions:

1. **Eager Effect Calls (`f(x)?`):**
   Calling an effectful function executes immediately in the caller's context with zero wrapper overhead. The `?` operator unrolls success values or propagates errors directly.
2. **Lazy Blueprints (`effect do ... end`):**
   An `effect do ... end` block freezes execution into a first-class `Effect<A, E, R>` blueprint. Constructing a blueprint performs **zero side effects**.
3. **Replayability Contract:**
   Running a blueprint multiple times (e.g. via `blueprint:run_sync()`) executes the body afresh on each invocation, ensuring clean, isolated state per run.

---

## 2. Effect Declarations & Signatures

In Lust, effect declarations and function signatures make errors and required services visible to the typechecker.

### 2.1 Function Effect Signatures

A function's return specification (`ReturnSpec`) can specify:
- Return type (`T`)
- Typed error branch preceded by `!` (`! ErrorType`)
- Contextual service requirements preceded by `~` (`~ RequirementRow`)

```lust
-- Declares a function returning string, potentially failing with HttpError,
-- and requiring both 'Network' and 'Console' capabilities.
function fetch_data(url: string): string ! HttpError ~ (Network + Console)
    local console = service<Console>()
    console.log("Fetching: " .. url)

    local net = service<Network>()
    return net.get(url)?
end
```

If a function does not fail, the `! Error` clause is omitted. If it requires no ambient capabilities, the `~ Requirements` clause is omitted.

### 2.2 Nominal Service Declarations

Services are declared nominally to guarantee distinction, even when their underlying methods or structures are identical:

```lust
struct Database
    url: string
end

-- Nominal services: PrimaryDb and ReplicaDb are distinct types
service PrimaryDb: Database
service ReplicaDb: Database

-- The requirement PrimaryDb + ReplicaDb maintains two distinct slots!
function sync_tables(): bool ! DbError ~ (PrimaryDb + ReplicaDb)
    local master = service<PrimaryDb>()
    local replica = service<ReplicaDb>()
    -- synchronize master and replica
    return true
end
```

### 2.3 Row Polymorphism & Set Equality

Service requirement rows exhibit **unordered set equality** (Row Polymorphism):

$$\text{Effect}\langle T, E, A + B \rangle \equiv \text{Effect}\langle T, E, B + A \rangle$$

The typechecker normalizes and deduplicates requirement rows. When functions call one another in a recursive group (SCC &mdash; Strongly Connected Component), the compiler computes the fixed-point union of all transitive requirements:

$$R(v) = R_{\text{local}}(v) \cup \bigcup_{(v, u) \in \text{Edges}} R(u)$$

If a caller fails to declare a capability required by any transitive callee, the compiler reports a compile-time error:
```text
CompileError: Unsatisfied requirement: 'FileSystem' in call to 'read_config'
```

---

## 3. Handlers and Context Provision

Requirements declared in `~ (Req1 + Req2)` represent unsatisfied effect dependencies. Before an effect blueprint is executed, those requirements must be handled or provided.

### 3.1 Handling Effects (`handle ... with ...`)

Lust provides effect handlers to supply concrete implementations or intercept operations:

```lust
-- Define individual effect operations
effect ReadFile(path: string): string ! IoError
effect WriteFile(path: string, content: string): bool ! IoError

-- Function requiring ReadFile capability
function load_user_profile(user_id: string): string ! IoError ~ ReadFile
    return ReadFile("/etc/users/" .. user_id .. ".json")?
end

-- Providing a handler for ReadFile
function run_with_mock(): string ! IoError
    return handle load_user_profile("alice") with
        case ReadFile(path) => '{"name": "Alice", "role": "admin"}'
    end
end
```

### 3.2 Zero-Heap Context Projection (`StackContextProjection`)

When function `f` (with requirements `Env_ABC = A + B + C`) calls function `g` (requiring only `Env_AC = A + C`), naive systems allocate a hash map or heap-based dictionary adapter.

In Lust, this is solved with **`StackContextProjection<N>`**:
1. The caller allocates a tiny projection descriptor directly on its **native call stack frame** (copying two 64-bit service pointers).
2. The callee receives a pointer to the stack-allocated adapter.
3. Upon return, the stack pointer (`SP`) is restored.
4. **Result:** Exactly **0 heap allocations** and sub-nanosecond adapter overhead (~0.34 ns in release builds).

```rust
// Rust Runtime Type in src/effect_abi.rs
#[repr(C)]
pub struct StackContextProjection<const N: usize> {
    pub service_ptrs: [*const core::ffi::c_void; N],
    pub service_tags: [u32; N],
}
```

---

## 4. Security & Capability-Based Authority Model

Lust's effect model provides unbreakable sandboxing for untrusted scripts.

### 4.1 Host `CapabilityMask`

When embedding Lust in a host application (Rust or C), the host configures a `CapabilityMask`:

```rust
use lust::config::{CapabilityMask, LustConfig};
use lust::EmbeddedProgram;

let mut config = LustConfig::default();

// Deny all ambient capabilities by default
config.set_capability_mask(CapabilityMask::none());

// Explicitly opt-in to specific modules
config.allow_std_module("json");
config.allow_std_module("regex");
// config.allow_std_module("io"); // IO remains disallowed!
```

| Capability | Flag | Controls |
| :--- | :--- | :--- |
| **I/O** | `allow_io` | Console printing, terminal interaction |
| **File System** | `allow_fs` | File and directory read/write |
| **OS / Clock** | `allow_os` | System clocks, environment variables, process control |
| **Networking**| `allow_net` | Sockets, HTTP, DNS resolution |
| **Concurrency**| `allow_task` | Spawning background tasks and worker threads |

### 4.2 Compile-Time Opt-In Denial

If a script attempts to import a module forbidden by the host's capability mask (`import io from "@std/io";` or `use std.io;`), the compilation fails immediately:

```text
LustError::CompileError: Access denied: module 'std.io' is not permitted by host capability mask
```

This denial occurs at **compile time**, before any bytecode or native machine code is generated or executed.

### 4.3 Compilation Cache Key Isolation

To prevent capability leaks through bytecode caching, the compilation cache key (`CompilationCacheKey`) incorporates:
- Module source hash
- `prelude_mode` (`Pure` vs `Standard`)
- Full `capability_mask` bitflags
- Standard library catalog version

A module compiled in permissive mode can **never** be served to a sandboxed caller.

---

## 5. Performance: Inlining & Native Parity

Lust eliminates the traditional performance penalties of effect systems through specialized MIR and bytecode lowering optimizations.

### 5.1 Inlining of Effect Thunks (`run_sync`)

When an effect block is constructed and executed synchronously:

```lust
local program = effect do
    return 10 * 4 + 2
end
local result = program:run_sync()
```

The Lust compiler performs compile-time thunk devirtualization and inlining:
1. **In Bytecode:** The bytecode compiler emits the body instructions inline, directing return statements to a dedicated continuation register.
2. **In MIR & Cranelift:** The MIR lowering pipeline (`lower_effect_run_sync`) replaces the thunk reference with an inlined control-flow block, targeting a `continuation_bb`.
3. **Zero Function Calls:** In the generated machine code, `run_sync` dissolves into direct arithmetic instructions.

### 5.2 Read-Only Snapshot Integer Captures

Effect blocks can capture variables from their outer scope. To avoid closure heap allocations and pointer indirection, Lust enforces **Snapshot Integer Captures**:
- Free integer variables used inside `effect do ... end` are captured by **copying a snapshot** to a local temporary (`__thunk_cap_<name>_<var>`).
- If an effect attempts to capture mutable or escaping pointers, the compiler rejects it with:
  `Unsupported capture type: only read-only integers are supported`.
- As a result, constructing an effect block requires **0 heap allocations** and operates purely on registers and the stack.

### 5.3 Parity Across VM, Cranelift JIT, and Zig AOT

Lust guarantees 100% semantic and performance parity across all execution targets:

| Runtime Profile | Effect Call Overhead | Memory Allocation | Interruption Propagation |
| :--- | :--- | :--- | :--- |
| **Bytecode VM** | ~6.7 ns / call | 0 bytes heap | Deterministic instruction counter |
| **Cranelift JIT** | **0.37 ns / call** | 0 bytes heap | Hardware safepoint polling |
| **Zig AOT** | **0.34 ns / call** | 0 bytes heap | Direct C-ABI register pass |

---

## 6. Common Patterns & Best Practices

### 6.1 Structured Resource Cleanup (`scoped`, `defer`, `errdefer`)

Lust combines effect scopes with deterministic RAII-style cleanup:

```lust
function process_transaction(db_url: string, payload: string): bool ! DbError ~ (Database + Logger)
    scoped do
        local conn = open_connection(db_url)?
        defer close_connection(conn)                -- Always executes on scope exit
        errdefer log_error("Transaction failed!")   -- Executes ONLY on error or interrupt

        local tx = conn.begin_tx()?
        defer tx.rollback_if_active()

        tx.write(payload)?
        tx.commit()?
        return true
    end
end
```

- `scoped do ... end`: Defines an explicit lifecycle boundary. All resources are cleaned up before the block returns.
- `defer`: Guaranteed **LIFO** (Last-In, First-Out) execution.
- `errdefer`: Dormant during normal completion; activated automatically if an error or terminal interrupt occurs.

### 6.2 Fail-Closed Interruption Algebra

Every effect terminates in an `Exit<A, E>`:

```rust
pub enum Exit<A, E = String> {
    Success(A),
    Failure(Cause<E>),
}

pub enum Cause<E> {
    Fail(E),                        // Recoverable, typed application error
    Die(String),                    // Unchecked defect / panic
    Interrupted(InterruptReason),   // Sticky terminal interruption (Cancelled, OutOfGas, Timeout)
}
```

#### Sticky Interruption Invariant
Unlike typed errors (`Cause::Fail`), terminal interrupts (`Cause::Interrupted`) **cannot** be swallowed, caught with `.catch()`, or suppressed by `retry`. They propagate directly to the root supervisor, ensuring that timeouts, gas depletion, and fiber cancellations terminate execution reliably.

### 6.3 Mocking Capabilities in Tests (`@std/test`)

The standard testing framework (`@std/test`) allows seamless mocking of service capabilities:

```lust
use @std/test.{suite, test, assert_eq, assert_success}

struct MockDb
    items: Array<string>
end

service Database: MockDb

suite("User Repository Tests", function()
    test("loads user from mocked store", function()
        local mock = MockDb { items = ["User1", "User2"] }
        
        -- Run effect with mock database
        local result = handle load_user(0) with Database = mock
        assert_success(result, "User1")
    end)
end)
```
