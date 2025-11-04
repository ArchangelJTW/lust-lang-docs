# Language Tour

Lust keeps Lua's friendly surface while adding static types, generics, and a cooperative scheduler. This tour walks through the features you will rely on in day-to-day scripts and larger applications.

## First Steps

```lust
println("Hello from Lust!")

local who: string = "traveler"
println("A Lua-inspired language with strict typing for the " .. who)
```

- Top-level statements run immediately, making it easy to script or prototype.
- `println` automatically stringifies values, and concatenation mirrors Lua's `..` operator.
- Bindings are `local` by default; add type annotations when you want additional clarity.

## Building Blocks

```lust
function describe(label: string, score: int): (bool, int)
    local positive = score > 0
    return positive, score
end

local ok, total = describe("quests", 42)
if ok then
    println("quests total = " .. tostring(total))
end
```

What to notice:

- Functions declare argument and return types with `:` syntax and always return explicitly.
- Multiple return values are treated as tuples and can be destructured on assignment.
- Control flow uses familiar `if / elseif / else` blocks that terminate with `end`.

These fundamentals are explored in depth in [Data & Control Flow](./data-control.md).

## Types at a Glance

```lust
struct Point
    x: int
    y: int
end

enum Status
    Pending,
    Running,
    Complete(int)
end

impl Point
    function translate(self, dx: int, dy: int): Point
        return Point { x = self.x + dx, y = self.y + dy }
    end
end
```

- Structs model fixed-shape data with named fields.
- Enums capture variants (with or without payloads) and integrate seamlessly with pattern matching.
- `impl` blocks attach methods to types; call them with `value:method(args)`.

Learn how generics, trait bounds, union types, and the `is` operator tie into these definitions in the [Type System](./type-system.md) chapter.

## Everyday Collections

```lust
local scores: Array<int> = [10, 20, 30]
local tags: Map<string, int> = { ["core"] = 1, ["jit"] = 2 }

scores:push(40)
println(tags:keys():len())

```

- `Array<T>` and `Map<K, V>` provide typed collections with familiar helper methods.
- `Map<unknown, unknown>` remains dynamic when you need heterogeneous data, but you can narrow values safely via the `is` operator.
- Standard methods such as `:map`, `:filter`, and `:reduce` let you write fluent, functional-style pipelines.

## Modules and Imports

```lust
-- lib/math.lust
println("[lib.math] init")

pub struct Point
    x: int
    y: int
end

pub function add(a: int, b: int): int
    return a + b
end
```

```lust
-- lib/math/vector.lust
println("[lib.math.vector] init")

pub struct IntVector
    x: int
    y: int
end

pub function make(x: int, y: int): IntVector
    return IntVector { x = x, y = y }
end

pub function length_squared(vec: IntVector): int
    return (vec.x * vec.x) + (vec.y * vec.y)
end
```

```lust
-- main.lust
use lib.math as math
use lib.math.{Point, vector}
use lib.math.{add, vector.length_squared, vector.make as make_vector}

println("[main] grouped imports showcase")

local p: Point = Point { x = 10, y = 20 }
println("Point.y = " .. tostring(p.y))

println("math.add via alias = " .. tostring(math.add(1, 2)))
println("add via import     = " .. tostring(add(3, 4)))

local velocity: vector.IntVector = make_vector(3, 4)
println("length^2 = " .. tostring(length_squared(velocity)))
```

- `pub` exposes structs, enums, and functions for other files. In this example, separate files under `lib/` map to nested modules (`lib.math.vector`).
- `use lib.math as math` aliases an entire module; you can still reach nested items (`math.vector.IntVector`).
- `use lib.math.{Point, vector}` pulls specific exports straight into scope, including a nested module handle.
- Grouped `use` statements reach deep paths (`vector.length_squared`) and support renaming single items (`make` becomes `make_vector`).
- Explore `examples/modules/` in the repository for the complete running sample.
- Modules are resolved relative to the project root today; tooling will continue to evolve alongside the compiler.

## Concurrency Preview

```lust
local ticker: Task = task.create(function(): string
    for step = 1, 3 do
        task.yield("tick " .. tostring(step))
    end
    return "done"
end)

while task.status(ticker) == TaskStatus.Running do
    local frame = task.resume(ticker)
    println(frame.last_yield:unwrap_or("idle"))
end
```

- Tasks move cooperatively through the scheduler when they call `task.yield`.
- `task.resume` returns structured diagnostics, making it easy to drive multiple tasks in a loop.

See the full workflow for spawning, resuming, and inspecting tasks in [Tasks & Concurrency](./tasks.md).

## Where to Next

- Understand inference, enums, generics, union types, and traits in [Type System](./type-system.md).
- Explore branching, loops, closures, tables, and higher-order methods in [Data & Control Flow](./data-control.md).
- Learn how cooperative scheduling and diagnostics work in [Tasks & Concurrency](./tasks.md).
