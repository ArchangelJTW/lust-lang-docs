# Variables & Primitives

This chapter introduces Lust's fundamental building blocks: declaring variables, working with primitive types, applying operators, and formatting strings.

---

## Declaring Variables with `local`

In Lust, all local variables are declared using the `local` keyword. Variables are mutable by default:

```lust
local score: int = 10
score = 25              -- Reassignment is valid
```

Because Lust is strictly typed, reassigning a variable to a different type is rejected at compile time:

```lust
local count: int = 5
-- count = "five"       -- Compile error: type mismatch
```

---

## Primitive Types

Lust features four core primitive types:

| Type | Description | Examples |
|---|---|---|
| `int` | 64-bit signed integer | `0`, `42`, `-100`, `0xFF` |
| `float` | 64-bit IEEE 754 floating-point number | `3.14`, `-0.001`, `10.0` |
| `bool` | Boolean flag | `true`, `false` |
| `string` | UTF-8 encoded text | `"hello"`, `'world'` |

---

## Type Inference

Type annotations are optional when the compiler can deduce the type from the initial value:

```lust
local age = 30                 -- Inferred as int
local temperature = 98.6       -- Inferred as float
local is_active = true         -- Inferred as bool
local username = "alyssa"      -- Inferred as string
```

You can add explicit annotations (`: type`) whenever you want to clarify intent, make public interfaces explicit, or disambiguate numbers:

```lust
local weight: float = 150.0
local buffer_size: int = 1024
```

---

## Arithmetic Operators

Lust provides a complete set of arithmetic operators covering both integer and floating-point computations with 100% parity across the VM, Cranelift JIT, and Zig AOT backends:

```lust
local a: int = 20
local b: int = 6

local sum = a + b              -- 26
local diff = a - b             -- 14
local prod = a * b             -- 120
local quot = a / b             -- 3 (Truncating division to zero)
local floor_quot = a // b      -- 3 (Floor division: rounds towards -infinity)
local remainder = a % b        -- 2 (Truncating remainder, matching Rust %)
local power = 2 ^ 3            -- 8 (Integer exponentiation)
```

### Division and Remainder Semantics

- **Standard Division (`/`)**: Performs truncating division towards zero (e.g., `-5 / 2 == -2`). Division by zero triggers a guaranteed `DivisionByZero` runtime trap across all backends.
- **Floor Division (`//`)**: Rounds quotient strictly down towards $-\infty$:
  - `5 // 2 == 2`
  - `-5 // 2 == -3`
  - `5 // -2 == -3`
  - `-5 // -2 == 2`
