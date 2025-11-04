# Data & Control Flow

Lust keeps Lua's approachable control structures while layering on static guarantees, destructuring, and expressive helpers. This chapter demonstrates how to model program flow from simple conditionals to iterator-driven pipelines.

## Multiple Return Values and Destructuring

```lust
function split_stats(label: string, score: int): (string, bool, int)
    local is_positive = score > 0
    return label, is_positive, score
end

local title, positive, total = split_stats("quests", 12)
println(title .. ": total=" .. tostring(total) .. " (positive=" .. tostring(positive) .. ")")
```

- Functions return tuples by listing types inside parentheses.
- Callers can annotate each target or let the compiler infer everything.
- Discard unused values by assigning to `_` if necessary (`local _, ok = split_stats(...)`).

Destructuring extends to enums and chained conditions:

```lust
if fetch_user() is Ok(user) and user.profile is Some(profile) then
    println("user name = " .. profile.name)
end
```

The variables introduced by earlier `is` checks (`user`, `profile`) remain available to later clauses in the chain.

## Conditionals and Type Narrowing

```lust
function describe(value: string | int | bool): string
    if value is string then
        return "string(" .. value .. ")"
    elseif value is int then
        return "int(" .. tostring(value) .. ")"
    elseif value is bool then
        if value then
            return "bool(true)"
        end
        return "bool(false)"
    end
    return "unreachable"
end
```

- `if / elseif / else` mirrors Lua, but each branch narrows union types.
- Combine logical operators for more precise guards. `and` short-circuits, so the right-hand side only runs after the left succeeds, borrowing any variables it introduces.
- Use `or` for fallbacks: `local name = config:get("name"):unwrap_or("anonymous")`.

## Short-circuit evaluation

```lust
local age = 28 -- age is an 'int'
local status = age >= 30 and "old" or "young" -- status is inferred as a 'string' type
println(status) -- Result: "young"

function computation(): bool
    println("Some computation")
    return true
end

local check = false -- check is a 'bool'
local result = check and computation() or "fallback" -- result is inferred as a 'bool | string' type
println(result) -- Result: "fallback"
```

Lust doesn't have ternaries, but it uses short-circuit evaluation similar to Lua.  

## Working with Option and Result

```lust
function load_score(user_id: string): Result<int, string>
    if user_id:is_empty() then
        return Result.Err("missing user id")
    end
    return Result.Ok(4200)
end

local outcome = load_score("player-1")
if outcome is Ok(score) then
    println("score = " .. tostring(score))
elseif outcome is Err(message) then
    println("cannot load score: " .. message)
end
```

Methods such as `is_some`, `unwrap`, `unwrap_or`, `is_err`, and `unwrap_err` let you branch or extract values succinctly:

```lust
function find_even(n: int): Option<int>
    if n % 2 == 0 then
        return Option.Some(n)
    end
    return Option.None
end

local maybe_even = find_even(total)
println("even? " .. tostring(maybe_even:is_some()))
println("value  = " .. tostring(maybe_even:unwrap_or(-1)))
```

## Loops and Iteration

```lust
println("=== while ===")
local i = 1
while i <= 3 do
    println(i)
    i = i + 1
end

println("=== numeric for ===")
for step = 0, 10, 2 do
    println(step)
end
```

- `while` loops act exactly like Lua.
- Numeric `for` loops accept an optional step value (`start, stop, step`).
- `break` exits the closest loop; `continue` skips to the next iteration.

Iterate containers directly with `for-in`:

```lust
local fruits: Array<string> = ["apple", "banana", "cherry"]
for fruit in fruits do
    println(fruit)
end

local counts: Map<string, int> = { apple = 3, banana = 5 }
for name, amount in counts:pairs() do
    println(name .. ": " .. tostring(amount))
end
```

## Functional Pipelines

```lust
local numbers: Array<int> = [1, 2, 3, 4, 5]

local doubled = numbers:map(function(n) return n * 2 end)
local evens = doubled:filter(function(n) return n % 2 == 0 end)
local total: int = evens:reduce(0, function(acc, n) return acc + n end)

println("doubled = " .. tostring(doubled))
println("even sum = " .. tostring(total))
```

- `map` transforms each element, preserving the array type.
- `filter` keeps elements whose callback returns `true`.
- `reduce` accumulates into an initial value, with argument types inferred automatically.
- Capture external values inside lambdas just like regular closures.

## Closures and Lambdas

```lust
local multiplier = 3
local scale = function(value: int): int
    return value * multiplier
end

println(scale(5))

local make_adder = function(base: int)
    return function(offset: int): int
        return base + offset
    end
end

local add10 = make_adder(10)
println(add10(5))
```

- Anonymous functions capture surrounding variables (upvalues) without ceremony.
- Return lambdas to build factories or configure higher-order helpers.

## Maps and Dynamic Data

```lust
local tags: Map<unknown, unknown> = { ["io"] = "123ABC", ["os"] = "second", ["age"] = 56 }
println(tags:keys():len())

if tags:get("age") is Some(val) and val is int then
    println("Value is int: " .. val)
else
    println("Value is string")
end

local maybe_io = tags:get("io")
if maybe_io:is_some() then
    local raw = maybe_io:unwrap()
    if raw is string then
        println(raw)
    end
end
```

- `Map` can be made to mimic Lua's dynamic tables with `Map<unknown, unknown>` but still forces you to narrow `unknown` values.
- Directly calling `get()` on the `Map` keys will return an `Option<unknown>` directly. Run it through `is` before using type-specific methods.
- Mix numeric, string, and boolean types without sacrificing safety.

## Numeric and String Utilities

```lust
local angle: float = 7.5
println("floor = " .. tostring(angle:floor()))
println("clamp = " .. tostring(angle:clamp(0.0, 5.0)))

local phrase = "Hello, World!"
println(phrase:starts_with("Hello"))
println(phrase:replace("World", "Lust"))

local parts = phrase:split(", ")
for part in parts do
    println("part = " .. part)
end
```

- Numeric helpers like `abs`, `floor`, `ceil`, `round`, `sqrt`, and `clamp` are available directly on primitive values.
- Strings expose search, slicing, trimming, case conversion, and splitting helpers. Many return `Option` types so you can handle missing data gracefully.

With the flow of data under control, you are ready to compose asynchronous work. Continue to [Tasks & Concurrency](./tasks.md) for cooperative scheduling patterns.
