# ADR: ESLint

ESLint is the JavaScript linter run against the application sources before commit and in CI.

## Decision

Use **ESLint** (pinned to exact version in `package.json`) to lint `src/simulation.js` and `src/ui.js` with `npx eslint src/simulation.js src/ui.js`, configured through the flat config file `eslint.config.mjs`.

It runs in two places:

- The `validate` script in `package.json`, invoked by the pre-commit application validation hook
- The CI workflow (`.github/workflows/ci.yml`)

### Current configuration

`eslint.config.mjs` sets `ecmaVersion: 2020`, `sourceType: 'module'`, and declares the browser and CDN globals the sources rely on. It does not extend any shared rule set and enables no individual rules, so ESLint currently acts as a **syntax check only**: it fails on parse errors and reports nothing else. The declared globals are inert, because no rule that consumes them (such as `no-undef`) is enabled.

### Recommended configuration

Adopt the following, in three layers:

1. **`@eslint/js` recommended rules** (`js.configs.recommended`) — ESLint's own baseline set of rules that detect likely bugs: `no-undef`, `no-unused-vars`, `no-redeclare`, `no-unreachable`, `no-dupe-keys`, `no-empty`, `no-self-assign`, `use-isnan`, `valid-typeof`, and others. These rules target defects rather than style, so they produce few false positives.
2. **Project-specific correctness and safety rules**, not included in the recommended set:
   - `eqeqeq` — require `===`/`!==`. The simulation code compares numeric form input, where `==` coercion can silently mask a string/number mismatch.
   - `no-eval`, `no-implied-eval`, `no-new-func` — the Content Security Policy already blocks string evaluation at runtime; these rules report it at lint time with a source location rather than as a runtime CSP violation in the browser console.
   - `no-restricted-syntax` selectors enforcing [dom-xss-prevention.md](../security/dom-xss-prevention.md): prohibit assigning anything other than a string literal to `innerHTML` or `outerHTML`, and prohibit `insertAdjacentHTML` and `document.write`.
3. **Complete global declarations** — add `Papa` (PapaParse, loaded from CDN) and `setTimeout`, which are used in `src/ui.js` but missing from the current globals list. Globals remain declared explicitly rather than imported from the `globals` package, keeping the list an accurate inventory of the browser and CDN surface the code depends on.

```js
import js from '@eslint/js';

const files = ['src/simulation.js', 'src/ui.js'];

export default [
    { ...js.configs.recommended, files },
    {
        files,
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                setTimeout: 'readonly',
                Chart: 'readonly',
                Papa: 'readonly',
                FileReader: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
            },
        },
        rules: {
            eqeqeq: 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-restricted-syntax': ['error',
                {
                    selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/][right.type!='Literal']",
                    message: 'innerHTML/outerHTML may only be assigned a string literal (see dom-xss-prevention ADR).',
                },
                {
                    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
                    message: 'insertAdjacentHTML parses markup (see dom-xss-prevention ADR).',
                },
                {
                    selector: "CallExpression[callee.object.name='document'][callee.property.name=/^write(ln)?$/]",
                    message: 'document.write parses markup (see dom-xss-prevention ADR).',
                },
            ],
        },
    },
];
```

