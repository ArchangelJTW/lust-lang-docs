# CLI & Tooling

The Lust CLI ships as the `lust` binary. It currently supports the following commands:

| Command | Description |
| --- | --- |
| `lust script.lust` | Run a Lust script. |
| `lust --disassemble script.lust` | Print the bytecode disassembly for a script. |
| `lust --help`, `lust -h` | Show the built-in help text. |
| `lust --version`, `lust -v` | Show the current release version. |

Examples from the help output:

```
lust script.lust                Run script.lust
lust -d script.lust             Disassemble script.lust
```

Use `lust --help` to confirm the latest options as new releases add capabilities. Looking for what’s next? Check the [Roadmap](./roadmap.md).
