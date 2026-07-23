# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately via **GitHub's security advisories** ("Security" tab → "Report a vulnerability") on this repository. Do not open a public issue for security reports.

You can expect an acknowledgement within a few days. Please include a minimal reproduction where possible.

## Scope

The interesting surfaces are:

- **`@maias/core`** — parsing untrusted YAML/JSON documents (the validator, browser, CLI, and MCP server all feed user-supplied files into it).
- **`@maias/mcp`** — a stdio server that reads and writes files at caller-supplied paths on the local machine. It is designed for local, single-user use and performs no sandboxing of paths by itself; the MCP client's permission model is the trust boundary.
- **The MAIAS Browser** — renders untrusted documents; rendering must never execute document-controlled code.

## Supported versions

Pre-1.0 packages: only the latest published version of each package receives fixes.