- **Modulo (`%`) vs `math.mod(a, b)`**:
  - `%` implements truncating remainder (`wrapping_rem`, e.g., `-5 % 2 == -1`).
  - `math.mod(a, b)` implements floored modulo whose sign matches the divisor $b$. This guarantees the invariant identity:
    $$a == (a // b) * b + math.mod(a, b)$$

### Exponentiation (`^`)

- **Right-associative**: `2 ^ 3 ^ 2 == 2 ^ (3 ^ 2) == 2 ^ 9 == 512`.
- **Precedence higher than unary minus**: `-2 ^ 2 == -(2 ^ 2) == -4`.
- **Integer preservation**: `(int, int) -> int` when the exponent is non-negative ($>= 0$). A negative integer exponent raises a runtime error. `float ^ float` or mixed numeric operations return `float`.

---

## Bitwise Operators

Bitwise operators operate on integer values (`int` / `i64`) with automatic shift amount normalization (`rhs & 63`):

| Operator | Syntax | Description | Example |
|---|---|---|---|
| **AND** | `a & b` | Bitwise conjunction | `0b1100 & 0b1010 == 0b1000` |
| **OR** | `a \| b` | Bitwise disjunction | `0b1100 \| 0b1010 == 0b1110` |
| **XOR** | `a ^^ b` or `a ~ b` | Bitwise exclusive OR | `0b1100 ^^ 0b1010 == 0b0110` |
| **NOT** | `~a` | Unary one's complement (`~x == (-x) - 1`) | `~0 == -1` |
| **SHL** | `a << b` | Left shift (`l << (r & 63)`) | `1 << 4 == 16` |
| **SHR** | `a >> b` | Arithmetic right shift (preserves sign) | `-16 >> 2 == -4` |

> **Note on XOR and `~=`:** Lust accepts both `^^` and `~` for binary XOR. However, `^^` is the canonical operator because `^^=` is supported for compound assignment, whereas `~=` is reserved for the inequality comparison operator (`!=`).

---

## Compound Assignment Operators & Single Evaluation

Lust supports in-place compound assignment for all binary arithmetic and bitwise operations:

```lust
local total = 100
total += 25                    -- 125
total -= 15                    -- 110
total *= 2                     -- 220
total /= 4                     -- 55
total //= 2                    -- 27
total %= 10                    -- 7
total ^= 2                     -- 49
total &= 0x0F                  -- 1
total |= 0x10                  -- 17
total ^^= 0x01                 -- 16
total <<= 2                    -- 64
total >>= 3                    -- 8
```

### Guaranteed Single Evaluation
When modifying nested structure fields or array index elements (such as `arr[get_index()] += step` or `target.field += step`), Lust guarantees that the target base and index expressions are evaluated **strictly once**. Side effects in accessor expressions are never duplicated.

---

## Operator Precedence

Lust uses a 12-level precedence hierarchy matching modern systems languages:

| Level | Operators | Associativity | Description |
|:---:|---|:---:|---|
| **12 (Highest)** | `.` (field), `[]` (index), `()` (call), `?` (try-unwrap) | Left | Primary access and error propagation |
| **11** | `^` | **Right** | Exponentiation (`-2 ^ 2 == -4`) |
| **10** | `-` (unary), `not`, `~` (bitwise NOT), `#` | Right | Unary prefixes |
| **9** | `*`, `/`, `//`, `%` | Left | Multiplicative |
| **8** | `+`, `-` | Left | Additive |
| **7** | `..` | **Right** | String concatenation |
| **6** | `<<`, `>>` | Left | Bitwise shifts |
| **5** | `&` | Left | Bitwise AND |
| **4** | `^^`, `~` (binary XOR) | Left | Bitwise XOR |
| **3** | `\|` | Left | Bitwise OR |
| **2** | `==`, `!=`, `~=`, `<`, `<=`, `>`, `>=` | None | Relational comparisons |
| **1 (Lowest)** | `and`, `or` | Left | Short-circuit boolean logic |

---

## Comparison Operators

Comparisons evaluate to `bool`:

```lust
local x = 10
local y = 20

local is_equal = (x == y)      -- false
local is_not_equal = (x != y)  -- true (Lua-style '~=' is also accepted)
local is_less = (x < y)        -- true
local is_less_or_equal = (x <= y)
local is_greater = (x > y)
local is_greater_or_equal = (x >= y)
```

---

## Strings and Concatenation

Lust uses Lua's double-dot (`..`) operator for string concatenation:

```lust
local first_name = "Ada"
local last_name = "Lovelace"
local full_name = first_name .. " " .. last_name
println(full_name)             -- Outputs: Ada Lovelace
```

Primitive types (`int`, `float`, `bool`) implement the `ToString` trait out of the box, meaning they can be concatenated directly into strings without manual conversion:

```lust
local item_count = 3
local price = 19.99
local message = "Ordered " .. item_count .. " items at $" .. price
println(message)
```

You can also explicitly convert values using `tostring(val)`:

```lust
println("Flag is " .. tostring(true))
```

Escape sequences such as `\n` (newline), `\t` (tab), and `\"` (quote) are supported in string literals:

```lust
println("Line 1\nLine 2\tIndented")
```

---

## Comments

```lust
-- This is a single-line comment

--[[
    This is a multi-line
    block comment in Lust.
]]
local answer = 42 -- Comments can appear after statements
```

---

## Next Steps

Now that you know how to declare data, learn how to organize code into functions and control execution in [Functions & Control Flow](./control-flow.md).
