# Tasks & Concurrency

Lust's `task` module provides cooperative multitasking. Tasks yield control explicitly, so you decide when other work runs. The scheduler exposes rich diagnostics that make orchestration straightforward.

## Spawning Tasks

```lust
local ticker: Task = task.create(function(): string
    for step = 1, 3 do
        task.yield("tick " .. tostring(step))
    end
    return "done"
end)
```

- `task.create` accepts a closure and returns a `Task` handle.
- The closure does not execute immediately. The first `task.resume(ticker)` call starts the task and advances it to the next yield or return.

## Driving Execution

```lust
while true do
    local status = task.status(ticker)
    if status is Completed or status is Failed or status is Stopped then
        break
    end

    local frame = task.resume(ticker)
    println("yielded " .. tostring(frame.last_yield:unwrap_or("idle")))
end
```

- `task.status` reports a `TaskStatus` enum (`Ready`, `Running`, `Completed`, `Failed`, `Stopped`).
- `task.resume` advances the task one suspension point at a time and returns a record containing `last_yield: Option<unknown>`, along with any runtime metadata the scheduler captures.

## Inspecting Results and Errors

```lust
local info: TaskInfo = task.info(ticker)
println("state = " .. tostring(info.state))
println("result = " .. tostring(info.last_result:unwrap_or("None")))
println("error  = " .. info.error:unwrap_or("None"))
```

- `TaskInfo.state` mirrors the latest status.
- `TaskInfo.last_result` contains the final return value when a task completes normally.
- `TaskInfo.error` stores the error string for failed tasks. Stack traces propagate through the CLI with source spans, so debugging remains ergonomic.

## Coordinating Multiple Tasks

Use a helper to drive tasks round-robin style and gather diagnostics once they finish:

```lust
function step_task(label: string, handle: Task): bool
    local status = task.status(handle)
    if status is Completed or status is Failed or status is Stopped then
        local info = task.info(handle)
        println(label .. " state  = " .. tostring(info.state))
        println(label .. " result = " .. tostring(info.last_result:unwrap_or("None")))
        println(label .. " error  = " .. info.error:unwrap_or("None"))
        return true
    end

    local frame = task.resume(handle)
    println(label .. " yield  = " .. tostring(frame.last_yield:unwrap_or("None")))
    return false
end

local task_a = task.create(function()
    for n = 1, 2 do
        task.yield("A-" .. tostring(n))
    end
    return "A-done"
end)

local task_b = task.create(function()
    task.yield("B-start")
    return "B-done"
end)

local task_c = task.create(function()
    task.yield("C")
    error("boom")    -- demonstrates failure reporting
end)

local active: Array<Task> = [task_a, task_b, task_c]
while active:len() > 0 do
    local next_round: Array<Task> = []
    for handle in active do
        if not step_task("task", handle) then
            next_round:push(handle)
        end
    end
    active = next_round
end
```

Because each task yields explicitly, you never need locks or pre-emption to keep work interleaved.

## Handling Failures and Cancellation

- When a task throws, it transitions to `TaskStatus.Failed`. Inspect `task.info(handle).error` for a detailed message.
- Cooperative scheduling makes cancellation explicit: set a shared flag, return early inside the task, or choose not to resume a handle again.
- Use descriptive labels and structured logging in `step_task` helpers to understand the state of each worker during complex orchestration.

Cooperative scheduling pairs well with the data patterns from [Data & Control Flow](./data-control.md). Experiment with tasks to drive timers, message pumps, or background processors alongside your synchronous logic.
