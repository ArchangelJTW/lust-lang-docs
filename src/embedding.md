# Embedding Lust

Lust was built from the ground up for embedding. Whether you are embedding scripts inside a game engine, scripting an HTTP server, or extending a CLI tool, Lust provides high-level typed bindings for Rust and a C ABI.

The Rust embedding surface lives in the `lust::embed` module (re-exported from the crate root) and is centered on two types:

- `EmbeddedBuilder` — assembles modules, declarations, configuration, and extern registries.
- `EmbeddedProgram` — the compiled artifact; calls functions, reads and writes globals, drives async tasks, and reports JIT and resource statistics.

---

## 1. Rust Integration (`lust-rs`)

Add the crate to your project's `Cargo.toml`:

```bash
cargo add lust-rs --rename lust
```

The `embed` module is available under the default `std` feature. Features that matter for embedders:

| Feature | Default | Purpose |
| --- | --- | --- |
| `std` | yes | Required for the embedding API, JIT, and the typed conversion layer. |
| `packages` | yes | Pulls in `libloading`/`dirs`/`object`/`serde_json` for extension crates, Lua 5.1 libraries, and package resolution. |
| `libloading` | no | Dynamic loading of native extensions (implied by `packages`). |
| `dirs` | no | Platform package-cache directories (implied by `packages`). |


### Basic Example: Compiling and Calling Scripts

Use `EmbeddedProgram::builder()` to assemble and compile modules in memory:

```rust
use lust::EmbeddedProgram;

fn main() -> lust::Result<()> {
    let script = r#"
        function greet(name: string): string
            return "Hello, " .. name .. "!"
        end
    "#;

    let mut program = EmbeddedProgram::builder()
        .module("main", script)
        .entry_module("main")
        .compile()?;

    // Execute top-level statements to initialize globals.
    // Required before reading globals declared in the module.
    program.run_entry_script()?;

    // Call a typed Lust function directly from Rust
    let message: String = program.call_typed("main.greet", "Rust Host")?;
    println!("{message}");

    Ok(())
}
```

### The Builder Surface

| Method | Purpose |
| --- | --- |
| `new()` / `builder()` | Create a builder. |
| `module(path, source)` / `add_module(path, source)` | Add an in-memory module (dotted path → `base_dir/seg.lust`). |
| `set_base_dir(dir)` / `with_base_dir(dir)` | Directory used to resolve relative module imports. Defaults to `"__embedded__"`. |
| `entry_module(path)` / `set_entry_module(path)` | Select the module whose top level runs first. |
| `enable_stdlib_module(name)` / `add_stdlib_module(name)` | Opt in to a gated stdlib module. `print`/`println`, `type`, `string`, `array`, `map`, `math`, and `task` are always registered; only `io` and `os` are gated behind this setting. |
| `declare_struct(def)` / `declare_enum(def)` / `declare_trait(def)` / `declare_impl(block)` / `declare_function(def)` | Inject AST declarations without writing Lust source. |
| `with_extern_registry(reg)` / `extern_registry_mut()` | Attach an `ExternRegistry` describing native types and functions. |
| `with_config(cfg)` / `set_config(cfg)` | Supply a full `LustConfig`. |
| `low_memory_mode()` | Drops retained expression/variable type info; useful on constrained targets such as ESP32. |
| `minimal_runtime_types()` | Strips register type information from `Function` objects. |
| `compile()` | Consume the builder and produce an `EmbeddedProgram`. |

### Calling Functions and Reading Globals

```rust
// Typed call: arguments and return value are converted through `FunctionArgs` / `FromLustValue`.
let total: i64 = program.call_typed("main.summarize", (1_i64, 2_i64, 3_i64))?;

// Untyped call when you already have `Value`s.
let raw: lust::Value = program.call_raw("main.summarize", vec![lust::Value::Int(1)])?;

// Globals are addressed as "module.name" (normalized internally to "module::name").
let scale = program.get_typed_global::<i64>("main.SCALE_FACTOR")?.unwrap_or(0);
program.set_global_value("main.SCALE_FACTOR", 5_i64);

for (name, _value) in program.globals() {
    println!("global: {name}");
}
```

