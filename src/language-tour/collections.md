# Collections & Built-ins

Lust provides strongly typed collections (`Array<T>` and `Map<K, V>`) alongside comprehensive standard library modules for strings and mathematics.

> **Important Syntax Note:** Collections and primitive types in Lust do **not** use method dispatch (e.g. `arr:push()` is an error). Instead, use the corresponding module functions: `array.push(arr, ...)`, `map.get(map, ...)`, `string.len(str)`, and `math.floor(num)`.

---

## Arrays (`Array<T>`)

An `Array<T>` is an ordered, dynamically-sized list of homogeneous elements.

```lust
local numbers: Array<int> = [10, 20, 30]
local names = ["Alice", "Bob", "Charlie"] -- Inferred as Array<string>
```

### 0-Based Indexing and the `Result` Pattern

Unlike Lua (which uses 1-based indexing), **Lust arrays are 0-indexed**. The first element is at index `0`.

Furthermore, bracket indexing in Lust is non-trapping and returns `Result<T, IndexError>`:

```lust
local values = ["first", "second", "third"]

-- Safe read with pattern matching
if values[0] is Ok(item) then
    println("Element: " .. item) -- Outputs: Element: first
end

-- Out-of-bounds error handling
if values[10] is Err(err) then
    println("Index " .. err.index .. " exceeds length " .. err.length)
end
```

When you are certain an index is valid and a panic on failure is acceptable, call `:unwrap()`:

```lust
local guaranteed = values[0]:unwrap()
```

When you only care whether an element exists without needing the `IndexError` diagnostics, use `array.get(arr, index)` which returns `Option<T>`:

```lust
local maybe_item = array.get(values, 1) -- Option<string>
if maybe_item is Some(item) then
    println("Found: " .. item)
end
```

### Array Module Functions

The `array` module provides operations for querying and mutating arrays:

| Function | Signature | Description |
|---|---|---|
| `array.len(arr)` | `(Array<T>) -> int` | Returns the number of elements. |
| `array.is_empty(arr)` | `(Array<T>) -> bool` | Checks if the array has zero elements. |
| `array.first(arr)` | `(Array<T>) -> Option<T>` | Returns the first element, or `None`. |
| `array.last(arr)` | `(Array<T>) -> Option<T>` | Returns the last element, or `None`. |
| `array.push(arr, item)` | `(Array<T>, T) -> ()` | Appends an element to the end. |
| `array.pop(arr)` | `(Array<T>) -> Option<T>` | Removes and returns the last element. |
| `array.insert(arr, idx, item)` | `(Array<T>, int, T) -> ()` | Inserts an element at the specified index. |
| `array.remove(arr, idx)` | `(Array<T>, int) -> Option<T>` | Removes the element at the index. |
| `array.slice(arr, start, end)` | `(Array<T>, int, int) -> Array<T>` | Returns a sub-array from `start` to `end` (exclusive). |
| `array.concat(a, b)` | `(Array<T>, Array<T>) -> Array<T>` | Combines two arrays into a new array. |
| `array.contains(arr, item)` | `(Array<T>, T) -> bool` | Checks if the item exists in the array. |
| `array.reverse(arr)` | `(Array<T>) -> ()` | Reverses the array elements in place. |
| `array.sort(arr)` | `(Array<T>) -> ()` | Sorts the array elements in place. |
| `array.clear(arr)` | `(Array<T>) -> ()` | Removes all elements from the array. |

Example:

```lust
local items: Array<int> = [1, 2, 3]

array.push(items, 4)
println("Length: " .. array.len(items)) -- 4

local popped = array.pop(items)
if popped is Some(val) then
    println("Popped: " .. val)          -- 4
end

local sub = array.slice(items, 0, 2)    -- Elements at 0 and 1: [1, 2]
println("Slice length: " .. array.len(sub)) -- 2
```

### Functional Transformations

The `array` module provides functional utilities: `map`, `filter`, and `reduce`:

