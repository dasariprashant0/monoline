// Type-only check, run by `npm run typecheck:scripts` (not by node --test): the reference check at the end of
// src/tokens.ts still fires. If it stopped firing, the @ts-expect-error below would be unused and tsc would fail.
import type {ReferenceCheck} from '../src/tokens.ts';

const good = {
  'tokens.css': [{selector: ':root', groups: [{tokens: {'--foreground': '#000', '--ink': 'var(--foreground)'}}]}],
} as const;
true satisfies ReferenceCheck<typeof good>;

const misspelt = {
  'tokens.css': [{selector: ':root', groups: [{tokens: {'--foreground': '#000', '--ink': 'var(--foregrund)'}}]}],
} as const;
// @ts-expect-error --foregrund is not declared
true satisfies ReferenceCheck<typeof misspelt>;
