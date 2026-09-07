# I/O & System Services

Lust provides safe, optional standard library modules for interacting with files, standard streams, and the host operating system.

Because Lust is designed for embedded and sandboxed environments, these modules are disabled by default and can be opted into via project configuration.

---

## Enabling I/O and OS Modules

To enable the `io` and `os` modules, declare them under `[settings]` in your `lust-config.toml`:

```toml
[settings]
stdlib_modules = ["io", "os"]
jit = true
```

When you execute your script with `lust <script.lust>`, the runtime loads these modules into global scope.

---

## The `io` Module

All file and stream operations in Lust return `Result<T, string>`, requiring callers to explicitly check for failure rather than throwing unhandled exceptions.

### File Operations

| Function | Returns | Description |
|---|---|---|
| `io.read_file(path)` | `Result<string, string>` | Reads the entire file contents as a UTF-8 string. |
| `io.read_file_bytes(path)` | `Result<Array<int>, string>` | Reads the file as a raw array of byte values. |
| `io.write_file(path, data)` | `Result<(), string>` | Overwrites or creates the file with the provided string. |

```lust
local path = "app_config.txt"

-- Write a file
local write_res = io.write_file(path, "port = 8080\nenv = production\n")
if write_res is Err(err) then
    println("Failed to write config: " .. err)
    return
end

-- Read back the file
local read_res = io.read_file(path)
if read_res is Ok(content) then
    println("Config loaded:\n" .. content)
elseif read_res is Err(err) then
    println("Failed to read config: " .. err)
end
```

### Stream Operations

| Function | Returns | Description |
|---|---|---|
| `io.write_stdout(text)` | `Result<(), string>` | Writes directly to stdout without formatting. |
| `io.read_line()` | `Result<string, string>` | Reads a single line from standard input. |
| `io.read_stdin()` | `Result<string, string>` | Reads all input from standard input until EOF. |

```lust
io.write_stdout("Enter your username: ")
local input_res = io.read_line()
if input_res is Ok(name) then
    println("Hello, " .. string.trim(name) .. "!")
end
```

---

## The `os` Module

The `os` module exposes system time, sleep, and filesystem manipulation utilities:

| Function | Returns | Description |
|---|---|---|
| `os.time()` | `float` | Returns current Unix timestamp in seconds. |
| `os.sleep(seconds)` | `Result<(), string>` | Suspends the current thread for the duration. |
| `os.create_dir(path)` | `Result<(), string>` | Creates a new directory. |
| `os.create_file(path)` | `Result<(), string>` | Creates an empty file. |
| `os.rename(from, to)` | `Result<(), string>` | Renames or moves a file or directory. |
| `os.remove_file(path)` | `Result<(), string>` | Deletes a file. |
| `os.remove_dir(path)` | `Result<(), string>` | Deletes an empty directory. |

### Practical Example: Managing Files and Measuring Time

```lust
local start = os.time()

-- Create a scratch directory and file
local dir = "scratch_tmp"
os.create_dir(dir)
local file = dir .. "/data.txt"
io.write_file(file, "temporary records\n")

-- Rename the file
local renamed = dir .. "/data_archived.txt"
os.rename(file, renamed)

-- Clean up
os.remove_file(renamed)
os.remove_dir(dir)

local elapsed = os.time() - start
println("Completed filesystem tasks in " .. tostring(elapsed) .. " seconds")
```

---

## Next Steps

Now learn how Lust handles cooperative multitasking without locks or threads in [Tasks & Concurrency](./tasks.md).