Typed calls are validated against the recorded signature before the VM runs. Introspection helpers let a host discover what a script exposes: `global_names()`, `globals()`, `signature(name)`, `typed_functions()`, `struct_definition(name)`, and `enum_definition(name)`.

### Registering Host Functions

Four registration levels are available, from raw to fully typed:

```rust
// 1. Raw: you inspect and build `Value`s yourself.
use lust::bytecode::{NativeCallResult, Value};

program.register_native_fn("host_raw", |values: &[Value]| {
    Ok(NativeCallResult::Return(Value::Int(1)))
});

// 2. Typed: the argument tuple and result are converted for you.
program.register_typed_native("host_scale", |value: i64| -> Result<i64, String> {
    Ok(value * 10)
})?;

// 3. Raw future: suspends the calling task until the future resolves.
program.register_async_native("fetch_raw", |args: Vec<Value>| async move {
    Ok::<_, String>(args[0].clone())
})?;

// 4. Typed future: same, with converted arguments and result.
program.register_async_typed_native("fetch_string", |id: i64| async move {
    Ok::<_, String>(format!("id-{id}"))
})?;
```

A native handler returns a `NativeCallResult`: `Return(value)` to hand a value back, or `Yield(value)` / `Stop(value)` to suspend or stop the calling task (the native equivalents of the script-side `task.yield()` / `task.stop()`, and rejected outside of a task).

Typed registration resolves through the typechecker's recorded signatures, so the function must be declared in the module — usually an `extern` block:

```lust
extern
    function host_scale(int): int
end
```

`register_typed_native` verifies the arguments against the Lust signature and checks the return type, so registering `"host_scale"` against the declaration above succeeds. `register_typed_native` already records export metadata, so no manual `record_exported_native` call is needed for it. Use `NativeExport`/`NativeExportParam` manually when registering through `VM` directly, then dump stubs:

```rust
use lust::{NativeExport, NativeExportParam};

program.vm_mut().record_exported_native(NativeExport::new(
    "main.host_scale",
    vec![NativeExportParam::new("value", "int")],
    "int",
));

// Writes Lust-readable extern stubs, returning the files created.
// Returns `io::Result`, which does not auto-convert to `lust::Result`.
let written = match program.dump_externs_to_dir("externs") {
    Ok(files) => files,
    Err(err) => {
        eprintln!("dump externs failed: {err}");
        return Ok(());
    }
};
println!("wrote {} stub file(s)", written.len());
```

### Interacting with Structs & Fields

Instantiate and inspect Lust structs safely from Rust. Given:

```lust
struct Point
    x: int,
    y: int,
    name: string
end
```

you can build and mutate instances:

```rust
use lust::{struct_field, StructInstance};

let point: StructInstance = program.struct_instance(
    "main.Point",
    [
        struct_field("x", 10_i64),
        struct_field("y", 20_i64),
        struct_field("name", "Rust Point"),
    ],
)?;

let x: i64 = point.field::<i64>("x")?;              // copies the value out
let name = point.borrow_field("name")?;             // zero-copy `ValueRef`
println!("{}", name.as_string().unwrap_or("<unnamed>"));

point.set_field("x", 42_i64)?;
point.update_field("y", |value| match value {
    lust::Value::Int(current) => Ok(current + 5),
    other => Err(lust::LustError::RuntimeError {
        message: format!("expected int but saw {other:?}"),
    }),
})?;
```

Type mismatches produce `LustError::TypeError` with messages like `"Struct field 'x' expects 'int' but received value of type 'Float'"`, rather than silent coercion.

### Enums

```rust
let pending = program.enum_variant("main.Status", "Pending")?;
let complete = program.enum_variant_with("main.Status", "Complete", vec![4_i64])?;

// Round-trip them through Lust.
let described: String = program.call_typed("main.describe", complete)?;
```

On the receiving side, `EnumInstance` exposes `type_name()`, `variant()`, `payload_len()`, and `payload::<T>(index)`.

### Arrays, Maps, and Function Handles

`ArrayHandle` and `MapHandle` are reference types: mutations through the handle are visible to the script because they mutate the same underlying object.

