// stdio transport: newline-delimited JSON-RPC on stdin/stdout, logs on stderr.
import {StringDecoder} from 'node:string_decoder';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {createRegistry, resolveRegistry} from './registry.js';
import {createServer} from './server.js';

const HELP = `monoline-mcp: Model Context Protocol server for Monoline (stdio)

  monoline-mcp [--registry <dir|url>]

Registry: --registry, else MONOLINE_REGISTRY, else ./registry or the repo's registry/, else this version's registry on GitHub.
`;

export function serve({server, input = process.stdin, output = process.stdout}: {
  server: {handleLine(line: string): Promise<string | null>};
  input?: NodeJS.ReadableStream;
  output?: {write(s: string): unknown};
}): Promise<void> {
  const dec = new StringDecoder('utf8');
  let buf = '';
  let chain = Promise.resolve();
  const run = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    chain = chain.then(async () => {
      const res = await server.handleLine(line);
      if (res) output.write(res + '\n');
    });
  };
  input.on('data', (chunk: Buffer | string) => {
    buf += typeof chunk === 'string' ? chunk : dec.write(chunk);
    let i;
    while ((i = buf.indexOf('\n')) >= 0) { run(buf.slice(0, i)); buf = buf.slice(i + 1); }
  });
  input.on('end', () => { buf += dec.end(); run(buf); buf = ''; });
  return new Promise((resolve) => input.on('end', () => chain.then(resolve)));
}

export async function main(argv: string[]): Promise<void> {
  let o;
  try { o = parseArgs({args: argv, options: {registry: {type: 'string'}, help: {type: 'boolean', short: 'h'}}}).values; }
  catch (e) { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); }
  if (o.help) return void process.stdout.write(HELP);
  const {location, from} = resolveRegistry({flag: o.registry, pkgDir: dirname(fileURLToPath(import.meta.url))});
  // A ./registry in the working folder wins silently over the published one, so say so: it may be a stale copy.
  console.error(from === 'cwd'
    ? `monoline-mcp: using ./registry/index.json from the working directory (${location}); pass --registry to use another`
    : `monoline-mcp: registry ${location}`);
  await serve({server: createServer({registry: createRegistry({location})})});
}