```lust
local numbers: Array<int> = [1, 2, 3, 4, 5, 6]

-- Map: double every number
local doubled = array.map(numbers, function(n: int): int
    return n * 2
end)

-- Filter: keep only numbers greater than 5
local filtered = array.filter(doubled, function(n: int): bool
    return n > 5
end)

-- Reduce: sum the filtered items
local sum: int = array.reduce(filtered, 0, function(acc: int, n: int): int
    return acc + n
end)

println("Resulting sum: " .. sum) -- (6 + 8 + 10 + 12 = 36)
```

---

## Maps (`Map<K, V>`)

A `Map<K, V>` is a hash-based key-value dictionary with strongly typed keys and values.

```lust
local scores: Map<string, int> = {
    Alice = 100,
    Bob = 85,
    Charlie = 92
}
```

Bracket literals with explicit keys are also supported: `{ ["key"] = value }`.

### Map Module Functions

| Function | Signature | Description |
|---|---|---|
| `map.len(m)` | `(Map<K, V>) -> int` | Number of key-value pairs. |
| `map.is_empty(m)` | `(Map<K, V>) -> bool` | `true` if map contains no pairs. |
| `map.has(m, key)` | `(Map<K, V>, K) -> bool` | Checks if a key exists. |
| `map.get(m, key)` | `(Map<K, V>, K) -> Option<V>` | Returns `Some(value)` or `None`. |
| `map.set(m, key, val)` | `(Map<K, V>, K, V) -> ()` | Inserts or updates an entry. |
| `map.delete(m, key)` | `(Map<K, V>, K) -> Option<V>` | Removes and returns the entry. |
| `map.keys(m)` | `(Map<K, V>) -> Array<K>` | Returns an array containing all keys. |
| `map.values(m)` | `(Map<K, V>) -> Array<V>` | Returns an array containing all values. |
| `map.iter(m)` | `(Map<K, V>) -> Iterator` | Iterator for `for k, v in map.iter(m) do`. |
| `map.clear(m)` | `(Map<K, V>) -> ()` | Clears all entries. |

Example:

```lust
local capitals: Map<string, string> = {}
map.set(capitals, "France", "Paris")
map.set(capitals, "Japan", "Tokyo")

local japan_cap = map.get(capitals, "Japan")
if japan_cap is Some(city) then
    println("Capital of Japan: " .. city)
end

println("Has Germany: " .. tostring(map.has(capitals, "Germany"))) -- false
```

---

## Strings (`string` Module)

Strings are UTF-8 text values. Manipulate them via the `string` module:

```lust
local message = "  Hello, Lust World!  "

local trimmed = string.trim(message)
println("Trimmed: " .. trimmed)

println("Upper: " .. string.upper(trimmed))
println("Lower: " .. string.lower(trimmed))
println("Starts with 'Hello': " .. tostring(string.starts_with(trimmed, "Hello")))
println("Contains 'Lust': " .. tostring(string.contains(trimmed, "Lust")))

-- Substring using 1-based indexing (Lua style)
println("Sub (1, 5): " .. string.sub(trimmed, 1, 5)) -- Hello

-- Replace
local replaced = string.replace(trimmed, "World", "Developers")
println(replaced) -- Hello, Lust Developers!

-- Split into Array<string>
local words = string.split(trimmed, " ")
println("Word count: " .. array.len(words))
```

---

## Math (`math` Module)

The `math` module exposes standard constants and mathematical functions:

```lust
local radius: float = 5.0
local area: float = math.pi * radius * radius
println("Area: " .. area)

local val: float = -4.75
println("abs: " .. math.abs(val))       -- 4.75
println("floor: " .. math.floor(val))   -- -5
println("ceil: " .. math.ceil(val))     -- -4
println("round: " .. math.round(val))   -- -5
println("clamp: " .. math.clamp(12, 0, 10)) -- 10
```

---

## Next Steps

Now that you can work with collections, see how to model custom domain data in [Structs & Methods](./structs.md).
