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

## Arithmetic and Assignment Operators

Lust provides standard arithmetic operators:

```lust
local a = 20
local b = 6

local sum = a + b              -- 26
local difference = a - b       -- 14
local product = a * b          -- 120
local quotient = a / b         -- 3
local remainder = a % b        -- 2
```

Compound assignment operators modify variables in place:

```lust
local total = 100
total += 25                    -- 125
total -= 15                    -- 110
total *= 2                     -- 220
total /= 4                     -- 55
```

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
