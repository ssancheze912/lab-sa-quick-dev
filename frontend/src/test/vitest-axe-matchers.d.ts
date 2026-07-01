// vitest-axe@0.1.0 publishes a broken `.d.ts` for its `matchers` subpath: the
// `toHaveNoViolations` re-export is mis-tagged as type-only under
// `verbatimModuleSyntax`, even though the compiled JS (`dist/matchers.js`)
// exports it as a normal function. This local shim restates the real,
// verified runtime shape so `src/test/setup.ts` can import it as a value.
declare module 'vitest-axe/matchers' {
  export function toHaveNoViolations(results: unknown): {
    pass: boolean
    message: () => string
  }
}
