# Modules & Organization

As scripts grow into full applications, Lust allows you to split code across multiple files and directories using clean, intuitive module imports.

---

## File and Directory Structure

Lust maps directory hierarchies directly to nested module names using dot notation. For example:

> 📂 **Runnable example:** [`examples/modules/main.lust`](https://github.com/ArchangelJTW/lust-lang/blob/master/examples/modules/main.lust)\
> 💻 *Compiler repository file:* `examples/modules/main.lust`

```text
my_project/
├── lust-config.toml
├── main.lust
└── geom/
    ├── shapes.lust           -- Maps to module: geom.shapes
    └── vector.lust           -- Maps to module: geom.vector
```

Top-level declarations (structs, enums, functions, and constants) in a file are automatically exported and available to other files that import them.

---

## Importing Modules with `use`

Lust provides flexible import forms using the `use` statement:

### 1. Aliasing an Entire Module

Import an entire module namespace and give it an alias:

```lust
use geom.shapes as shapes

local c = shapes.Circle { radius = 5.0 }
println("Area: " .. tostring(shapes.area(c)))
```

### 2. Importing Specific Items

Import individual types or functions directly into the current scope:

```lust
use geom.shapes.{Circle, area}

local c = Circle { radius = 5.0 }
println("Area: " .. tostring(area(c)))
```

### 3. Grouped Imports with Renaming

You can import nested module handles, deep items, and rename symbols using `as` within the same statement:

```lust
use geom.{shapes, vector.length_squared, vector.make as make_vector}

local vec = make_vector(3, 4)
println("Length^2: " .. tostring(length_squared(vec)))
```

---

## Module Lifecycle and Initialization

When a module is imported for the first time:
1. Any top-level statements inside the module are executed once to initialize globals.
2. The exported symbols and types are cached so subsequent imports of the same module do not re-run top-level initialization code.

```lust
-- lib/config.lust
println("[config] initializing settings...")
TIMEOUT: int = 30
```

```lust
-- main.lust
use lib.config as cfg

println("Timeout is: " .. cfg.TIMEOUT)
```

---

## Next Steps

Next, learn how to interact with the filesystem and operating system in [I/O & System Services](./io-and-os.md).
