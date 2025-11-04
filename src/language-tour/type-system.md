# Type System

Lust's type system brings predictability to a Lua-like surface. Static checking, inference, generics, and trait bounds work together with runtime-friendly ergonomics. This chapter walks through the features you will use most often.

## Bindings and Inference

```lust
local count: int = 42
local name = "Lust"            -- inferred string
local active = true            -- inferred bool

function add(a: int, b: int): int
    return a + b
end

local total = add(count, 8)    -- inferred as int
```

- Bindings are `local` and mutable by default. Reassigning `count` later is perfectly legal.
- Omit annotations when the compiler can infer the type; add them for clarity or to catch unintended conversions.
- Functions use `:` to annotate arguments and return types. You can skip the return type when it is obvious, but explicit annotations make intent clearer on public APIs.

Multiple return values work like tuples:

```lust
function checkpoint(label: string, value: int): (string, bool, int)
    local positive = value > 0
    return label, positive, value
end

local tag: string, ok: bool, score: int = checkpoint("quests", 5)
println(tag .. " -> " .. tostring(score) .. " (positive=" .. tostring(ok) .. ")")
```

Each variable on the left can be annotated or inferred independently.

## Structs, Impl Blocks, and Reference Fields

```lust
struct Node
    name: string,
    parent: ref Node,
    children: Array<Node>
end

impl Node
    function new(name: string): Node
        return Node { name = name, parent = Option.None, children = [] }
    end

    function attach_child(self, child: Node): Node
        child.parent = self          -- assigning to a ref sets a weak link
        self.children:push(child)
        return child
    end
end
```

- Struct fields require explicit types. Separating fields with commas inside the literal is optional but improves readability.
- `impl` blocks attach methods to existing types. Instance methods must take `self` as the first parameter; omit it entirely when defining a static helper on the type.
- `ref` fields hold weak references; they accept either `Node` or `Option<Node>` and prevent ownership cycles. Use them when you need parent links or caches that should not keep objects alive forever.

## Enums and Pattern Binding

```lust
enum Status
    Pending,
    Running,
    Complete(int)
end

function describe_status(s: Status): string
    if s is Pending then
        return "Waiting"
    elseif s is Running then
        return "In progress"
    elseif s is Complete(code) then
        if code == 0 then
            return "Success"
        end
        return "Finished with exit code"
    end
    return "Unknown status"
end
```

- Variants can carry payloads, making enums perfect for error reporting, state machines, or optional metadata.
- The `is` operator introduces new bindings (`code` above) and narrows the type inside the branch.

Generics extend enums naturally:

```lust
enum Result<T, E>
    Ok(T),
    Err(E)
end
```

`Result` and `Option` ship with the standard library. Variant constructors (`Ok`, `Err`, `Some`, `None`) are automatically in scope.

## Generics and Collections

```lust
function sum<T: ToString>(items: Array<T>): string
    return items:reduce("", function(acc, value)
        if acc:is_empty() then
            return value:to_string()
        end
        return acc .. ", " .. value:to_string()
    end)
end

local numbers: Array<int> = [1, 2, 3]
println(sum(numbers))

local directory: Map<string, int> = { ["alpha"] = 1, ["beta"] = 2 }
println(directory:get("alpha"):unwrap_or(-1))
```

- Angle brackets declare type parameters (`Array<T>`, `Map<K, V>`). Concrete types can be inferred from literals or specified explicitly.
- Generic functions may restrict parameters with trait bounds (`T: ToString` above).
- Collection helpers - `map`, `filter`, `reduce`, `push`, `pop`, `slice`, `pairs`, etc. - preserve types, so inference flows through functional pipelines.

## Option and Result Workflows

```lust
function find_even(value: int): Option<int>
    if value % 2 == 0 then
        return Option.Some(value)
    end
    return Option.None
end

function divide(a: int, b: int): Result<int, string>
    if b == 0 then
        return Result.Err("division by zero")
    end
    return Result.Ok(a / b)
end
```

Both enums include convenience methods:

```lust
if find_even(42) is Some(n) then
    println("even: " .. tostring(n))
end

local result = divide(10, 0)
if result:is_err() then
    println(result:unwrap_err())
end
```

- `Option<T>` models data that may or may not exist.
- `Result<T, E>` models fallible operations. Combine `is` checks, `unwrap`, `unwrap_or`, `unwrap_err`, and `is_ok` / `is_err` to handle outcomes ergonomically.

## Union Types and the `is` Operator

```lust
function print_id(id: string | int)
    if id is string then
        println("String ID: " .. id)
    elseif id is int then
        println("Numeric ID: " .. tostring(id))
    end
end

local response: string | int | bool = true
if response is bool and response then
    println("response is confirmed")
end
```

- `|` forms union types. Lust narrows them with `is`, so you gain compile-time guarantees before calling type-specific methods.
- Combine `is` with `and` to create linear destructuring flows. When the left side succeeds, any variables it introduces are visible to the right:

```lust
if task_state is Ok(data) and data.user is Some(user) and user.is_admin then
    println("admin: " .. user.name)
end
```

## Working with `unknown`

`unknown` values appear when dealing with dynamic structures (`Table`, foreign data, or trait objects). You must narrow or cast before using them.

```lust
local data: Table = { name = "Ada", age = 32, verified = true }

if data:get("age") is Some(raw_age) then
    local age = raw_age:as<int>()
    println("age = " .. tostring(age:unwrap_or(-1)))
end
```

- `value:as<T>()` returns `Option<T>`, giving you an explicit fallback path.
- Try casting to multiple types in sequence until one succeeds. If none succeed, handle the default case gracefully.

## Traits and Trait Bounds

```lust
trait Drawable
    function draw(self)
end

trait Printable
    function print(self)
end

struct Circle
    radius: float
end

impl Drawable for Circle
    function draw(self)
        println("Drawing circle with radius " .. tostring(self.radius))
    end
end

function render<T: Drawable>(shape: T)
    shape:draw()
end
```

- Traits define required methods. Implement them with `impl TraitName for Type`.
- Trait bounds (`T: Drawable`) give you static dispatch with full inference.
- Traits participate in narrowing and casting:

```lust
function inspect(value: unknown)
    if value is Drawable then
        value:draw()
        return
    end

    local printable = value:as<Printable>()
    if printable:is_some() then
        printable:unwrap():print()
    end
end
```

Once a value is narrowed to a trait, the corresponding trait methods become available.

## Numeric and String Helpers

Primitive types expose a rich helper set directly:

```lust
local x: float = 3.75
println(x:floor())
println(x:clamp(0.0, 2.0))

local greeting = "Hello, Lust!"
println(greeting:find("Lust"):unwrap_or(-1))
println(greeting:to_upper())
```

- Numeric methods include `abs`, `floor`, `ceil`, `round`, `sqrt`, and `clamp`.
- Strings offer `len`, `is_empty`, `find`, `contains`, `split`, `trim`, and case conversion methods.

These helpers compose cleanly with Option/Result flows and higher-order array methods.

## Recap

- Prefer inference for concise code, but annotate shared interfaces and public APIs.
- Combine enums, traits, and union types to model domain logic precisely.
- Lean on `is` and `:as<T>()` to safely traverse dynamic data.

Continue to [Data & Control Flow](./data-control.md) to see how these types interact with branching, iteration, closures, and functional pipelines.
