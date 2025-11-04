# Embedding Lust

Lust was built with embedding top of mind. The runtime is implemented in Rust, with clean APIs for Rust hosts and a stable C ABI for everything else.

## Rust Integration

The Rust crate exposes a high-level builder:

```rust,ignore
use lust_rs::{EmbeddedProgram, StructInstance};

fn main() -> lust_rs::Result<()> {
    let module_source = r#"
        struct Point
            x: int
            y: int
        end

        extern {
            function host_scale(int): int
        }

        pub function amplify(value: int): int
            return host_scale(value) * 3
        end
    "#;

    let mut program = EmbeddedProgram::builder()
        .module("main", module_source)
        .entry_module("main")
        .compile()?;

    // Module-level statements run once so globals are initialized.
    program.run_entry_script()?;

    program.register_typed_native("host_scale", |value: i64| Ok(value * 10))?;

    let amplified: i64 = program.call_typed("main.amplify", 7_i64)?;
    println!("Amplify(7) -> {amplified}");

    let point: StructInstance =
        program.struct_instance("main.Point", vec![("x", 1_i64), ("y", 2_i64)])?;
    println!("Point.x = {}", point.field::<i64>("x")?);

    Ok(())
}
```

- `EmbeddedProgram::builder()` compiles an in-memory module graph and tracks the entry module.
- Helpers such as `call_typed`, `get_typed_global`, and `struct_instance` keep Rust and Lust types aligned without unsafe code.
- Native functions surface as regular Rust closures that can return `Result<T, E>` to propagate host-side errors into Lust.

## C FFI

The C ABI mirrors the same workflow:

```c
EmbeddedBuilder *builder = lust_builder_new();
lust_builder_add_module(builder, "main", module_source);
lust_builder_set_entry_module(builder, "main");

EmbeddedProgram *program = lust_builder_compile(builder);
if (!lust_program_run_entry(program)) {
    die_with_last_error("lust_program_run_entry");
}

LustFfiValue args[2] = {
    {.tag = LUST_FFI_VALUE_INT, .int_value = 20},
    {.tag = LUST_FFI_VALUE_INT, .int_value = 22},
};

LustFfiValue result = {0};
if (!lust_program_call(program, "main.add", args, 2, &result)) {
    die_with_last_error("lust_program_call");
}

printf("20 + 22 = %lld\n", (long long)result.int_value);

lust_value_dispose(&result);
lust_program_free(program);
```

- Always check the boolean return values and call `lust_last_error_message()` for diagnostics.
- Dispose every `LustFfiValue` you receive (results, globals, struct fields, etc.) with `lust_value_dispose` so reference counts stay balanced.
- `lust_program_run_entry` is optional if your entry module has no top-level statements, but required when globals need initialization.

## Memory Management

Lust uses deterministic reference counting for every heap-allocated value. Any handle you pass across the FFI boundary bumps the underlying count, and values are reclaimed immediately when the last reference drops.

When embedding:

- Keep Rust-side handles short lived when possible so counts fall to zero promptly.
- If you store Lust values in host-side caches, release or dispose them explicitly once you are done to avoid keeping data alive longer than expected.
- Prefer the typed helpers (`StructInstance`, `EnumInstance`, `LustFfiValue`, etc.) instead of raw pointers so increments and decrements stay balanced automatically.

Choose the strategy that matches your host’s lifecycle and performance budget.

## Diagnostics in the Host

- Stack traces include function names and source spans.
- You can configure color output or request machine-readable diagnostics for tooling.

Proceed to [CLI & Tooling](./tooling.md) to explore the developer ergonomics around the core VM.