```rust
use lust::{ArrayHandle, MapHandle, FunctionHandle, Value};

if let Some(array) = program.get_typed_global::<ArrayHandle>("main.arr_global")? {
    array.push(Value::Int(4));
    let snapshot = array.with_ref(|values| values.iter().map(|v| v.as_int()).collect::<Vec<_>>());
    println!("array = {snapshot:?}");
}

if let Some(map) = program.get_typed_global::<MapHandle>("main.map_global")? {
    map.insert("three", Value::Int(3));
    let has = map.contains_key("three");
    println!("has 'three': {has}");
}

// Resolve a function once, then call it repeatedly.
let translate: FunctionHandle = program.function_handle("main.translate")?;
let moved: StructInstance = translate.call_typed(&mut program, (point, 2_i64, 5_i64))?;
```

`FunctionHandle` exposes `signature()`, `matches_signature(...)`, `call_raw(&mut program, Vec<Value>)`, and `call_typed(&mut program, args)`. `ValueRef` (from `borrow_field`) offers `as_bool`, `as_int`, `as_float`, `as_string`, `as_rc_string`, `as_array_handle`, `as_map_handle`, and `as_struct_handle`.

### Zero-Copy Struct Views with `LustStructView`

Lust provides a derive macro `LustStructView` for zero-overhead, type-safe views into Lust structs. The struct must have named fields and a type-name attribute:

```rust
use lust::{LustStructView, StringRef, StructHandle};

#[derive(LustStructView)]
#[lust(type = "main.Point")] // `#[lust(struct = "main.Point")]` is equivalent
struct PointView<'a> {
    #[lust(field = "x")]
    x: lust::LustInt,
    #[lust(field = "y")]
    y: lust::LustInt,
    #[lust(field = "name")]
    name: StringRef<'a>,
}

if let Some(handle) = program.get_typed_global::<StructHandle>("main.lust_point")? {
    let view = PointView::from_handle(&handle)?;
    println!("Point: x={}, y={}, name={}", view.x, view.y, view.name.as_str());
}
```

The macro calls `handle.ensure_type(Self::TYPE_NAME)` before reading fields, so a handle pointing at the wrong type is rejected rather than misread. Supported attribute keys are `struct`/`type`, `crate`, and `lifetime` on the struct, and `field`/`name` on fields.

`LustInt` and `LustFloat` are the Rust-side numeric aliases (`i64`/`f64` on default builds, `i32`/`f32` in the reduced-integer configuration), so field and argument types should be written in terms of them when a view must stay portable.

### Async Natives and Task Queues

Scripts can call natives that complete later. Three registration shapes exist, plus the queue-backed shape shown below:

```rust
// 1. Raw future: suspends the calling task until the future resolves.
program.register_async_native("fetch_raw", |args: Vec<Value>| async move {
    Ok::<_, String>(args[0].clone())
})?;

// 2. Typed future: same, with converted arguments and result.
program.register_async_typed_native("fetch_value", |id: i64| async move {
    Ok::<_, String>(id * 2)
})?;

// 3. A native that creates and returns a `Task` value backed by a future.
//    Does not suspend the calling task; the host drives it via `AsyncDriver`.
program.register_async_task_native("fetch_value", |id: i64| async move {
    Ok::<_, String>(id * 2)
})?;
```

The suspend-style variants (1 and 2) run inside the calling task, so they require one — they fail with `"Async native functions require a running task"` otherwise — and each task can have at most one pending suspend (`"Task <id> already has a pending async native call"`). Variant 3 and queue-backed natives instead return a `Task` value immediately and never touch the calling task.

For hosts that own their own runtime (a game loop, an HTTP worker pool), use a **task queue**. The host pops jobs, performs the work, then completes them:

```rust
use lust::{AsyncDriver, AsyncTaskQueue, FunctionHandle};

let queue = AsyncTaskQueue::<FunctionHandle, lust::LustInt>::new();
program.register_async_task_queue::<FunctionHandle, lust::LustInt>("fetch_value", queue.clone())?;

// A script call enqueues a pending job.
let task = program.call_raw("main.get_async_value", Vec::new())?;
let pending = queue.pop().expect("fetch_value enqueued a job"); // or queue.pop_blocking()

