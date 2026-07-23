# maias

Alias package: makes `npx maias …` work without the scope. Everything is implemented in [`@maias/cli`](https://www.npmjs.com/package/@maias/cli) — this package just depends on it and re-exposes the `maias` bin.

```sh
npx maias validate my-app.maias.yaml
npx maias fmt my-app.maias.yaml --write
npx maias rename my-app.maias.yaml old_screen new_screen
```

Prefer the explicit form? `npx @maias/cli …` is identical. Docs, spec, and source: [github.com/MAIAS-project/maias](https://github.com/MAIAS-project/maias).

**Note:** this directory is intentionally *not* an npm workspace of the monorepo — its `maias` bin name would collide with `@maias/cli`'s inside `node_modules/.bin`. It is published from this directory directly and pins nothing but `@maias/cli`.
