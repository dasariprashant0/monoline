// Shared by the build and check scripts. Tokens (the model, validation, contrast maths, the generated CSS) live in
// packages/tokens: src/tokens.ts is the source, scripts/lib.ts reads it.
import {readFileSync} from 'node:fs';

export const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
