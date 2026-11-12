# Enums, Option & Result

In Lust, there are no `nil`, `null`, or `undefined` values. Instead, missing data and fallible operations are explicitly represented using enums: `Option<T>` and `Result<T, E>`.

---

## Defining Custom Enums

Enums define a type that can take one of several variants. Variants can be simple unit tags or carry typed data:

```lust
enum Status
    Pending,
    Running,
    Complete(int)
end
```

### Constructing Variants

Construct variants using dot syntax (`EnumName.Variant`):

```lust
local s1 = Status.Pending
local s2 = Status.Running
local s3 = Status.Complete(0)
```

### Pattern Matching on Enums

Use the `is` operator to branch on variants and destructure their payloads:

```lust
function describe_status(s: Status): string
    if s is Pending then
        return "Waiting to start..."
    elseif s is Running then
        return "In progress..."
    elseif s is Complete(code) then
        return "Complete with exit code " .. code
    end
    return "Unknown"
end

println(describe_status(s1))
println(describe_status(s2))
println(describe_status(s3))
```

Notice that when matching `s is Complete(code)`, Lust introduces `code` as an in-scope local variable bound to the variant payload inside that branch.

---

## `Option<T>`: Handling Optional Values

When an operation might produce a value or nothing, use the built-in `Option<T>` enum. It has two variants:
- `Option.Some(value)` (or bare `Some(value)`)
- `Option.None` (or bare `None`)

```lust
function find_even(n: int): Option<int>
    if n % 2 == 0 then
        return Option.Some(n)
    end
    return Option.None
end

local result1 = find_even(42)
local result2 = find_even(7)
```

### Pattern Matching on `Option`

```lust
if result1 is Some(x) then
    println("Found even number: " .. x)
elseif result1 is None then
    println("No number found")
end
```

### Option Helper Methods

`Option` instances provide convenient helper methods:

| Method | Return Type | Description |
|---|---|---|
| `opt:is_some()` | `bool` | Returns `true` if the option is `Some`. |
| `opt:is_none()` | `bool` | Returns `true` if the option is `None`. |
| `opt:unwrap()` | `T` | Returns the inner value or raises a runtime error if `None`. |
| `opt:unwrap_or(default)` | `T` | Returns the inner value, or the provided default if `None`. |

```lust
-- Using unwrap_or for default values
println(result1:unwrap_or(0))  -- Outputs: 42
println(result2:unwrap_or(-1)) -- Outputs: -1

-- Explicit boolean checks
if result1:is_some() then
    println("Has value: " .. result1:unwrap())
end
```

---

## `Result<T, E>`: Robust Error Handling

For operations that can succeed or fail with an error, Lust provides `Result<T, E>`:
- `Result.Ok(value)` (or bare `Ok(value)`)
- `Result.Err(error)` (or bare `Err(error)`)

```lust
function divide(a: int, b: int): Result<int, string>
    if b == 0 then
        return Result.Err("division by zero")
    end
    return Result.Ok(a / b)
end

local outcome1 = divide(10, 2)
local outcome2 = divide(10, 0)
```

### Pattern Matching on `Result`

When matching `outcome is Err(err)`, the compiler binds `err` strictly to the error type parameter `E` (unlike `Ok(val)`, which binds `val` to `T`).

```lust
if outcome1 is Ok(val) then
    println("10 / 2 = " .. val)
elseif outcome1 is Err(msg) then
    println("Error: " .. msg)
end

if outcome2 is Ok(val) then
    println("Success: " .. val)
elseif outcome2 is Err(msg) then
    println("Error: " .. msg) -- Outputs: Error: division by zero
end
```

#### Nested Pattern Matching

Lust supports nested pattern matching on sum types. You can destructure nested enums directly in a single `is` expression without intermediate variables:

```lust
local query_result: Result<Option<string>, int> = Result.Ok(Option.Some("admin"))

if query_result is Ok(Some(name)) then
    println("Found user: " .. name)
elseif query_result is Ok(None) then
    println("Query succeeded but no user exists")
elseif query_result is Err(code) then
    println("Query failed with error code: " .. code)
end

-- Matching nested errors:
local r: Result<string, Option<int>> = Result.Err(Option.Some(404))
if r is Err(Some(code)) then
    println("Failed with HTTP code: " .. code)
end
```

### Sum Type Methods & Dual Invocation Syntax

Both `Option<T>` and `Result<T, E>` provide built-in helper methods. Lust supports both colon method invocation (`value:method()`) and standard dot member invocation (`value.method()`):

| Method | Return Type | Description |
|---|---|---|
| `res:is_ok()` / `res.is_ok()` | `bool` | Returns `true` if the result is `Ok`. |
| `res:is_err()` / `res.is_err()` | `bool` | Returns `true` if the result is `Err`. |
| `res:unwrap()` / `res.unwrap()` | `T` | Returns the successful value or panics if `Err`. |
| `res:unwrap_err()` / `res.unwrap_err()` | `E` | Returns the error value or panics if `Ok`. |

```lust
-- Using colon syntax
if outcome1:is_ok() then
    println("Value: " .. outcome1:unwrap())
end

-- Using dot syntax
if outcome2.is_err() then
    println("Error: " .. outcome2.unwrap_err())
end
```

---

## Propagating Option and Result with `?`

Rather than manually matching every `Option` or `Result` with `if x is Ok(...)`, Lust supports the postfix `?` (try-unwrap) operator:

```lust
function compute_ratio(a: int, b: int): Result<int, string>
    local valid_a = divide(a, 2)?      -- Early returns Err if divide fails
    local valid_b = divide(b, 2)?      -- Early returns Err if divide fails
    return Result.Ok(valid_a + valid_b)
end

function get_first_character(words: Array<string>): Option<string>
    local first_word = array.first(words)? -- Early returns None if empty
    return string.slice(first_word, 0, 1)
end
```

The try operator works uniformly across the Bytecode VM, Cranelift JIT, and Zig AOT backends.

---

## Safe Indexing with `IndexError`

Recall from [Collections](./collections.md) that array bracket reads `arr[i]` return `Result<T, IndexError>`:

```lust
local values = ["apple", "banana"]

if values[5] is Err(err) then
    -- 'err' has fields: .index and .length
    println("Attempted index: " .. err.index .. ", array length: " .. err.length)
end
```

This ensures out-of-bounds indexing cannot silently produce bugs or corrupt runtime state.

---

## Next Steps

Now learn how Lust unifies type checking, union types, and dynamic narrowing in [Pattern Matching & Types](./type-system.md).
