#!/usr/bin/env node
// Committed wrapper: exists at npm-install time so the workspace bin link is
// created on the very first install, before dist/ is built. npm links a
// workspace bin only if its target file exists at install time — pointing the
// bin field at dist/cli.js directly meant a fresh clone never got the link.
try {
  await import('../dist/cli.js');
} catch (err) {
  if (err?.code === 'ERR_MODULE_NOT_FOUND' && /dist[/\\]cli\.js/.test(String(err.message))) {
    console.error('maias-mcp: not built yet — run `npm run build` at the repo root, then retry.');
    process.exit(1);
  }
  throw err;
}
