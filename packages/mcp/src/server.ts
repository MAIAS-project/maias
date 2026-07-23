import { readFileSync, writeFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  addScreen,
  editElements,
  format,
  orphanScreens,
  parse,
  reachableScreens,
  removeScreen,
  renameScreen,
  screenIndex,
  validate,
  whatLinksHere,
  type ElementOp,
  type ParsedDocument,
  type Screen,
} from '@maias/core';

/**
 * The MAIAS MCP server (R6.4): a thin wrapper over @maias/core exposing
 * `validate`, `query`, and `edit` so any MCP-capable agent can work with MAIAS
 * files. No logic here beyond argument marshalling — the core library is the
 * single implementation.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: 'maias', version: '0.2.0' });

  const ok = (payload: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  });
  const fail = (message: string) => ({
    content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  });

  const load = (file: string): ParsedDocument => {
    const result = parse(readFileSync(file, 'utf8'));
    if (!result.parsed) {
      throw new Error(`parse failed: ${result.diagnostics.map((d) => d.message).join('; ')}`);
    }
    return result.parsed;
  };

  server.registerTool(
    'validate',
    {
      title: 'Validate a MAIAS document',
      description:
        'JSON Schema validation plus semantic lint (dangling targets, orphans, registry membership, …) for a MAIAS file. Returns { valid, diagnostics[] } with line/col positions.',
      inputSchema: { file: z.string().describe('Path to a .yaml or .json MAIAS document') },
    },
    async ({ file }) => {
      try {
        const result = validate(readFileSync(file, 'utf8'));
        return ok({ file, valid: result.valid, diagnostics: result.diagnostics });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  );

  server.registerTool(
    'query',
    {
      title: 'Query a MAIAS document graph',
      description:
        'Graph utilities over a MAIAS file: get one screen, list screens/flows, reachability analysis, orphan detection, and "what links here" for a screen id.',
      inputSchema: {
        file: z.string().describe('Path to the MAIAS document'),
        operation: z.enum(['screen', 'screens', 'flows', 'reachable', 'orphans', 'what_links_here']),
        screen_id: z.string().optional().describe("Screen id — required for 'screen' and 'what_links_here'"),
      },
    },
    async ({ file, operation, screen_id }) => {
      try {
        const doc = load(file).data;
        switch (operation) {
          case 'screen': {
            if (!screen_id) return fail("'screen' requires screen_id");
            const screen = screenIndex(doc).get(screen_id);
            return screen ? ok(screen) : fail(`no screen '${screen_id}'`);
          }
          case 'screens':
            return ok(
              doc.screens.map((s: Screen) => ({ id: s.id, title: s.title, type: s.type, path: s.path })),
            );
          case 'flows':
            return ok(doc.app.flows);
          case 'reachable':
            return ok([...reachableScreens(doc)]);
          case 'orphans':
            return ok(orphanScreens(doc));
          case 'what_links_here': {
            if (!screen_id) return fail("'what_links_here' requires screen_id");
            return ok(whatLinksHere(doc, screen_id));
          }
        }
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  );

  server.registerTool(
    'edit',
    {
      title: 'Safely edit a MAIAS document',
      description:
        'Reference-safe edits: rename_screen cascades to flows, the navigation registry, and every target; add_screen registers the screen; remove_screen refuses to leave dangling references unless cascade is set. Writes the result back to the file (canonically formatted when format_output is true).',
      inputSchema: {
        file: z.string().describe('Path to the MAIAS document'),
        operation: z.enum(['rename_screen', 'add_screen', 'remove_screen']),
        screen_id: z.string().optional().describe('Target screen id (rename_screen / remove_screen)'),
        new_id: z.string().optional().describe('New id (rename_screen)'),
        screen: z
          .record(z.string(), z.unknown())
          .optional()
          .describe('Screen object per the spec (add_screen)'),
        flow: z.string().optional().describe('Flow to append the new screen to (add_screen)'),
        registry: z.enum(['primary', 'secondary']).optional().describe('Registry list for add_screen (default secondary)'),
        cascade: z.boolean().optional().describe('remove_screen: also remove inbound references'),
        format_output: z.boolean().optional().describe('Write canonical form (default true)'),
      },
    },
    async ({ file, operation, screen_id, new_id, screen, flow, registry, cascade, format_output }) => {
      try {
        const parsed = load(file);
        let result;
        switch (operation) {
          case 'rename_screen':
            if (!screen_id || !new_id) return fail('rename_screen requires screen_id and new_id');
            result = renameScreen(parsed, screen_id, new_id);
            break;
          case 'add_screen':
            if (!screen) return fail('add_screen requires screen');
            result = addScreen(parsed, screen as unknown as Screen, { flow, registry });
            break;
          case 'remove_screen':
            if (!screen_id) return fail('remove_screen requires screen_id');
            result = removeScreen(parsed, screen_id, { cascade });
            break;
        }
        if (!result.ok) return fail(result.reason ?? 'edit refused');

        const output = format_output === false ? parsed.toString() : format(parsed);
        const validation = validate(output);
        writeFileSync(file, output);
        return ok({
          file,
          operation,
          changes: result.changes,
          valid_after_edit: validation.valid,
          diagnostics: validation.diagnostics.filter((d) => d.severity === 'error'),
        });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  );

  server.registerTool(
    'edit_elements',
    {
      title: "Safely edit a screen's elements",
      description:
        "Batch edit of a screen's `elements` list (or a declared state's list): insert, update, remove, move. " +
        'The batch is atomic — a failing op refuses the whole batch and the file is untouched. Ops apply sequentially, ' +
        "so each op's index addresses the list as left by the previous ops (0-based; insert at list length appends; " +
        "move's `to` is the final index). `update.set` patches only the given keys — an explicit null deletes a key, " +
        '`x_` fields not named survive. An op introducing a `target` that matches no screen is refused, as is editing ' +
        'a state the screen does not declare. Pass `expect` so a stale index fails loudly instead of editing the wrong ' +
        'element. Writes the result back to the file (canonically formatted when format_output is true).',
      inputSchema: {
        file: z.string().describe('Path to the MAIAS document'),
        screen_id: z.string().describe('Screen whose elements are edited'),
        ops: z
          .array(
            z.object({
              op: z.enum(['insert', 'update', 'remove', 'move']),
              state: z.enum(['empty', 'loading', 'error']).optional().describe('Edit this state’s elements list instead of the default one'),
              index: z.number().int().min(0).describe('0-based position in the list as left by the previous ops'),
              to: z.number().int().min(0).optional().describe('move: final index of the element'),
              element: z.record(z.string(), z.unknown()).optional().describe('insert: element object per the spec (label, type, target, presentation, x_*)'),
              set: z.record(z.string(), z.unknown().nullable()).optional().describe('update: keys to write; null deletes a key; absent keys are untouched'),
              expect: z
                .object({ type: z.string().optional(), label: z.string().optional() })
                .optional()
                .describe('Guard: refuse unless the addressed element matches'),
            }),
          )
          .min(1)
          .describe('Operations, applied in order, all-or-nothing'),
        format_output: z.boolean().optional().describe('Write canonical form (default true)'),
      },
    },
    async ({ file, screen_id, ops, format_output }) => {
      try {
        const parsed = load(file);
        const result = editElements(parsed, screen_id, ops as unknown as ElementOp[]);
        if (!result.ok) return fail(result.reason ?? 'edit refused');

        const output = format_output === false ? parsed.toString() : format(parsed);
        const validation = validate(output);
        writeFileSync(file, output);
        return ok({
          file,
          operation: 'edit_elements',
          screen_id,
          changes: result.changes,
          valid_after_edit: validation.valid,
          diagnostics: validation.diagnostics.filter((d) => d.severity === 'error'),
        });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  );

  return server;
}