let callback = pending.args().clone();
callback.call_typed::<_, ()>(&mut program, 77_i64)?;

pending.complete_ok(77_i64);          // or pending.complete_err("boom")
AsyncDriver::new(&mut program).pump_until_idle()?; // resume the waiting task
```

`AsyncDriver` wraps a `&mut EmbeddedProgram` and exposes `poll()`, `pump_until_idle()`, and `has_pending()`. `EmbeddedProgram` also offers `poll_async_tasks()` and `has_pending_async_tasks()` if you prefer to drive polling inline. Polling validates the resolved value against the declared Lust return type, failing with `"Async native must return <T>, got <V>"`.

Task state is observable from both Rust and Lust via `vm.get_task_instance(handle)` (state, `last_result`, `error`).

### Resource Budgets

Long-running embedded scripts can be bounded. Gas counts interpreter work; the memory budget caps VM allocations.

```rust
program.set_gas_budget(1_000_000);
let used = program.gas_used();
let left = program.gas_remaining();          // Option<u64>

program.set_memory_budget_kb(64 * 1024);     // or set_memory_budget_bytes(n)
let bytes = program.memory_used_bytes();
let free = program.memory_remaining_bytes(); // Option<usize>

program.reset_gas_counter();
program.reset_memory_counter();
program.clear_gas_budget();
program.clear_memory_budget();
```

### Inspecting JIT Performance from Host

Embedders can query tracing JIT counters at runtime:

```rust
let stats = program.jit_stats();
println!("Root traces compiled: {}", stats.root_traces_compiled);
println!("Native entries:       {}", stats.native_trace_entries);
println!("Recursive calls:      {}", stats.recursive_calls);
```

`VM::jit_stats()` exposes the same `JitStats`. Loading a replacement function table invalidates traces, profiles, retries, and counters.

### WebAssembly

On `wasm32` the crate exposes a minimal `wasm-bindgen` surface instead of the full host API: `lust::wasm::run_lust(source: &str) -> Result<String, JsValue>`. It compiles an in-memory `main` module, executes its top level, and returns everything the script printed (`print`/`println` are redirected into the returned string and mirrored to `console.log`). There is no per-function call surface, native registration, or async support in this mode; wrap `EmbeddedProgram` yourself if you need more.

---

## 2. Embedding in C (FFI)

Lust exports a C ABI declared in `include/lust_ffi.h`. Build the shared library, then compile and link your C program:

```bash
cargo build --release --lib
cc main.c -I/path/to/include -L/path/to/target/release -llust -o ffi_example
```

Depending on the platform you may also need an rpath so the loader finds `liblust` at runtime:

- Linux: `-Wl,-rpath,'$ORIGIN/../../target/release'`
- macOS: `-Wl,-rpath,@loader_path/../../target/release`
- Windows (MSVC): link `lust.lib` and keep `lust.dll` beside the executable.

### Complete C Host Example

```c
#include "lust_ffi.h"
#include <stdio.h>
#include <stdlib.h>

static void die_with_last_error(const char *context) {
    fprintf(stderr, "%s failed: %s\n", context, lust_last_error_message());
}

