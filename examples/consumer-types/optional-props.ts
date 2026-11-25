// Type-only consumer check, compiled against packages/react/dist/*.d.ts with exactOptionalPropertyTypes on
// (examples/tsconfig.base.json). It fails if an optional prop of any exported component rejects an explicit
// `undefined`, which would break consumers that forward their own optional props. See ADR 0009.
import type * as Monoline from '@monoline/react';
import type {JSXElementConstructor} from 'react';

/** Optional keys of T whose type, under exactOptionalPropertyTypes, does not accept `undefined`. */
type RejectsUndefined<T> = {[K in keyof T]-?: {} extends Pick<T, K> ? (undefined extends Required<T>[K] ? never : K) : never}[keyof T];
// Components only: PascalCase exports (hooks and helpers such as `sanitizeHtml` are plain functions).
type PerExport = {[N in keyof typeof Monoline]: N extends Capitalize<N> ? ((typeof Monoline)[N] extends JSXElementConstructor<infer P> ? RejectsUndefined<P> : never) : never};
// ThemeProvider spreads its look props over the defaults (`{...DEFAULTS, ...initial}`), so an explicit `undefined`
// would replace a default at runtime; its types keep rejecting it until the runtime ignores undefined (ADR 0009).
type Exempt = 'ThemeProvider';
type Offenders = {[N in Exclude<keyof PerExport, Exempt> as [PerExport[N]] extends [never] ? never : N]: PerExport[N]};

// `{}` only fits when Offenders has no keys; otherwise the error names each component and prop.
export const none: Offenders = {};