This requires adding `@eslint/js` as a direct dev dependency, covered by this ADR (see [Supply Chain Implications](#supply-chain-implications)). The configuration change, the dependency addition, and fixes for the findings below should land together in a single change so the lint step never goes red on `main`.

### Expected findings on adoption

A trial run of the recommended configuration against the sources on 2026-11-10 (ESLint 10.14.0, `@eslint/js` 10.0.1) reported:

| Finding | Rule | Assessment |
|---|---|---|
| `Papa` not defined (2 occurrences) | `no-undef` | Missing global declaration; resolved by layer 3 |
| `setTimeout` not defined (2 occurrences) | `no-undef` | Missing global declaration; resolved by layer 3 |
| `chart` assigned but never used | `no-unused-vars` | Dead variable retained "for backward compatibility"; remove |
| `capacity` parameter of `createEffortChart` never used | `no-unused-vars` | The caller passes capacity but the effort histogram does not draw it; either render a capacity marker or drop the parameter |
| `addTask`, `loadFromFile`, `exportToFile` defined but never used | `no-unused-vars` | **Genuine defect, since fixed.** Referenced only from inline `onclick` attributes in `src/template.html`, which the Content Security Policy blocks, so these buttons did nothing in the deployed app. Fixed in [#190](https://github.com/garethm/montycap/pull/190) by wiring all static buttons with `addEventListener`; this finding no longer occurs once that change is merged |

No `eqeqeq`, eval, or DOM XSS violations were found; the codebase already complies with [dom-xss-prevention.md](../security/dom-xss-prevention.md). A probe file confirmed that each `no-restricted-syntax` selector fires on the prohibited pattern and that `element.innerHTML = ''` remains permitted.

## Rationale

**The de facto standard JavaScript linter.** ESLint has the broadest rule ecosystem, editor integration, and community knowledge of any JavaScript linter, so contributors are likely to already know it.

**Catches syntax errors before the build.** The build concatenates the sources into a single inline script; a syntax error in either file would break the whole application at load time. Linting the sources directly reports the error against the original file and line, rather than against the assembled `web/index.html`.

**The recommended set catches defects, not style.** The trial run found a production bug: the `no-unused-vars` findings for `addTask`, `loadFromFile`, and `exportToFile` led directly to the discovery that five buttons had been silently broken by the Content Security Policy since it was introduced. It also found dead code and an unused parameter that hints at an unrendered capacity marker. None of these is detectable by a syntax check. `no-undef` matters more than usual here: the build strips `import`/`export` and concatenates both files into one browser script, so every top-level name lives in a single shared global scope and a misspelled identifier fails only when its code path runs in the browser.

**Turns a policy into a check.** [dom-xss-prevention.md](../security/dom-xss-prevention.md) prohibits interpolated `innerHTML` and claims the benefit of "a single mechanical check" for reviewers, but nothing currently performs that check. The `no-restricted-syntax` selectors make it automatic in pre-commit and CI, so the policy holds as the codebase grows rather than relying on review vigilance.

**The globals list becomes an inventory.** With `no-undef` enabled, every browser API and CDN library the code touches must be declared, so the config documents the application's external runtime surface and an undeclared new dependency fails the lint step.

## Health Assessment

Assessed 2026-11-10 against the criteria in [dependency-policy.md](dependency-policy.md), consistent with the [2026-11-09 dependency review](../../development/dependency-reviews/2026-11-09.md). The assessment covers both `eslint` and `@eslint/js`, which are developed and released by the same team from the same repository.

| Criterion | Assessment |
|---|---|
| **Maintenance activity** | ✅ Actively maintained; frequent minor releases on the v10 line |
| **Security posture** | ✅ No known unresolved CVEs with CVSS ≥ 7.0 |
| **Issue responsiveness** | ✅ Dedicated core team with a structured triage process |
| **Download trend** | ✅ Very high and stable (~127M weekly downloads) |
| **Maintainer continuity** | ✅ OpenJS Foundation project with a multi-person core team and automated publishing |
| **Deprecation status** | ✅ Not deprecated; no recommended replacement |

## Supply Chain Implications

- **Type**: npm dev dependencies (`eslint`; `@eslint/js` once the recommended configuration is adopted)
- **Transitive dependencies**: `eslint` brings 75 packages per the lock file, the largest footprint of any dev dependency in the project (vitest: 22, html-validate: 12). `@eslint/js` has no dependencies of its own and declares `eslint` as a peer dependency, so it adds one package. Monitored by Dependabot
- **Versioning**: since v10, `@eslint/js` is versioned independently of `eslint` (`@eslint/js` 10.0.1 alongside `eslint` 10.14.0). Pin it to an exact version and upgrade it deliberately, since a new release can add rules to the recommended set and introduce new findings
- **Lifecycle scripts**: none; compatible with `npm ci --ignore-scripts`

## Consequences

### Benefits

- Syntax errors are caught locally before commit and in CI, against the original source location
- With the recommended configuration: undefined identifiers, dead code, and unused parameters are caught before they reach the browser
- The DOM XSS prevention policy is enforced mechanically rather than by review alone
- The globals list is an accurate inventory of the application's browser and CDN dependencies

### Risks

- **Until the recommended configuration is adopted, no lint rules are enforced.** README, CONTRIBUTING, and CLAUDE.md describe ESLint as linting without qualification, which currently overstates its coverage
- `no-restricted-syntax` matches syntax, not data flow: it catches `el.innerHTML = value` but not aliased forms such as `el['inner' + 'HTML'] = value`. It is a guard against the common pattern, not a substitute for review
- Upgrades to `@eslint/js` may enable new recommended rules; exact pinning and Dependabot PRs make such changes visible before they land

## Rejected Approaches

**Biome.** A fast, single-binary linter and formatter with no transitive npm dependencies. The most credible alternative should the transitive footprint become a concern, but it cannot express the project-specific `no-restricted-syntax` selectors as directly, and migrating would mean replacing the tool rather than configuring it.

**oxlint.** A fast Rust-based linter with ESLint-compatible rules. Narrower rule coverage and configuration ecosystem than ESLint.

**`eslint-plugin-no-unsanitized`.** Mozilla's plugin for detecting unsafe DOM sinks, with more thorough coverage than hand-written selectors. Not chosen because it adds a third-party dependency to enforce a rule that three `no-restricted-syntax` selectors cover adequately for a codebase of this size; reconsider if DOM-construction code grows substantially.

**The `globals` package.** Supplies predefined browser globals. Rejected because declaring the handful of globals explicitly avoids a dependency and keeps the list meaningful as an inventory, where a blanket `globals.browser` would admit any browser API without review.

**Stylistic rules.** Formatting and style rules are out of scope; the configuration targets defects and security properties only.

**`node --check` only.** Provides the same syntax checking ESLint currently delivers with no dependency, but forecloses adding lint rules without introducing a tool later.

**No linting.** Syntax errors would surface only after building and loading the application in a browser.

## References

- [dependency-policy.md](dependency-policy.md)
- [../security/dom-xss-prevention.md](../security/dom-xss-prevention.md)
- [../development/precommit.md](../development/precommit.md)
- [2026-11-09 dependency review](../../development/dependency-reviews/2026-11-09.md)
