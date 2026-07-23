#!/usr/bin/env node
// `maias` is an alias package: it exists so `npx maias …` resolves on the
// public registry. All functionality lives in @maias/cli — this defers to
// its bin entry, which reads process.argv itself.
await import('@maias/cli/bin/maias.js');
