# Pattern Matching & Types

Lust provides a sound, static type system with powerful runtime inspection tools: the `is` pattern matching operator, union types (`A | B`), the `unknown` type, and the safe `as` casting operator.

---

## The `is` Operator

The `is` operator serves two essential purposes in Lust:
1. **Testing types** on primitive and union values.
2. **Matching and destructuring** enum variants.

### Type Testing

You can test whether a value is of a particular concrete type:

```lust
local x: int = 42
local s: string = "hello"

if x is int then
    println("x is an integer")
end

-- Negative checks use 'not (...)'
if not (s is int) then
    println("s is not an integer")
end
```

---

## Union Types and Type Narrowing

Union types represent values that can belong to one of multiple distinct types, written with the pipe (`|`) operator:

```lust
local id: string | int = 101
```

Inside conditionals, testing a union value with `is` **narrows** its type within that branch. The compiler guarantees that you can safely invoke type-specific operations:

```lust
function format_identifier(id: string | int): string
    if id is string then
        -- Within this branch, 'id' is guaranteed to be a string
        return "ID: " .. string.upper(id)
    elseif id is int then
        -- Within this branch, 'id' is guaranteed to be an int
        return "ID #" .. tostring(id * 2)
    end
    return "Unknown ID"
end

println(format_identifier("usr_alpha")) -- Outputs: ID: USR_ALPHA
println(format_identifier(50))          -- Outputs: ID #100
```

---

## Dynamic Data with `unknown`

When interfacing with dynamic dictionaries, external data, or generic host payloads, types may not be statically known at compile time. In Lust, these values are typed as `unknown`:

```lust
local config: Map<string, unknown> = {}
map.set(config, "port", 8080)
map.set(config, "hostname", "localhost")
map.set(config, "debug", true)
```

Values of type `unknown` **cannot** be used directly in operations or passed to typed functions. You must first narrow or safely extract them.

---

## Safe Casting with `as`

To safely downcast a value from `unknown` to a concrete type, use the `as` operator.

**In Lust, `value as Type` returns `Option<Type>`:**
- If the value matches the requested type, it returns `Some(concrete_value)`.
- If the value does not match, it returns `None`.

Because it returns `Option`, casting in Lust **never crashes at runtime**:

```lust
local raw_port = map.get(config, "port"):unwrap()

local maybe_int = raw_port as int -- Returns Option<int>
if maybe_int is Some(port) then
    println("Server listening on port: " .. port)
end

-- Attempting an invalid cast safely returns None
local maybe_str = raw_port as string -- Returns Option.None
if maybe_str is None then
    println("Port is not a string!")
end
```

### Left-to-Right Chaining (No Parentheses Needed)

Casts and pattern checks associate left-to-right. You can combine `as` and `is` directly in an `if` statement without extra parentheses:

```lust
if raw_port as int is Some(port) and port > 1024 then
    println("Unprivileged port: " .. port)
end
```

### Linear Pattern Chaining with `and`

Conditions chained with `and` evaluate from left to right. Any variables bound by earlier patterns are immediately visible to later expressions in the chain:

```lust
-- If the first check succeeds, 'user' is in scope for the second check:
if fetch_result is Ok(user) and user.age is Some(age) and age >= 21 then
    println("Verified adult: " .. user.name .. " (age " .. age .. ")")
end
```

---

## Next Steps

Now learn how to write reusable, generic code and specify dynamic contracts in [Generics & Traits](./generics-and-traits.md).
