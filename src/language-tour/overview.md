# Language Guide Overview

Lust marries the lightweight, readable feel of Lua with the static safety, expressive types, and robust error handling of Rust.

If you are coming from Lua, TypeScript, or Rust:
- **From Lua**: You will find familiar syntax (`function ... end`, `local`, `if ... then ... else ... end`, string concatenation with `..`), but with compile-time type checking, explicit `Option` instead of `nil`, and modules for standard operations.
- **From TypeScript**: You get strong static safety and type narrowing, but without `any`, `undefined`, or structural confusion. Types are nominal, sound, and checked before execution.
- **From Rust**: You will appreciate enums with data, explicit `Result` and `Option` types, trait bounds, deterministic reference counting, and pattern matching with the `is` operator, all in a fast embeddable scripting language.

---

## A Quick Taste of Lust

Here is a small example showing structs, `impl` blocks, enums with payloads, and pattern matching:

```lust
struct Point
    x: int
    y: int
end

impl Point
    function new(x: int, y: int): Point
        return Point { x = x, y = y }
    end

    function translate(self, dx: int, dy: int): Point
        return Point { x = self.x + dx, y = self.y + dy }
    end
end

enum Status
    Pending,
    Active(string),
    Finished(int)
end

function report(status: Status): string
    if status is Pending then
        return "Waiting..."
    elseif status is Active(task_name) then
        return "Working on: " .. task_name
    elseif status is Finished(code) then
        return "Done with exit code: " .. tostring(code)
    end
    return "Unknown"
end

local pt = Point.new(10, 20)
local moved = pt:translate(5, -5)
println("Point: (" .. tostring(moved.x) .. ", " .. tostring(moved.y) .. ")")

local current = Status.Active("compiler")
println(report(current))
```

**Output:**
```text
Point: (15, 15)
Working on: compiler
```

---

## Key Differences from Traditional Lua

1. **Static Typing & Inference**: Every variable, function parameter, and return value has a type known to the compiler. Annotations are optional when types can be inferred.
2. **No `nil`**: Absence of a value is expressed with `Option<T>` (`Some` or `None`). There are no surprise nil-indexing panics.
3. **Safe Arrays**: Array index reads `arr[i]` return `Result<T, IndexError>`, compelling callers to handle out-of-bounds cases safely or explicitly `:unwrap()`.
4. **Collections Use Module Functions**: Arrays and maps use `array.*` and `map.*` module functions rather than metatable methods (e.g., `array.push(items, 42)`, `map.get(table, "key")`).
5. **Zero-Based Array Indexing**: Unlike Lua's 1-based convention, Lust arrays are 0-indexed (`arr[0]`).
6. **Pattern Matching with `is`**: The `is` operator tests types and binds enum variants in one atomic, readable construct.

---

## Guide Chapters

Step through the language fundamentals in the following order:

1. **[Variables & Primitives](./basics.md)** &mdash; `local`, primitive types, inference, operators, and string formatting.
2. **[Functions & Control Flow](./control-flow.md)** &mdash; Function signatures, multiple return values, conditionals, loops, and closures.
3. **[Collections & Built-ins](./collections.md)** &mdash; `Array<T>`, `Map<K, V>`, `string.*`, and `math.*`.
4. **[Structs & Methods](./structs.md)** &mdash; Struct definitions, constructors, `impl` methods, and weak `ref` links.
5. **[Enums, Option & Result](./enums.md)** &mdash; Modeling variants, representing optionality with `Option<T>`, and managing errors with `Result<T, E>`.
6. **[Pattern Matching & Types](./type-system.md)** &mdash; Deep dive into `is`, fallible `as` casting, union types, and `unknown`.
7. **[Generics & Traits](./generics-and-traits.md)** &mdash; Reusable generic definitions, trait contracts, trait bounds, and automatic stringification with `ToString`.
8. **[Modules & Organization](./modules.md)** &mdash; Code organization with `export` and `use`.
9. **[I/O & System Services](./io-and-os.md)** &mdash; File operations and system utilities with the `io` and `os` modules.
10. **[Tasks & Concurrency](./tasks.md)** &mdash; Cooperative coroutine multitasking with the `task` module.
