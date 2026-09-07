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

Use `for-in` to traverse collections:

```lust
-- Iterating over an Array
local fruits: Array<string> = ["apple", "banana", "cherry"]
for fruit in fruits do
    println("Fruit: " .. fruit)
end

-- Iterating over a Map with map.iter()
local inventory: Map<string, int> = { apple = 10, banana = 25 }
for item, count in map.iter(inventory) do
    println(item .. ": " .. count)
end
```

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
