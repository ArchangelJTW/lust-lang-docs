# Generics & Traits

Lust combines compile-time generics with Rust-style nominal traits. Generics enable flexible, reusable components without runtime overhead, while traits define shared interfaces and dynamic contracts.

---

## Generics

Lust generics are **statically checked and runtime-erased**. A generic function or method compiles to a single bytecode body, while the typechecker infers and validates concrete types at each call site. The trace JIT can then specialize that code for observed machine types at runtime.

### Declaration-Scoped Type Parameters

Type parameters are declared within angle brackets `<...>` immediately following the declaration name. Multi-letter PascalCase names (e.g. `Item`, `Element`, `Key`, `Val`) are recommended:

```lust
function identity<Item>(value: Item): Item
    return value
end

function first<Item>(values: Array<Item>): Item
    return values[0]:unwrap()
end
```

### Type Inference and Explicit Arguments

In most cases, type parameters are inferred from the arguments:

```lust
local n = identity(42)              -- Inferred as int
local s = identity("hello")         -- Inferred as string

local numbers: Array<int> = [10, 20, 30]
local first_num = first(numbers)    -- Inferred as int
```

When a generic parameter cannot be inferred, specify it explicitly. The `<` must directly follow the identifier without whitespace:

```lust
local text = identity<string>("hello")
```

---

## Generic Structs and `impl` Blocks

You can parameterize structs and implement generic methods:

```lust
struct Box<Item>
    value: Item
end

impl<Item> Box<Item>
    function get(self): Item
        return self.value
    end

    function set(self, new_val: Item)
        self.value = new_val
    end
end

local int_box: Box<int> = Box { value = 100 }
println("Box contains: " .. int_box:get()) -- 100
```

> **Note on Impls:** Lust supports universal impl blocks (`impl<Item> Box<Item>`). Specialized impls (such as `impl Box<int>`) and conditional impls are not supported.

---

## Traits

Traits define nominal contracts that specify required methods. A type conforms to a trait only through an explicit `impl Trait for Type` block:

> 📂 **Запускаемый пример:** [`examples/traits/01_basic_trait.lust`](https://github.com/lust-lang/lust/blob/perf/10x-jit-optimization-suite/examples/traits/01_basic_trait.lust)  
> 💻 *Файл в репозитории компилятора:* `examples/traits/01_basic_trait.lust`

```lust
trait Drawable
    function draw(self)
end

struct Circle
    radius: float
end

struct Rectangle
    width: float
    height: float
end

impl Drawable for Circle
    function draw(self)
        println("Drawing circle with radius: " .. tostring(self.radius))
    end
end

impl Drawable for Rectangle
    function draw(self)
        println("Drawing rectangle: " .. tostring(self.width) .. "x" .. tostring(self.height))
    end
end
```

### Trait Bounds on Generics

Constrain generic parameters to types that implement specific traits using `<Parameter: TraitName>`:

> 📂 **Запускаемый пример:** [`examples/traits/02_trait_bounds.lust`](https://github.com/lust-lang/lust/blob/perf/10x-jit-optimization-suite/examples/traits/02_trait_bounds.lust)  
> 💻 *Файл в репозитории компилятора:* `examples/traits/02_trait_bounds.lust`

```lust
function render<T: Drawable>(shape: T)
    shape:draw()
end

local c = Circle { radius = 5.0 }
local r = Rectangle { width = 10.0, height = 20.0 }

render(c)
render(r)
```

Trait bounds are enforced statically at compile time with zero runtime dispatch cost.

---

## Dynamic Trait Objects & Narrowing

A bare trait name can also be used as a dynamic constraint type. When handling dynamic or `unknown` objects, use the `is` operator to test and narrow to a trait at runtime:

```lust
function process_object(obj: unknown)
    if obj is Drawable then
        println("Object conforms to Drawable:")
        obj:draw() -- Safe to call after narrowing!
    else
        println("Object is not drawable")
    end
end

process_object(c)   -- Draws circle
process_object(123) -- Prints: Object is not drawable
```

---

## Automatic String Concatenation with `ToString`

Lust provides a built-in `ToString` trait. Any type that implements `ToString` automatically participates in string concatenation via the `..` operator:

```lust
struct Point
    x: int
    y: int
end

impl ToString for Point
    function to_string(self): string
        return "(" .. tostring(self.x) .. ", " .. tostring(self.y) .. ")"
    end
end

local pt = Point { x = 12, y = 34 }

-- 'pt' is automatically converted to string via to_string()!
println("Target location: " .. pt) -- Outputs: Target location: (12, 34)
```

---

## Current Restrictions

Because Lust generics are statically erased:
- Trait methods currently require a leading `self` parameter.
- `is` and `as` cannot target an erased type parameter (e.g. `val is Item` is rejected; test against concrete types or traits instead).
- Generic traits and default trait method bodies are not currently supported.

---

## Next Steps

Now learn how to structure multi-file projects with [Modules & Organization](./modules.md).
