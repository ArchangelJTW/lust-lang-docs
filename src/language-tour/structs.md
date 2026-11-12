# Structs & Methods

Structs allow you to define custom records with named, typed fields. You can attach methods and constructors to structs using `impl` blocks, and break reference counting cycles using `ref` fields.

---

## Defining and Instantiating Structs

Structs are defined with the `struct` keyword:

> 📂 **Запускаемый пример:** [`examples/basic/04_structs.lust`](https://github.com/lust-lang/lust/blob/perf/10x-jit-optimization-suite/examples/basic/04_structs.lust)  
> 💻 *Файл в репозитории компилятора:* `examples/basic/04_structs.lust`

```lust
struct Point
    x: int
    y: int
end
```

Create instances using struct literal syntax (`TypeName { field = value, ... }`):

```lust
local pt: Point = Point { x = 10, y = 20 }

-- Field access and mutation
println(pt.x) -- 10
pt.y = 25
println(pt.y) -- 25
```

---

## Attaching Methods with `impl`

Use `impl TypeName ... end` to define functions associated with a struct.

### Instance Methods

Methods that operate on an instance must declare `self` as their first parameter. Call them using colon syntax (`instance:method(...)`):

```lust
impl Point
    function translate(self, dx: int, dy: int): Point
        return Point { x = self.x + dx, y = self.y + dy }
    end

    function distance_squared(self): int
        return (self.x * self.x) + (self.y * self.y)
    end
end

local p1 = Point { x = 3, y = 4 }
local p2 = p1:translate(2, 6)

println("p2.x: " .. p2.x) -- 5
println("distance^2: " .. p1:distance_squared()) -- 25
```

### Static (Associated) Functions

Functions inside an `impl` block that do **not** take `self` act as static functions (often used as constructors). Call them using dot syntax (`TypeName.function(...)`):

```lust
impl Point
    function new(x: int, y: int): Point
        return Point { x = x, y = y }
    end

    function origin(): Point
        return Point { x = 0, y = 0 }
    end
end

local p = Point.new(100, 200)
local zero = Point.origin()
```

---

## Weak References with `ref` Fields

Lust's runtime uses deterministic reference counting. When building graphs, trees, or bidirectional relationships (such as a DOM node or scenegraph where parents point to children and children point back to parents), strong references would form a cycle and prevent memory from being freed immediately.

To solve this, Lust introduces **`ref` fields**:

> 📂 **Запускаемый пример:** [`examples/advanced/08_ref_structs.lust`](https://github.com/lust-lang/lust/blob/perf/10x-jit-optimization-suite/examples/advanced/08_ref_structs.lust)  
> 💻 *Файл в репозитории компилятора:* `examples/advanced/08_ref_structs.lust`

```lust
struct Node
    name: string
    parent: ref Node
    children: Array<Node>
end
```

### Key Behaviors of `ref` Fields

1. **Weak Links**: Assigning to a `ref` field stores a weak reference that does not increment the target's reference count.
2. **Reading Returns `Option<T>`**: Whenever you read a `ref` field, Lust returns an `Option<T>`. If the referenced object is still alive, it evaluates to `Some(target)`. If the target has been reclaimed or was not set, it evaluates to `None`.
3. **Flexible Assignment**: You can assign an existing object or `Option.None` directly to a `ref` field.

```lust
impl Node
    function new(name: string): Node
        return Node {
            name = name,
            parent = Option.None,
            children = []
        }
    end

    function add_child(self, child: Node)
        child.parent = self -- Set weak back-reference
        array.push(self.children, child)
    end
end

local root = Node.new("root")
local leaf = Node.new("leaf")
root:add_child(leaf)

-- Inspect weak parent link
local parent_opt = leaf.parent
if parent_opt is Some(p) then
    println("Leaf's parent is: " .. p.name) -- Outputs: Leaf's parent is: root
else
    println("Leaf has no parent")
end
```

---

## Next Steps

Next, learn how Lust models variants and handles errors without nulls in [Enums, Option & Result](./enums.md).
