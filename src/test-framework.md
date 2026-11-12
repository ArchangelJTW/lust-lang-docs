# Built-in Testing Framework (`@std/test`)

Lust includes a production-grade, fiber-isolated test framework built directly into the language runtime and CLI tooling (`lust test`).

In contrast to testing solutions in dynamic languages (which often inject implicit globals like `describe`/`it` or monkey-patch system clocks), the Lust test framework adheres to three core design rules:
1. **Explicit Opt-In (Pure Core):** Testing symbols (`test`, `suite`, `assert_eq`, `TestClock`) are not ambient globals. They must be imported explicitly via `use std.test` or `import @std/test`.
2. **Zero Production Overhead:** Test blocks and suites are automatically stripped during production compilation (`lust build`), and Dead-Code Elimination (DCE) removes test helper code from release binaries.
3. **Fiber & Scope Isolation:** Every test runs in its own green fiber (`FiberContext`) with an isolated resource scope (`Scope`). Unhandled panics, assertion failures, or timeouts are contained without terminating the runner process.

---

## Writing Tests

### Standalone Tests: `test("name", function() ... end)`

Basic unit tests are defined with the `test` function:

```lust
use std.test.{test, assert, assert_eq, assert_ne, assert_almost_eq}

test("basic arithmetic and equality assertions", function()
    local x = 10
    local y = 20
    local sum = x + y

    assert_eq(sum, 30)
    assert_ne(sum, 0)
    assert_almost_eq(3.14159, 3.14150, 0.001)
    assert(sum > x, "Sum must be greater than first operand")
end)
```

### Test Modifiers: `.skip`, `.timeout`, `.only`

You can attach modifiers to test declarations to control test execution:

```lust
use std.test.{test, assert, assert_eq}

-- 1. Skip a test with a descriptive reason
test.skip("requires external redis instance in CI", "redis cluster failover probe", function()
    local ping_response = "PONG"
    assert_eq(ping_response, "PONG")
end)

-- 2. Enforce a custom timeout (in milliseconds)
test.timeout(3000, "network handshake within deadline", function()
    local connected = true
    assert(connected, "TCP connection established")
end)

-- 3. Run only this test during focused debugging
test.only("debug specific memory boundary", function()
    assert(true)
end)
```

---

## Test Suites & Lifecycle Hooks

Organize related tests into hierarchical suites using `suite` (or its alias `describe`). Suites support nested blocks and setup/teardown lifecycle hooks:

```lust
use std.test.{suite, describe, test, before_each, after_each, before_all, after_all, assert_eq, assert_almost_eq}

suite("E-Commerce Checkout & Payment Suite", function()
    -- One-time setup before all tests in this suite
    before_all(function()
        local schema_version = 42
    end)

    -- One-time cleanup after all tests in this suite
    after_all(function()
        local audit_logged = true
    end)

    -- Setup hook executed before each individual test
    before_each(function()
        local db_tx = 1001
    end)

    -- Teardown hook executed after each individual test (even if the test panics)
    after_each(function()
        local rollback = true
    end)

    test("calculates subtotal and VAT correctly", function()
        local price = 100.0
        local vat_rate = 0.20
        local total = price * (1.0 + vat_rate)

        assert_almost_eq(total, 120.0, 0.01)
    end)

    -- Nested test suite
    describe("Payment Gateways", function()
        test("authorizes credit card transaction", function()
            local card_valid = true
            assert_eq(card_valid, true)
        end)
    end)
end)
```

### Hook Execution Semantics

- **`before_all` failure:** Marks all tests in the suite as `FAILED` and skips their execution.
- **`before_each` failure:** Cancels the specific test and immediately schedules `after_each`.
- **Guaranteed `after_each`:** Guaranteed to execute even if the test fiber encounters a panic (`Cause::Die`) or is interrupted (`Cause::Interrupted`), using LIFO scope teardown (`errdefer` / `ScopeTeardown`).

---

## Assertions Reference

The testing framework provides pure synchronous assertions and effect-aware assertions.

### Pure Synchronous Assertions

| Assertion | Description | Failure Behavior |
|---|---|---|
| `assert(cond, [msg])` | Asserts that `cond` evaluates to `true` | Raises test failure with optional message |
| `assert_eq(actual, expected, [msg])` | Structural equality (`==`) | Emits colored structural diff if values differ |
| `assert_ne(actual, unexpected, [msg])` | Inequality (`!=`) | Fails if `actual == unexpected` |
| `assert_almost_eq(a, b, epsilon, [msg])` | Floating-point comparison | Checks $\lvert a - b \rvert \le \epsilon$ |
| `assert_matches(val, pattern, [msg])` | Matches value against a pattern | Fails if value does not match pattern |

### Effect & Exit Assertions (`Effect<A, E, R>`)

For code using Lust's effect system, assertions can inspect the final `Exit<A, E>` and `Cause<E>`:

