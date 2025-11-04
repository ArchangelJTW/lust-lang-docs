# Quick Start

Follow these steps to install the Lust CLI from prebuilt binaries, verify integrity, and run your first program.

## 1. Download

Grab the latest release for your platform from `lust-lang.dev/downloads`. Example for Linux x86_64:

```bash
curl -OL https://lust-lang.dev/downloads/lust-linux-x86_64.tar.gz
tar -xf lust-linux-x86_64.tar.gz
```

Set the binary on your `PATH` (or run it in place):

```bash
export PATH="$PWD/lust/bin:$PATH"
```

## 2. Verify

We ship checksums and signatures with every build. Always verify before executing:

```bash
curl -OL https://lust-lang.dev/downloads/lust-linux-x86_64.tar.gz.sha256
shasum -a 256 -c lust-linux-x86_64.tar.gz.sha256
```

You can also use the detached signature if you prefer GPG verification.

## 3. Run an Example (This section is a lie)

The release archive includes the `examples/` directory showcased throughout this book. Run the classic hello world:

```bash
lust examples/basic/01_hello.lust
```

The CLI treats path arguments as entry points, so running `lust <script.lust>` loads, type-checks, and executes the file without additional flags.

To inspect bytecode, add `--disassemble`:

```bash
lust --disassemble examples/basic/05_enums.lust
```

## 4. Workflow Tips

- `lust --help` lists available commands and flags.
- Use `lust repl` for quick expressions while exploring the language.
- Explore the preview module loader with `lust examples/modules/main.lust` (requires keeping the directory structure intact).
- Pair this quick start with the [Language Tour](./language-tour/overview.md) to learn the syntax that powers the examples.
