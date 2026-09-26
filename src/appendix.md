# Appendix

This appendix collects reference tables, comparison cheat sheets, and the standard library index.

---

## Lust vs. Lua Comparison Cheat Sheet

| Feature | Lua | Lust |
|---|---|---|
| **Type Checking** | Dynamic runtime | Static compile-time with inference |
| **Missing Values** | `nil` | `Option<T>` (`Some` or `None`) |
| **Error Handling** | `error()`, `pcall()` strings | `Result<T, E>` (`Ok` or `Err`) |
| **Array Indexing** | **1-based** | **0-based** (`arr[0]`) |
| **Bracket Access** | `t[i]` returns `nil` if missing | `arr[i]` returns `Result<T, IndexError>` |
| **Collections** | Single `table` type | Distinct `Array<T>` and `Map<K, V>` |
| **Collection Methods**| Metatable method calls | Module functions (`array.*`, `map.*`) |
| **Classes / Records** | Tables with metatable prototypes | `struct` definitions with `impl` blocks |
| **Variant Data** | Tables with tag fields | Tagged `enum` with payload variants |
| **Pattern Matching** | Manual `type()` / field checks | Unified `is` operator with destructuring |
| **Dynamic Casting** | Unchecked table access | Safe `as` operator returning `Option<T>` |
| **String Concat** | `..` | `..` (auto-converts types implementing `ToString`) |
| **Inequality** | `~=` | Both `!=` and `~=` supported |
| **Imports** | Dynamic `require("mod")` | Static `use path as alias` or `use path.{item}` |
| **Multitasking** | `coroutine.create / resume` | `task.create / resume / yield` with diagnostics |

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
| `+`, `-`, `*`, `/`, `%` | Arithmetic | Addition, subtraction, multiplication, division, modulo |
| `+=`, `-=`, `*=`, `/=` | Assignment | In-place compound arithmetic |
| `..` | String | String concatenation |
| `==`, `!=`, `~=` | Comparison | Equality and inequality |
| `<`, `<=`, `>`, `>=` | Comparison | Relational comparisons |
| `and`, `or`, `not` | Logical | Short-circuit boolean logic |
| `is` | Pattern | Type testing and enum variant binding |
| `as` | Casting | Fallible downcast returning `Option<T>` |
| `|` | Type | Union type constructor (`string | int`) |
| `:` | Annotation / Call | Type annotation (`x: int`) or method invocation (`obj:method()`) |
| `.` | Access | Struct field access (`pt.x`) or module access (`array.len()`) |

---

## Standard Library Quick Reference

### Core Functions (Always Available)

- `print(...)` &mdash; Prints arguments separated by tabs.
- `println(...)` &mdash; Prints arguments followed by a newline.
- `tostring(val)` &mdash; Converts any value to its string representation.
- `type(val)` &mdash; Returns the type name string of a value.

### `array` Module

`len`, `is_empty`, `get`, `first`, `last`, `push`, `pop`, `insert`, `remove`, `clear`, `slice`, `concat`, `sort`, `reverse`, `contains`, `map`, `filter`, `reduce`, `iter`

### `map` Module

`len`, `is_empty`, `get`, `set`, `has`, `delete`, `clear`, `keys`, `values`, `iter`

### `string` Module

`len`, `is_empty`, `starts_with`, `ends_with`, `contains`, `sub`, `upper`, `lower`, `trim`, `trim_start`, `trim_end`, `replace`, `split`, `byte`, `char`, `chars`, `lines`

### `math` Module

`floor`, `ceil`, `round`, `abs`, `sqrt`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `min`, `max`, `clamp`, `random`, `randomseed`, `pi`, `huge`, `maxinteger`, `mininteger`

### `task` Module

`create`, `run`, `resume`, `yield`, `status`, `info`, `stop`, `restart`, `current`

### `io` Module *(Opt-in via `lust-config.toml`)*

`read_file`, `read_file_bytes`, `read_dir`, `write_file`, `read_stdin`, `read_line`, `write_stdout`

### `os` Module *(Opt-in via `lust-config.toml`)*

`time`, `sleep`, `create_file`, `create_dir`, `remove_file`, `remove_dir`, `rename`, `get_env`
