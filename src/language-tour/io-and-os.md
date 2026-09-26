# I/O & System Services

Lust provides optional standard-library modules for file access, standard streams, and selected operating-system services. The `io` and `os` modules are disabled by default. Enable either or both in `lust-config.toml`:

```toml
[settings]
stdlib_modules = ["io", "os"]
jit = true
```

The CLI loads enabled modules into the script's global scope. A script that uses only file and stream functions can enable just `io`; functions in the `os` module require `os`.

Both modules perform operations on the host system. File paths are interpreted by the process, and environment-variable access can expose host configuration. Enable and use these modules only when your program should have that access.

---

## The `io` Module

File and stream operations return `Result<T, string>`. Check for `Ok(value)` or `Err(message)` before using the result.

### File Operations

| Function | Returns | Description |
|---|---|---|
| `io.read_file(path)` | `Result<string, string>` | Reads the entire file as UTF-8 text. |
| `io.read_file_bytes(path)` | `Result<Array<int>, string>` | Reads the file as byte values. Each array element is an integer from 0 to 255. |
| `io.read_dir(path)` | `Result<Array<string>, string>` | Lists the names of entries in a directory. The returned names do not include the directory path. |
| `io.write_file(path, contents)` | `Result<(), string>` | Creates or overwrites a file. String contents are written as-is; other values are converted to their string representation. |

```lust
local path = "app_config.txt"
local write_res = io.write_file(path, "port = 8080\nenv = production\n")
if write_res is Err(err) then
    println("Failed to write config: " .. err)
    return
end

local read_res = io.read_file(path)
if read_res is Ok(content) then
    println("Config loaded:\n" .. content)
elseif read_res is Err(err) then
    println("Failed to read config: " .. err)
end

local entries_res = io.read_dir(".")
if entries_res is Ok(entries) then
    for entry in entries do
        println(entry)
    end
elseif entries_res is Err(err) then
    println("Failed to list directory: " .. err)
end
```

### Standard Streams

| Function | Returns | Description |
|---|---|---|
| `io.write_stdout(...)` | `Result<(), string>` | Writes each argument's string representation to stdout, with no separators or newline, then flushes stdout. |
| `io.read_line()` | `Result<string, string>` | Reads one line from stdin. The returned string includes the line ending when one is present. |
| `io.read_stdin()` | `Result<string, string>` | Reads all remaining input from stdin until EOF. |

At end-of-file, `io.read_line()` succeeds with an empty string. Use `string.trim` if you do not need the line ending:

```lust
io.write_stdout("Enter your username: ")
local input_res = io.read_line()
if input_res is Ok(name) then
    println("Hello, " .. string.trim(name) .. "!")
elseif input_res is Err(err) then
    println("Failed to read input: " .. err)
end
```

---

## The `os` Module

The `os` module provides time, sleep, filesystem, and environment-variable functions. Filesystem operations return `Result<(), string>` unless noted otherwise.

| Function | Returns | Description |
|---|---|---|
| `os.time()` | `float` | Returns the current Unix timestamp in seconds. |
| `os.sleep(seconds)` | `Result<(), string>` | Suspends the current thread for the given finite, non-negative number of seconds. |
| `os.create_file(path)` | `Result<(), string>` | Creates a file, or opens it if it exists. Existing contents are not truncated. |
| `os.create_dir(path)` | `Result<(), string>` | Creates the directory and any missing parent directories. |
| `os.rename(from, to)` | `Result<(), string>` | Renames or moves a file or directory. |
| `os.remove_file(path)` | `Result<(), string>` | Deletes a file. |
| `os.remove_dir(path)` | `Result<(), string>` | Recursively deletes a directory and its contents. |
| `os.get_env(name)` | `Result<Option<string>, string>` | Reads an environment variable. Returns `Ok(None)` when it is not set, and `Err(message)` if it cannot be read as Unicode. |

### Example: Read an Environment Variable

```lust
local env_res = os.get_env("HOME")
if env_res is Ok(value) then
    if value is Some(path) then
        println("Home directory: " .. path)
    else
        println("HOME is not set")
    end
elseif env_res is Err(err) then
    println("Failed to read HOME: " .. err)
end
```

### Example: Manage Files and Measure Time

```lust
local start = os.time()
local dir = "scratch_tmp"
local file = dir .. "/data.txt"
local renamed = dir .. "/data_archived.txt"

local dir_res = os.create_dir(dir)
if dir_res is Err(err) then
    println("Failed to create directory: " .. err)
    return
end

local write_res = io.write_file(file, "temporary records\n")
if write_res is Err(err) then
    println("Failed to write file: " .. err)
    os.remove_dir(dir)
    return
end

local rename_res = os.rename(file, renamed)
if rename_res is Err(err) then
    println("Failed to rename file: " .. err)
    os.remove_dir(dir)
    return
end

-- remove_dir deletes the directory and all of its contents.
local cleanup_res = os.remove_dir(dir)
if cleanup_res is Err(err) then
    println("Failed to remove directory: " .. err)
end

local elapsed = os.time() - start
println("Completed filesystem tasks in " .. tostring(elapsed) .. " seconds")
```

---

## Next Steps

Now learn how Lust handles cooperative multitasking in [Tasks & Concurrency](./tasks.md).
