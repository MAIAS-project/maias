# Contributing to MAIAS

Thanks for your interest. MAIAS is an open standard plus its reference toolchain; contributions are welcome to both, with different bars.

## Ground rules

1. **One implementation.** Nothing outside `@maias/core` parses, serialises, validates, or edits MAIAS documents — the CLI, MCP server, and browser are thin consumers. If your change needs document logic, it goes in core.
2. **No drift.** Changes to the document format land as **one commit** touching everything they affect: spec chapters (`docs/spec/`), `schema/maias.schema.json`, the validator, `docs/spec/llms.txt`, and the examples. A spec PR that leaves the schema or llms.txt behind will be asked to include them.
3. **Never hand-roll YAML manipulation** — in tooling or tests. Everything goes through `@maias/core` (parse/edit/format).
4. **Comments survive.** Machine edits go through the CST; a change that loses comments or produces noisy diffs is a bug.

## Dev setup

```sh
npm install && npm run build
```

### Expected install output

A fresh `npm install` emits exactly **one** deprecation warning — `uuid@7.0.3`, a
transitive of Expo's native-prebuild tooling (`@expo/config-plugins` → `xcode`),
which this repo never executes (web + Expo Go only, no native builds). Separately,
`expo-doctor` flags same-version duplicate copies of two Expo packages — an
npm-workspaces hoisting artifact that only matters to native builds. Anything
beyond these two is new and worth reporting.

## Quality gates (all must pass before any commit)

```sh
npm run typecheck        # all workspaces
npx vitest run           # full suite, repo root
cd MAIAS_browser && npx tsc --noEmit
```

CI runs the same three gates on every push and PR. The root `npm run build` builds `@maias/core` before the packages that depend on it — always use it rather than `npm run build --workspaces`, which runs alphabetically, not topologically.

## Conventions

- Conventional commits (`feat(core): …`, `fix(browser): …`, `docs: …`).
- Tests accompany behaviour changes; the suite count only goes up.
- The screenshots in `examples/*/README.md` (and the browser README) are generated, not hand-captured: `node scripts/capture-example-screenshots.js` drives the MAIAS Browser web app headlessly and rewrites them in place (prerequisites in the script header). Regenerate them whenever an example document or the browser's rendering changes — stale screenshots are drift.
- Significant design decisions are recorded with their context, the options considered, the choice, and the rationale — include this in the PR description for anything non-obvious.
- Match the surrounding code's style and comment density.

## Proposing changes to the standard

The spec ([docs/spec/](docs/spec/)) versions as `<major>.<minor>`; minor versions are strictly additive. Open an issue describing the IA-modelling problem first — spec changes are design discussions before they are PRs. The bar is higher than for tooling: a construct must earn its place in every conforming renderer and validator.

## Reporting bugs

Validator false-positives/negatives are the most valuable reports — include the smallest document that reproduces the issue. For security matters, see [SECURITY.md](SECURITY.md).
