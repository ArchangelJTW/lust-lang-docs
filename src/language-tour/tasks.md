# Tasks & Concurrency

Lust provides cooperative multitasking through the built-in `task` module. Tasks are lightweight coroutines that yield control explicitly, allowing you to orchestrate concurrent workflows, event loops, or state machines without locks, threads, or data races.

---

## Creating and Spawning Tasks

A task is created by passing a function to `task.create`:

> 📂 **Runnable example:** [`examples/advanced/07_tasks_cooperative.lust`](https://github.com/ArchangelJTW/lust-lang/blob/master/examples/advanced/07_tasks_cooperative.lust)\
> 💻 *Compiler repository file:* `examples/advanced/07_tasks_cooperative.lust`

```lust
local ticker: Task = task.create(function(): string
    for step = 1, 3 do
        task.yield("tick " .. tostring(step))
    end
    return "done"
end)
```

- `task.create` returns a `Task` handle.
- Creating a task does not execute it immediately; execution starts when you first call `task.resume`.
- Alternatively, `task.run(fn)` creates and begins running a task immediately.

---

## Driving Execution with `resume` and `yield`

Inside a task, call `task.yield(value)` to suspend execution and pass a value back to the caller.

From outside, call `task.resume(handle)` to advance the task to its next yield or return:

```lust
while true do
    local status = task.status(ticker)
    if status is Completed or status is Failed or status is Stopped then
        break
    end

    local frame = task.resume(ticker)
    if frame.last_yield is Some(val) then
        println("Yielded: " .. tostring(val))
    end
end
```

---

## Task States & Diagnostics

You can inspect the state and results of a task at any time using `task.status(handle)` and `task.info(handle)`.

### `TaskStatus` Enum Variants

- `Ready` &mdash; The task is created and waiting to be resumed.
- `Running` &mdash; The task is actively suspended or running.
- `Completed` &mdash; The task ran to completion.
- `Failed` &mdash; The task encountered a runtime error.
- `Stopped` &mdash; The task was canceled or stopped.

### The `TaskInfo` Struct

`task.info(handle)` returns a diagnostic struct with three fields:

```lust
local info: TaskInfo = task.info(ticker)

println("State: " .. tostring(info.state))

if info.last_result is Some(result) then
    println("Result: " .. tostring(result))
end

if info.error is Some(err) then
    println("Error: " .. err)
end
```

---

## Coordinating Multiple Tasks: A Round-Robin Scheduler

Because tasks yield cooperatively, building a scheduler to interleave several concurrent workers requires only a loop:

```lust
function worker(name: string, steps: int): string
    for i = 1, steps do
        task.yield(name .. " step " .. tostring(i))
    end
    return name .. " finished"
end

local task_a = task.create(function(): string
    return worker("Worker-A", 2)
end)

local task_b = task.create(function(): string
    return worker("Worker-B", 3)
end)

local active: Array<Task> = [task_a, task_b]

while array.len(active) > 0 do
    local remaining: Array<Task> = []
    for t in active do
        local status = task.status(t)
        if status is Completed or status is Failed or status is Stopped then
            local info = task.info(t)
            if info.last_result is Some(res) then
                println("Done: " .. tostring(res))
            end
        else
            local frame = task.resume(t)
            if frame.last_yield is Some(msg) then
                println("Yielded: " .. tostring(msg))
            end
            array.push(remaining, t)
        end
    end
    active = remaining
end
```

**Output:**

```text
Yielded: Worker-A step 1
Yielded: Worker-B step 1
Yielded: Worker-A step 2
Yielded: Worker-B step 2
Yielded: Worker-B step 3
Done: Worker-A finished
Done: Worker-B finished
```

---

## Next Steps

Now that you have mastered the Lust language, explore how to embed it into host applications in [Embedding Lust](../embedding.md).
