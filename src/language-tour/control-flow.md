# Functions & Control Flow

This chapter covers functions, multiple return values, branching conditions, loops, and closures in Lust.

---

## Functions

Functions are defined with the `function` keyword and terminate with `end`. Parameter types and return types are annotated with `:`:

```lust
function add(a: int, b: int): int
    return a + b
end

local result = add(15, 27)
println("Result: " .. result) -- Outputs: Result: 42
```

If a function returns nothing, its return type can be annotated as `()` or omitted:

```lust
function greet(name: string)
    println("Hello, " .. name .. "!")
end

greet("World")
```

---

## Multiple Return Values & Destructuring

Lust treats multiple return values as typed tuples. Enclose the returned types in parentheses:

```lust
function min_max(a: int, b: int): (int, int)
    if a < b then
        return a, b
    end
    return b, a
end

-- Destructure directly into local variables
local low, high = min_max(42, 10)
println("Low: " .. low .. ", High: " .. high)
```

You can optionally annotate the types of the destination variables:

```lust
function split_stats(label: string, score: int): (string, bool, int)
    local is_positive = score > 0
    return label, is_positive, score
end

local tag: string, ok: bool, points: int = split_stats("quests", 25)
println(tag .. ": " .. points .. " (positive=" .. tostring(ok) .. ")")
```

---

## Conditionals: `if`, `elseif`, `else`

Conditionals branch on boolean expressions:

```lust
local score = 85

if score >= 90 then
    println("Grade: A")
elseif score >= 80 then
    println("Grade: B")
elseif score >= 70 then
    println("Grade: C")
else
    println("Grade: Needs Improvement")
end
```

Conditions do not require parentheses around the test expression, but do require `then` and an ending `end`.

---

## Logical Operators & Short-Circuit Evaluation

Lust uses Lua-style keywords for logical operators: `and`, `or`, and `not`.

```lust
local has_key = true
local is_admin = false

if has_key and not is_admin then
    println("Standard keyholder")
end
```

`and` and `or` short-circuit:
- `a and b`: Evaluates `a`. If `a` is falsy (`false`), evaluation stops and returns `a`. Otherwise, it evaluates and returns `b`.
- `a or b`: Evaluates `a`. If `a` is truthy, evaluation stops and returns `a`. Otherwise, it evaluates and returns `b`.

This allows idiomatic ternary-like expressions:

```lust
local age = 20
local category = age >= 18 and "adult" or "minor"
println("Category: " .. category) -- Outputs: Category: adult
```

---

## Loops

Lust provides three forms of loops: `while`, numeric `for`, and iterator `for-in`.

### While Loops

```lust
local counter = 1
while counter <= 3 do
    println("Step " .. counter)
    counter += 1
end
```

### Numeric For Loops

Numeric `for` loops iterate over a numerical range `start, stop[, step]`:

```lust
-- Count from 1 to 5 inclusive
for i = 1, 5 do
    println(i)
end

-- Count by steps of 2 (0, 2, 4, 6, 8, 10)
for i = 0, 10, 2 do
    println(i)
end
```

### For-In Loops

Use `for-in` to traverse collections and index-value pairs:

```lust
-- 1. Direct element iteration over an Array
local fruits: Array<string> = ["apple", "banana", "cherry"]
for fruit in fruits do
    println("Fruit: " .. fruit)
end

-- 2. 0-Based Index-Value iteration using ipairs(arr)
for i, fruit in ipairs(fruits) do
    -- i starts at 0 and goes to len - 1
    println(i .. ": " .. fruit .. " (matches fruits[" .. i .. "])")
end

-- 3. Iterating over a Map with map.iter()
local inventory: Map<string, int> = { apple = 10, banana = 25 }
for item, count in map.iter(inventory) do
    println(item .. ": " .. tostring(count))
end
```

---

## Error Propagation with the Try Operator (`?`)

Lust provides the postfix `?` operator for clean, ergonomic error propagation without repetitive pattern matching:

- **For `Result<T, E>`**: If the value is `Ok(v)`, it unwraps `v`. If `Err(e)`, it immediately returns `Result.Err(e)` from the enclosing function.
- **For `Option<T>`**: If the value is `Some(v)`, it unwraps `v`. If `None`, it immediately returns `Option.None`.

```lust
function parse_and_double(s: string): Result<int, string>
    -- Assume parse_int returns Result<int, string>
    local num = parse_int(s)?
    return Result.Ok(num * 2)
end

function get_first_length(items: Array<string>): Option<int>
    local first = array.first(items)?
    return Option.Some(string.len(first))
end
```

The try operator is fully lowered into the MIR control-flow graph (`Terminator::Switch` and `Terminator::Cond`) across all backends (VM, Cranelift JIT, and Zig AOT).

---

## Resource Cleanup: `defer` and `errdefer`

Lust provides Zig-inspired scoped cleanup mechanisms to ensure deterministic resource disposal without manual `finally` blocks:

- **`defer`**: Schedules a cleanup statement or block that **always** executes when the current scope exits, regardless of whether execution completed normally or via an early `return`.
- **`errdefer`**: Schedules an error-only cleanup statement or block that executes **only if** the enclosing function or scope exits with an error (e.g. returning `Result.Err` or propagating an error with `?`). If the scope succeeds, `errdefer` actions remain dormant and are discarded.

Both forms execute in strict **LIFO (Last-In, First-Out)** order when multiple cleanup handlers are registered.

### Single Statement & Block Syntax

```lust
function process_transaction(db: Database, file_path: string): Result<TransactionResult, string>
    local data = io.read_file(file_path)?
    local conn = db.open_connection()?
    defer db.close_connection(conn) -- Always closes connection upon exit

    db.begin_transaction(conn)?
    errdefer db.rollback(conn) -- Rolled back ONLY if an error occurs below

    errdefer {
        -- Multi-line block for auditing failures
        println("Transaction failed for " .. file_path)
        metrics.increment("tx.failures")
    }

    local result = db.insert_record(conn, data)?
    db.commit(conn)?
    return Result.Ok(result)
end
```

### Safety Invariants & Semantic Rules

1. **Error Scope Only:** If `process_transaction` returns `Result.Ok(...)`, `errdefer db.rollback(conn)` is **never** executed. Only unconditional `defer db.close_connection(conn)` runs.
2. **Control Flow Restrictions:** `return`, `break`, and `continue` are **strictly forbidden** inside `defer` and `errdefer` blocks to prevent corrupting active return values or stack unwinding.
3. **Effect Thunks:** Cleanups are tied to stack scopes and cannot be placed directly inside raw effect thunk bodies (`effect do errdefer ... end`).

---

## The Pipeline Operator (`|>`)

Lust includes a first-class pipeline operator **`|>`** that transforms nested function calls into clean, left-to-right readable chains. 

Instead of deeply nested function invocations:

```lust
-- Traditional nested calls (hard to read inside-out):
local total = Math.round(Math.abs(calculate_discount(get_subtotal(order), 0.15)))
```

You can write an intuitive pipeline:

```lust
-- Pipeline operator (reads naturally top-to-bottom):
local total = order
    |> get_subtotal
    |> calculate_discount(0.15)
    |> Math.abs
    |> Math.round
```

### Thread-First Transformation Semantics

The pipeline operator is **left-associative** and uses **thread-first** substitution rules:

1. **Unary Function Call:**
   $$x \;\mid>\; f \quad\Longrightarrow\quad f(x)$$
2. **Call with Additional Arguments:** The piped value becomes the **first positional argument**:
   $$x \;\mid>\; g(y, z) \quad\Longrightarrow\quad g(x, y, z)$$
3. **Module or Method Call:**
   $$x \;\mid>\; Module.method(arg) \quad\Longrightarrow\quad Module.method(x, arg)$$

### Multiline Pipelines & Precedence

You can split pipeline expressions across multiple lines by placing newlines after each `|>` token.

Arithmetic (`+`, `*`), bitwise (`|`, `&`), comparison (`<`, `==`), and unary operators bind **tighter** than `|>`:

```lust
function double(x: int): int return x * 2 end
function add(a: int, b: int): int return a + b end

-- 1. Arithmetic evaluates before piping: (2 + 3) |> double => double(5) = 10
local r1 = 2 + 3 |> double

-- 2. Chained left-to-right: add(double(10), 5) = 25
local r2 = 10 |> double |> add(5)

-- 3. Anonymous lambdas in pipelines:
local r3 = 50 |> (function(x: int): int return x / 2 end)
```

### Zero-Cost Compiler Fusion

In Lust, `|>` is not merely syntax sugar:
- In the AST and MIR lowering stages, the compiler recognizes the entire pipeline DAG.
- Intermediate structures are optimized through **Scalar Replacement of Aggregates (SROA)**, eliminating heap allocations for intermediate records.
- Sequential iterations over collections (`Iter.filter |> Iter.map`) trigger **Loop Fusion**, collapsing multiple logical steps into a single machine loop.

---

## Loop Control: `break` and `continue`

- `break` exits the nearest loop immediately.
- `continue` skips the remainder of the current iteration and jumps to the next step.

```lust
-- FizzBuzz demonstrating continue
for n = 1, 15 do
    if n % 15 == 0 then
        println("FizzBuzz")
        continue
    end
    if n % 3 == 0 then
        println("Fizz")
        continue
    end
    if n % 5 == 0 then
        println("Buzz")
        continue
    end
    println(n)
end
```

---

## Closures & Lambdas

Functions in Lust are first-class values and can be assigned to variables, passed as arguments, or returned from other functions. Anonymous functions capture surrounding variables ("upvalues") from their lexical scope:

```lust
local factor = 10

-- Lambda capturing 'factor'
local multiply = function(x: int): int
    return x * factor
end

println(multiply(4)) -- Outputs: 40
```

You can write higher-order functions that construct and return new closures:

```lust
function make_adder(base: int): function(int): int
    return function(offset: int): int
        return base + offset
    end
end

local add_five = make_adder(5)
println(add_five(10)) -- Outputs: 15
```

---

## Next Steps

Next, explore how Lust handles lists and key-value tables in [Collections & Built-ins](./collections.md).
