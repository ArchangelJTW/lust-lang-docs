# Appendix

This appendix collects reference tables, comparison cheat sheets, and the standard library index.

---

## Lust vs. Lua Comparison Cheat Sheet

| Feature | Lua | Lust |
|---|---|---|
| **Type Checking** | Dynamic runtime | Static compile-time with inference |
| **Missing Values** | `nil` | `Option<T>` (`Some` or `None`) |
| **Error Handling** | `error()`, `pcall()` strings | `Result<T, E>` (`Ok` or `Err`) and `?` try-operator |
| **Array Indexing** | **1-based** | **0-based** (`arr[0]`), non-trapping `Result<T, IndexError>` |
| **Iteration (`ipairs`)** | 1-based (`1..#t`) | **0-based** (`0..len-1`) for native arrays; 1-based for `LuaTable` bridge |
| **Collections** | Single dynamic `table` | Distinct `Array<T>` and `Map<K, V>` with dedicated `array` and `map` modules |
| **Collection Methods**| Metatable method calls | Module functions (`array.*`, `map.*`) |
| **Classes / Records** | Tables with metatable prototypes | `struct` definitions with `impl` blocks |
| **Variant Data** | Tables with tag fields | Tagged `enum` with payload variants |
| **Pattern Matching** | Manual `type()` / field checks | Unified `is` operator with destructuring |
| **Dynamic Casting** | Unchecked table access | Safe `as` operator returning `Option<T>` |
| **String Concat** | `..` | `..` (auto-converts types implementing `ToString`) |
| **Inequality** | `~=` | Both `!=` and `~=` supported |
| **Imports** | Dynamic `require("mod")` | Static `use path as alias` or `use path.{item}` |
| **Execution Engines** | VM / LuaJIT | Multi-tier: Bytecode VM (`--jit=off`), Cranelift JIT, Cranelift Object AOT (`cranelift-aot`), `#![no_std]` Rust AOT (`lust-aot-rt`), and Zig AOT |
| **Multitasking & Effects** | `coroutine.create / resume` | `task.create / resume / yield` with diagnostics, plus algebraic effect handlers (`handle ... with`, `perform`, `resume`) |
| **Borrowed Views** | Shared table references | Compile-time checked `&T` / `&mut T` views (`view.borrow`, `view.borrow_mut`, `view.read`, `view.materialize`) |

---

## Keywords

```text
as          break       continue    do          else
elseif      end         enum        extern      for
function    if          impl        in          is
local       not         or          ref         return
struct      task        then        trait       use
while
```

---

## Operators

| Operator | Category | Description |
|---|---|---|
| `+`, `-`, `*`, `/`, `//`, `%`, `^` | Arithmetic | Addition, subtraction, multiplication, truncating division, floor division, truncating remainder, right-associative exponentiation |
| `&`, `\|`, `^^`, `~`, `<<`, `>>` | Bitwise | Bitwise AND, OR, XOR (`^^` or `~`), unary NOT (`~`), left shift, arithmetic right shift |
| `+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `^=`, `&=`, `\|=`, `^^=`, `<<=`, `>>=` | Compound | In-place compound assignments with guaranteed single-evaluation of targets |
| `?` | Error Propagation | Postfix try-unwrap operator for `Option<T>` and `Result<T, E>` |
| `..` | String | String concatenation (right-associative) |
| `==`, `!=`, `~=` | Comparison | Equality and inequality |
| `<`, `<=`, `>`, `>=` | Comparison | Relational comparisons |
| `and`, `or`, `not` | Logical | Short-circuit boolean logic |
| `is` | Pattern | Type testing and enum variant binding |
| `as` | Casting | Fallible downcast returning `Option<T>` |
| `\|` | Type | Union type constructor (`string \| int`) |
| `&`, `&mut` | Borrow | Shared and mutable borrowed views (`&expr`, `&mut expr`, `&T`, `&mut T`) |
| `:` | Annotation / Call | Type annotation (`x: int`) or method invocation (`obj:method()`) |
| `.` | Access | Struct field access (`pt.x`) or module access (`array.len()`) |

---

## Standard Library Quick Reference

### Core Functions (Always Available)

- `print(...)` &mdash; Prints arguments separated by tabs.
- `println(...)` &mdash; Prints arguments followed by a newline.
- `tostring(val)` &mdash; Converts any value to its string representation.
- `type(val)` &mdash; Returns the type name string of a value.
- `ipairs(arr)` &mdash; 0-based iterator for native arrays yielding `(index, value)`.


### `array` Module

`len`, `is_empty`, `get`, `first`, `last`, `push`, `pop`, `insert`, `remove`, `clear`, `slice`, `concat`, `sort`, `reverse`, `contains`, `map`, `filter`, `reduce`, `iter`

- `array.concat<T>(arr: Array<T> [, sep: string]): string` &mdash; Joins each element's display representation into a single `string` using the optional `sep` string separator (defaults to `""`, the empty string). It returns a `string`, not a new `Array`.

```lust
use std::array

local words = ["lust", "is", "fast"]
local joined: string = array.concat(words, ", ") -- "lust, is, fast"
local compact: string = array.concat(words)      -- "lustisfast"
```

### `map` Module

`len`, `is_empty`, `get`, `set`, `has`, `delete`, `clear`, `keys`, `values`, `iter`

### `string` Module

`byte`, `char`, `chars`, `contains`, `ends_with`, `find`, `format`, `gsub`, `index_of`, `is_empty`, `len`, `lines`, `lower`, `match`, `rep`, `replace`, `reverse`, `slice`, `split`, `starts_with`, `sub`, `trim`, `trim_end`, `trim_start`, `upper`

*Notes:* `string.slice(s, start, end)` and `string.index_of(s, pattern)` operate with 0-based indexing. `string.sub` and `string.find` maintain 1-based Lua compatibility.

### `math` Module

**Constants:** `huge`, `maxinteger`, `mininteger`, `pi`

**Functions:** `abs`, `acos`, `asin`, `atan`, `atan2`, `ceil`, `clamp`, `cos`, `deg`, `exp`, `floor`, `log`, `max`, `min`, `mod`, `rad`, `random`, `randomseed`, `round`, `sin`, `sqrt`, `tan`, `tofloat`, `tointeger`

*Notes:* `math.mod(a, b)` implements floored modulo satisfying $a == (a // b) * b + math.mod(a, b)$.

### `task` Module

`create`, `run`, `resume`, `yield`, `status`, `info`, `stop`, `restart`, `current`

### `io` Module *(Opt-in via `lust-config.toml`)*

`read_file`, `read_file_bytes`, `read_dir`, `write_file`, `read_stdin`, `read_line`, `write_stdout`

### `os` Module *(Opt-in via `lust-config.toml`)*

`time`, `sleep`, `create_file`, `create_dir`, `remove_file`, `remove_dir`, `rename`, `get_env`
