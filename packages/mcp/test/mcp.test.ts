import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = resolve(here, '../../../examples');

let client: Client;

async function call(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
  return { isError: result.isError === true, payload: JSON.parse(text) };
}

beforeAll(async () => {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

describe('MCP server over the example files (R6.4)', () => {
  it('lists the four tools', async () => {
    const tools = await client.listTools();
    expect(tools.tools.map((t) => t.name).sort()).toEqual(['edit', 'edit_elements', 'query', 'validate']);
  });

  it('validate: passes every example', async () => {
    for (const example of ['calculator', 'todo_list', 'social_network', 'ecommerce']) {
      const { payload } = await call('validate', { file: join(EXAMPLES, example, 'maias.yaml') });
      expect(payload.valid, example).toBe(true);
    }
  });

  it('validate: reports diagnostics for an invalid file', async () => {
    const fixture = resolve(here, '../../core/test/fixtures/invalid-dangling.yaml');
    const { payload } = await call('validate', { file: fixture });
    expect(payload.valid).toBe(false);
    expect(payload.diagnostics.some((d: { code: string }) => d.code === 'MAIAS-E003')).toBe(true);
  });

  it('query: screens, flows, reachability, what_links_here', async () => {
    const file = join(EXAMPLES, 'todo_list', 'maias.yaml');
    expect((await call('query', { file, operation: 'screens' })).payload).toHaveLength(5);
    expect((await call('query', { file, operation: 'flows' })).payload.map((f: { name: string }) => f.name)).toEqual([
      'main',
      'settings',
    ]);
    expect((await call('query', { file, operation: 'reachable' })).payload).toHaveLength(5);
    expect((await call('query', { file, operation: 'orphans' })).payload).toEqual([]);
    const links = (await call('query', { file, operation: 'what_links_here', screen_id: 'task_new' })).payload;
    expect(links.length).toBe(3);
    const screen = (await call('query', { file, operation: 'screen', screen_id: 'home' })).payload;
    expect(screen.path).toBe('/tasks');
  });

  it('edit: rename cascades and the file stays valid; remove is safe by default', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-mcp-'));
    const file = join(dir, 'todo.yaml');
    copyFileSync(join(EXAMPLES, 'todo_list', 'maias.yaml'), file);

    const rename = await call('edit', { file, operation: 'rename_screen', screen_id: 'task_detail', new_id: 'task_view' });
    expect(rename.isError).toBe(false);
    expect(rename.payload.valid_after_edit).toBe(true);
    expect(readFileSync(file, 'utf8')).not.toContain('task_detail');

    const blocked = await call('edit', { file, operation: 'remove_screen', screen_id: 'task_new' });
    expect(blocked.isError).toBe(true);

    const removed = await call('edit', { file, operation: 'remove_screen', screen_id: 'task_new', cascade: true });
    expect(removed.isError).toBe(false);
    expect(removed.payload.valid_after_edit).toBe(true);
    expect(readFileSync(file, 'utf8')).not.toContain('task_new');
  });

  it('edit_elements: insert, update, move, remove — each write stays valid', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-mcp-'));
    const file = join(dir, 'todo.yaml');
    copyFileSync(join(EXAMPLES, 'todo_list', 'maias.yaml'), file);

    const step = async (ops: unknown[]) => {
      const result = await call('edit_elements', { file, screen_id: 'settings', ops });
      expect(result.isError).toBe(false);
      expect(result.payload.valid_after_edit).toBe(true);
      return result.payload;
    };

    await step([{ op: 'insert', index: 2, element: { label: 'Send feedback', type: 'link', target: 'about' } }]);
    expect(readFileSync(file, 'utf8')).toContain('label: Send feedback');

    await step([{ op: 'update', index: 2, expect: { type: 'link' }, set: { label: 'Feedback' } }]);
    expect(readFileSync(file, 'utf8')).toContain('label: Feedback');

    await step([{ op: 'move', index: 2, to: 0 }]);
    const moved = readFileSync(file, 'utf8');
    expect(moved.indexOf('label: Feedback')).toBeLessThan(moved.indexOf('type: toggle'));

    await step([{ op: 'remove', index: 0, expect: { label: 'Feedback' } }]);
    expect(readFileSync(file, 'utf8')).not.toContain('Feedback');
  });

  it('edit_elements: a refused batch reports isError and leaves the file unchanged', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-mcp-'));
    const file = join(dir, 'todo.yaml');
    copyFileSync(join(EXAMPLES, 'todo_list', 'maias.yaml'), file);
    const before = readFileSync(file, 'utf8');

    const refused = await call('edit_elements', {
      file,
      screen_id: 'home',
      ops: [
        { op: 'remove', index: 3 },
        { op: 'insert', index: 0, element: { label: 'Go', type: 'button', target: 'ghost' } },
      ],
    });
    expect(refused.isError).toBe(true);
    expect(refused.payload.error).toContain("target 'ghost'");
    expect(readFileSync(file, 'utf8')).toBe(before);
  });

  it('edit: add_screen registers and keeps the document valid', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'maias-mcp-'));
    const file = join(dir, 'todo.yaml');
    copyFileSync(join(EXAMPLES, 'todo_list', 'maias.yaml'), file);

    const added = await call('edit', {
      file,
      operation: 'add_screen',
      flow: 'settings',
      screen: {
        id: 'help',
        title: 'Help',
        type: 'informational',
        path: '/settings/help',
        description: 'FAQ and contact.',
      },
    });
    expect(added.isError).toBe(false);
    expect(added.payload.valid_after_edit).toBe(true);
    expect(readFileSync(file, 'utf8')).toContain('id: help');
  });
});
