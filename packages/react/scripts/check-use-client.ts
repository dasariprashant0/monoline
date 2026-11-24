// React Server Components have no createContext, useContext, useState and friends (`useId` and `forwardRef` are fine).
// A component file that uses one without a 'use client' directive crashes when a Server Component imports it.
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = new URL('../src/components/', import.meta.url).pathname;
const CLIENT_ONLY = /\b(useState|useEffect|useLayoutEffect|useRef|useContext|createContext|useReducer|useCallback|useMemo|useSyncExternalStore|useImperativeHandle|useFieldControl)\b/;
const COMMENTS = /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm;
const missing = [];
for (const dir of readdirSync(root)) {
  for (const file of readdirSync(join(root, dir))) {
    if (!/\.tsx?$/.test(file) || /\.(test|demo)\./.test(file) || file === 'index.ts') continue;
    const src = readFileSync(join(root, dir, file), 'utf8');
    if (CLIENT_ONLY.test(src.replace(COMMENTS, '')) && !/^\s*(['"])use client\1/.test(src)) missing.push(`${dir}/${file}`);
  }
}
if (missing.length) { console.error(`check-use-client: these files need a 'use client' directive:\n  ${missing.join('\n  ')}`); process.exit(1); }
console.log("check-use-client: every component file that uses client-only React APIs has 'use client'");