int main(void) {
    const char *source =
        "function add(a: int, b: int): int\n"
        "    return a + b\n"
        "end\n";

    EmbeddedBuilder *builder = lust_builder_new();
    if (!builder) {
        die_with_last_error("lust_builder_new");
        return EXIT_FAILURE;
    }

    // Optional; defaults to "__embedded__".
    lust_builder_set_base_dir(builder, "__ffi_example__");
    lust_builder_add_module(builder, "main", source);
    lust_builder_set_entry_module(builder, "main");

    EmbeddedProgram *program = lust_builder_compile(builder);
    if (!program) {
        die_with_last_error("lust_builder_compile");
        return EXIT_FAILURE;
    }

    LustFfiValue args[2] = {
        {.tag = LUST_FFI_VALUE_INT, .int_value = 20},
        {.tag = LUST_FFI_VALUE_INT, .int_value = 22},
    };

    LustFfiValue result = {0};
    if (!lust_program_call(program, "main.add", args, 2, &result)) {
        die_with_last_error("lust_program_call");
        lust_program_free(program);
        return EXIT_FAILURE;
    }

    printf("20 + 22 = %lld\n", (long long)result.int_value);

    // Expose the result to scripts as a global, then read it back.
    lust_program_set_global(program, "main.answer", &result);

    LustFfiValue stored = {0};
    if (lust_program_get_global(program, "main.answer", &stored)
        && stored.tag == LUST_FFI_VALUE_INT) {
        printf("stored main.answer = %lld\n", (long long)stored.int_value);
    }

    // Dispose every value that owns a string, then free the program.
    lust_value_dispose(&stored);
    lust_value_dispose(&result);
    lust_program_free(program);
    return EXIT_SUCCESS;
}
```

### ABI Notes

- `LustFfiValueTag` values are `LUST_FFI_VALUE_NIL = 0`, `BOOL = 1`, `INT = 2`, `FLOAT = 3`, `STRING = 4`. `LustFfiValue` is a plain tagged struct (not a union): always check `tag` before reading a member, since reading the wrong member yields garbage.
- Only nil, bool, int, float, and string cross the boundary. Passing or returning arrays, maps, structs, or other composite values fails with `"Unsupported Lust value for FFI conversion: ..."`.
- `lust_program_call`, `lust_program_get_global`, and `lust_program_set_global` return `bool`; on failure call `lust_last_error_message()`. The message is owned by the library and stays valid until the next call that sets an error; use `lust_clear_last_error()` to clear it explicitly.
- The header is C++-safe (`extern "C"` guards) and requires `stdbool.h`, `stddef.h`, and `stdint.h`.
- `lust_program_call` accepts `NULL` args with `args_len == 0`.
- Values with `tag == LUST_FFI_VALUE_STRING` own `string_ptr`. Release it with `lust_value_dispose(&value)` (or `lust_string_free(ptr)` for a bare string pointer). Failing to dispose leaks.
- Lifecycle order: `lust_builder_free(builder)` after `lust_builder_compile(...)` (compile consumes the in-memory modules), and `lust_program_free(program)` last.
- `lust_program_run_entry(program)` executes the entry script's top level; call it before reading globals declared by that script.

A complete example lives in `examples/c-ffi`.

---

## 3. Native Rust Extensions

Lust can load standalone Rust crates compiled to shared libraries (`cdylib`) and expose their types and functions to scripts.

### Step 1: Configure the extension crate's `Cargo.toml`

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
lust = { version = "3.5.9", package = "lust-rs", features = ["packages"] }
```

Extensions are normally separate crates (`[workspace]` at the bottom of their manifest) so the host project stays clean.

### Step 2: Implement the Registration Hook

The hook returns `bool`, takes a raw `*mut VM`, and uses the embed builders to describe types:

```rust
use lust::{
    ast::{Span, Type, TypeKind},
    bytecode::{NativeCallResult, Value},
    embed::{
        function_param, self_param, struct_field_decl, ExternRegistry, FunctionBuilder,
        ImplBuilder, StructBuilder,
    },
    type_named, NativeExport, NativeExportParam, VM,
};

fn register_types(vm: &mut VM) {
    let mut registry = ExternRegistry::new();

    registry.add_struct(
        StructBuilder::new("Factor")
            .field(struct_field_decl("base", Type::new(TypeKind::Int, Span::dummy())))
            .field(struct_field_decl("multiplier", Type::new(TypeKind::Int, Span::dummy())))
            .finish(),
    );

    registry.add_function(
        FunctionBuilder::new("make_factor")
            .param(function_param("base", Type::new(TypeKind::Int, Span::dummy())))
            .param(function_param("multiplier", Type::new(TypeKind::Int, Span::dummy())))
            .return_type(type_named("Factor"))
            .finish(),
    );

    registry.add_impl(
        ImplBuilder::new(type_named("Factor"))
            .method(
                FunctionBuilder::new("apply")
                    .param(self_param(None))
                    .param(function_param("value", Type::new(TypeKind::Int, Span::dummy())))
                    .return_type(Type::new(TypeKind::Int, Span::dummy()))
                    .finish(),
            )
            .finish(),
    );

    registry.register_with_vm(vm);
}

#[no_mangle]
pub extern "C" fn lust_extension_register(vm_ptr: *mut VM) -> bool {
    if vm_ptr.is_null() {
        return false;
    }
    let vm = unsafe { &mut *vm_ptr };
    register_types(vm);

    vm.register_exported_native(
        NativeExport::new("host_double", vec![NativeExportParam::new("value", "int")], "int"),
        |values: &[Value]| {
            let value = values
                .get(0)
                .and_then(Value::as_int)
                .ok_or_else(|| "expected int argument".to_string())?;
            Ok(NativeCallResult::Return(Value::Int(value * 2)))
        },
    );

    true
}
```

