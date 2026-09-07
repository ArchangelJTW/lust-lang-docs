# Embedding Lust

Lust was built from the ground up for embedding. Whether you are embedding scripts inside a game engine, scripting an HTTP server, or extending a CLI tool, Lust provides high-level typed bindings for Rust and a stable C ABI.

---

## 1. Rust Integration (`lust-rs`)

Add the crate to your project's `Cargo.toml`:

```bash
cargo add lust-rs --rename lust
```

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

    // Execute top-level statements to initialize globals
    program.run_entry_script()?;

    // Call a typed Lust function directly from Rust
    let message: String = program.call_typed("main.greet", "Rust Host")?;
    println!("{message}");

    Ok(())
}
```

### Registering Host Functions

You can expose Rust closures as native functions in Lust:

```rust
use lust::{NativeExport, NativeExportParam};

program.register_typed_native("host_scale", |value: i64| -> Result<i64, String> {
    Ok(value * 10)
})?;

// Record export metadata so Lust stubs can be generated
program.vm_mut().record_exported_native(NativeExport::new(
    "main.host_scale",
    vec![NativeExportParam::new("value", "int")],
    "int",
));

// Dump generated stubs to disk
program.dump_externs_to_dir("externs")?;
```

### Interacting with Structs & Fields

Instantiate and inspect Lust structs safely from Rust:

```rust
use lust::{struct_field, StructInstance};

// Construct a Lust struct instance
let point: StructInstance = program.struct_instance(
    "main.Point",
    [
        struct_field("x", 10_i64),
        struct_field("y", 20_i64),
    ],
)?;

// Read fields
let x: i64 = point.field::<i64>("x")?;

// Mutate fields
point.set_field("x", 42_i64)?;
```

### Zero-Copy Struct Views with `LustStructView`

Lust provides a derive macro `LustStructView` for zero-overhead, type-safe views into Lust structs:

```rust
use lust::{LustStructView, StringRef, StructHandle};

#[derive(LustStructView)]
#[lust(type = "main.Point")]
struct PointView<'a> {
    #[lust(field = "x")]
    x: lust::LustInt,
    #[lust(field = "y")]
    y: lust::LustInt,
    #[lust(field = "name")]
    name: StringRef<'a>,
}

if let Some(handle) = program.get_typed_global::<StructHandle>("main.my_point")? {
    let view = PointView::from_handle(&handle)?;
    println!("Point: x={}, y={}, name={}", view.x, view.y, view.name.as_str());
}
```

### Inspecting JIT Performance from Host

Embedders can query tracing JIT counters at runtime:

```rust
let stats = program.jit_stats();
println!("Root traces compiled: {}", stats.root_traces_compiled);
println!("Native entries:       {}", stats.native_trace_entries);
println!("Recursive calls:      {}", stats.recursive_calls);
```

---

## 2. Embedding in C (FFI)

Lust exports a clean C ABI via `include/lust_ffi.h`. Compile your C program and link against `liblust`:

```bash
cc main.c -I/path/to/include -L/path/to/target/release -llust -o ffi_example
```

### Complete C Host Example

```c
#include "lust_ffi.h"
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    const char *source =
        "function add(a: int, b: int): int\n"
        "    return a + b\n"
        "end\n";

    EmbeddedBuilder *builder = lust_builder_new();
    lust_builder_add_module(builder, "main", source);
    lust_builder_set_entry_module(builder, "main");

    EmbeddedProgram *program = lust_builder_compile(builder);
    if (!program) {
        fprintf(stderr, "Compile error: %s\n", lust_last_error_message());
        return EXIT_FAILURE;
    }

    // Prepare arguments
    LustFfiValue args[2] = {
        {.tag = LUST_FFI_VALUE_INT, .int_value = 20},
        {.tag = LUST_FFI_VALUE_INT, .int_value = 22},
    };

    // Call the function
    LustFfiValue result = {0};
    if (lust_program_call(program, "main.add", args, 2, &result)) {
        printf("Result: %lld\n", (long long)result.int_value);
    } else {
        fprintf(stderr, "Call failed: %s\n", lust_last_error_message());
    }

    // Balance reference counts and free memory
    lust_value_dispose(&result);
    lust_program_free(program);
    return EXIT_SUCCESS;
}
```

---

## 3. Native Rust Extensions

Lust supports compiling standalone Rust crates into shared libraries (`cdylib`) that scripts can load dynamically.

### Step 1: Configure `Cargo.toml` in your extension crate

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
lust-rs = { version = "*", features = ["packages"] }
```

### Step 2: Implement the Registration Hook

```rust
use lust::packages::ModuleStub;
use lust::VM;

#[no_mangle]
pub extern "C" fn lust_extension_register(vm: *mut VM) -> *mut ModuleStub {
    // Register native functions and types into the VM
    // ...
}
```

### Step 3: Configure in `lust-config.toml`

Declare the extension in your project's `lust-config.toml`:

```toml
[dependencies]
my_extension = { path = "extensions/my_extension", kind = "rust" }
```

### Step 4: Generate Extern Stubs

Run the CLI with `--dump-externs`:

```bash
lust --dump-externs main.lust
```

The CLI inspects your extension, builds extern stubs under `externs/my_extension/`, and allows your Lust scripts to import and typecheck against native bindings.

---

## 4. Lua 5.1 C Libraries

Lust can load standard Lua 5.1 C API dynamic libraries (such as `luasocket`):

```toml
[dependencies]
socket = { path = "/path/to/socket/core.so", kind = "lua" }
```

Running `lust --dump-externs main.lust` generates type-safe Lust extern declarations for the library's exported functions.