```lust
use std.test.{test, assert_success, assert_fails, assert_interrupted, assert_dies}
use std.effect.{Effect, Exit, Cause, InterruptReason}

test("verifies typed effect outcomes", function()
    -- 1. assert_success: unwraps and returns the success value
    local ok_exit = Exit.Success(100)
    local val = assert_success(ok_exit)
    assert_eq(val, 100)

    -- 2. assert_fails: verifies expected typed error
    local fail_exit = Exit.Failure(Cause.Fail("ECONNREFUSED"))
    local err = assert_fails(fail_exit, "ECONNREFUSED")
    assert_eq(err, "ECONNREFUSED")

    -- 3. assert_interrupted: checks interruption reason (Timeout, OutOfMemory, OutOfGas)
    local timeout_exit = Exit.Failure(Cause.Interrupted(InterruptReason.Timeout))
    assert_interrupted(timeout_exit, InterruptReason.Timeout)

    -- 4. assert_dies: catches fatal defects/panics
    local die_exit = Exit.Failure(Cause.Die("unexpected nil dereference"))
    assert_dies(die_exit, "nil dereference")
end)
```

---

## Virtual Time Engine (`TestClock`)

Testing time-based workflows (e.g. exponential retry backoffs, long timeouts, scheduled tasks) traditionally slows down CI pipelines. Lust provides `TestClock` to simulate hours or days of elapsed time deterministically in microseconds:

```rust
use lust::test_framework::TestClockState;
use std::time::Instant;

let mut clock = TestClockState::new();
assert_eq!(clock.now_ms(), 0);

// Schedule 3 timers: 10s, 30s, and 100s
clock.schedule(101, 10_000);
clock.schedule(102, 30_000);
clock.schedule(103, 100_000);

let start = Instant::now();

// Fast-forward 10 seconds: only fiber 101 wakes up
let awakened = clock.adjust(10_000);
assert_eq!(awakened, vec![101]);
assert_eq!(clock.now_ms(), 10_000);

// Fast-forward another 90 seconds (to 100s): fibers 102 and 103 wake up
let awakened_next = clock.adjust(90_000);
assert_eq!(awakened_next, vec![102, 103]);
assert_eq!(clock.now_ms(), 100_000);

// 100,000 ms (100 seconds) of simulated time executed in < 1 ms of CPU time!
assert!(start.elapsed().as_millis() < 5);
```

---

## Mocking & Stack Context Projections

Lust avoids monkey-patching or global state manipulation. Services required by effects (`~ Requirements`) are provided at call sites.

In test suites, dependencies are mocked using zero-heap `MockService` and stack context projections:

```rust
use lust::test_framework::MockService;

let mock_db = MockService::new(1001);
let mock_net = MockService::new(1002);

// Record invocations
mock_db.record_call("query", &["SELECT * FROM users"], 10);
mock_db.record_call("query", &["INSERT INTO users"], 20);

assert_eq!(mock_db.call_count("query"), 2);
assert_eq!(mock_db.last_call("query").unwrap().args, vec!["INSERT INTO users"]);

// Zero-heap stack projection pairs
let projection = MockService::to_projection_pair(&mock_db, &mock_net);
assert_eq!(projection.get(1001), Some(mock_db.as_projection_entry().0));
```

---

## The `lust test` CLI Runner

Run tests using the built-in CLI command:

```bash
# Run all tests in the tests/ directory
lust test

# Filter tests by name or suite regex
lust test --filter "Vector2D"

# Run tests with a specific execution backend
lust test --backend vm
lust test --backend cranelift
lust test --backend zig

# Choose reporting format: console, tap, or json
lust test --format console
lust test --format tap
lust test --format json

# Control concurrency and timeouts
lust test -j 4 --timeout 2500 --bail
```

### CLI Options Reference

| Flag | Argument | Description |
|---|---|---|
| `-f`, `--filter` | `<PATTERN>` | Filter tests matching pattern (suite or test name) |
| `--format` | `console\|tap\|json` | Test report output format (default: `console`) |
| `-j`, `--jobs` | `<N>` | Number of concurrent test worker fibers (default: CPU cores) |
| `--timeout` | `<MS>` | Global per-test execution timeout in ms (default: `5000`) |
| `--bail` | &mdash; | Stop the test run immediately upon the first failure |
| `--backend` | `vm\|cranelift\|zig` | Select execution backend |
| `--virtual-clock` | &mdash; | Enable deterministic virtual time for all tests |
| `-v`, `--verbose` | &mdash; | Verbose logging with fiber schedule diagnostics |

### Panic Containment

Test fibers are strictly isolated:
- If a test panics, triggers division by zero, or runs out of gas (`OutOfGas`), the runner catches the failure via `Cause::Die` or `Cause::Interrupted`.
- All resources in that test's `Scope` are safely cleaned up.
- The failure is recorded in the test report, and the runner proceeds with subsequent tests without process aborts.

### CI Integration (TAP & JSON)

For CI pipelines, TAP 13 and JSON formats allow native integration with test analyzers:

```bash
# Export TAP output for CI
lust test --format tap > test_results.tap

# Machine-readable JSON summary
lust test --format json > test_results.json
```