Notes:

- `ExternRegistry::register_with_vm(vm)` registers the declared structs/functions; `register_with_typechecker(...)` does the same on the compile side. In an extension hook, `register_with_vm` is the one to call.
- `vm.register_exported_native(export, closure)` both registers the native and records its export metadata, so stubs can be generated from it.
- A native may construct values via `vm.instantiate_struct("crate.Type", fields)`; because the closure captures a raw `*mut VM`, the call site must dereference it in `unsafe`.
- To read a struct argument, use `StructInstance::from_value(value)` then `field::<T>("name")`.

### Step 3: Declare the Extension in `lust-config.toml`

```toml
[dependencies]
lust-double = { path = "extensions/double", kind = "rust" }
```
The `kind` key accepts `lust`, `rust`, or `lua` (aliases `lua51` and `lua_compat`). It is optional: when omitted, the resolver sniffs the target and decides based on what it finds (a `lust_extension_register` symbol, `luaopen_*` symbols, or `.lua` files). The example project therefore declares extensions without a kind.

### Step 4: Generate Extern Stubs

```bash
lust --dump-externs examples/rust-extension/main.lust
```

The CLI loads `lust-config.toml`, compiles each Rust extension crate, executes its `lust_extension_register` hook in a temporary VM, and writes generated stubs under `externs/<crate_name>/` next to the script. Scripts then import the bindings through a **sanitized crate prefix** — a crate named `lust-double` is imported as `lust_double`:

```lust
use lust_double.*
use lust_triple.*
use lust_double.nested.host_quadruple
```

For **path** dependencies the stubs are regenerated into the project's `externs/` directory on every run, so local edits always take effect. For **version** dependencies the stubs come from the package cache; the project's `externs/` directory shadows the cache when both exist, and a dependency's module root is searched before the host project's own source tree — a same-named directory in the project tree does not override a version-pinned dependency. Delete the cached copy under `~/.lust/packages/<name>/<version>/` (or re-run `--dump-externs`) to refresh it.

A dependency can also ship hand-written stubs in an `externs/` directory inside the crate (or point at one with `externs = "path"` in its dependency entry); those are merged with the generated exports.

---

## 4. Lua 5.1 C Libraries

Lust can load standard Lua 5.1 C API dynamic libraries (such as `luasocket`) and generate type-safe Lust extern declarations for them.

```toml
[dependencies]
luasocket_core = { path = "/path/to/lua/5.1/socket/core.so", kind = "lua" }

# Pure-Lua module trees beside a C core are picked up as well.
luasocket_lua = { path = "/path/to/share/lua/5.1", kind = "lua" }
```

Then run:

```bash
lust --dump-externs main.lust
```

For each `luaopen_*` symbol the CLI runs the entrypoint through the Lua compat shim and, when it returns a table, writes a traced stub; if tracing is not possible it falls back to a placeholder stub. Pure-Lua files are transpiled to Lust stubs — this requires a CLI built with the `lua_transpile` feature. Stubs land in `externs/`, mirroring the Lua module path as a directory tree:

```
externs/
├── socket.lust          # traced table stub for luaopen_socket
├── socket/              # transpiled pure-Lua sources
│   ├── core.lust
│   ├── http.lust
│   └── url.lust
├── ltn12.lust
└── mime.lust
```

Scripts use the modules as usual (`use socket.http.{ request }`) and can inspect dynamic values through `lua` and `LuaValue`:

```lust
use socket.http.{ request }
use lua as lua

local result: Array<LuaValue> = request("http://example.com")
if result[0] is Ok(body) and body is String(text) then
    println(text)
end
```
