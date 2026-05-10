# ADR-0014: DOM API over innerHTML for Dynamic Content

## Status

Accepted

## Context

`src/ui.js` currently builds dynamic content by assigning template literals to `element.innerHTML`. This pattern is used in several places: constructing the task input row in `addTask()` (line 18), the complexity warning message in `showComplexityWarning()` (line 70), and the full results display in `displayResults()` (line 295).

The application accepts user-supplied data at multiple points: task names and numeric parameters are entered via form inputs, and task configurations can be imported from arbitrary CSV files. While simulation results are derived values (numbers produced by the engine), the boundary between "safe computed value" and "user-supplied string" is easy to blur as the codebase grows. A task name, for example, is a free-text string that flows directly from user or CSV input. If a task name ever reaches an `innerHTML` assignment — whether directly or via a data structure — it becomes an XSS vector.

The risk is structural: `innerHTML` with template literals is unsafe whenever the interpolated values include any string that originates from outside the application. Because the pattern looks identical whether the value is safe or not, reviewers cannot judge safety by inspection alone. Each usage requires tracing every interpolated expression back to its source.

Current usages in context:

- `addTask()` line 18: static HTML template, no interpolation — currently safe, but establishes the pattern.
- `showComplexityWarning()` line 70: interpolates `opsM`, a `Number.toFixed()` result — currently safe, but inline `onclick` attribute also bypasses CSP.
- `displayResults()` line 295: interpolates multiple `data.*` fields derived from simulation output — currently safe, but the same template structure could propagate a task name through `data` in a future change.

## Decision

Dynamic HTML content must be created using the DOM API (`createElement`, `createTextNode`, `appendChild`, `textContent`, `setAttribute`, etc.) rather than by assigning template literals or concatenated strings to `innerHTML` or `outerHTML`.

Rules:

1. **`innerHTML` must not be used with any interpolated value.** Assigning a plain string literal with no `${}` expressions is the only permitted exception (e.g. clearing: `element.innerHTML = ''`).
2. **Event handlers must be attached via `addEventListener`.** Inline `onclick` attributes in template literals bypass Content Security Policy and mix markup with behaviour.
3. **User-supplied strings must be set via `textContent`.** Setting `.textContent` on an element is always safe regardless of string content — the browser never interprets it as markup.

## Rationale

### innerHTML with interpolation is structurally unsafe

The browser parses the entire string passed to `innerHTML` as HTML. Any `<`, `>`, `"`, `'`, or `&` character in an interpolated value can break out of the intended context and introduce executable content. Correct escaping requires explicit effort on every interpolation; a single omission is a vulnerability. The DOM API avoids the problem entirely: `textContent` treats its argument as a plain string; there is nothing to escape and no parse step.

### The risk scales with codebase growth

At present, no user-supplied string reaches an `innerHTML` assignment. That is a property of the current call graph, not a property of the pattern. As features are added — richer results, task summaries, named scenarios — the likelihood of a user string flowing into a template literal grows. Prohibiting the pattern now costs less than auditing every future change for XSS exposure.

### DOM API code is more maintainable

Template literals that construct HTML are opaque: the structure is only visible at runtime, attributes are strings prone to typos, and dynamic behaviour requires parsing the rendered output or tracing strings. DOM API code makes structure explicit and keeps each concern (element creation, content, attributes, events) in a separate, testable expression.

### Consistency with the threat model in ADR-0013

ADR-0013 identifies XSS via CSV import as a realistic vulnerability surface. Prohibiting `innerHTML` with interpolation is the structural control that prevents this class of vulnerability, complementing the coordinated disclosure process that ADR-0013 establishes.

## Consequences

### Positive

- User-supplied strings cannot cause XSS regardless of their content — the DOM API never interprets them as markup.
- Reviewers can identify unsafe DOM manipulation by a single rule (`innerHTML` with `${}`) without tracing data flow.
- Inline `onclick` attributes are eliminated, enabling a stricter Content Security Policy in future.
- New contributors cannot accidentally introduce XSS by following existing examples.

### Negative

- Existing `innerHTML` usages in `src/ui.js` (lines 18, 70, 295) must be migrated to the DOM API. The `displayResults()` block at line 295 is substantial and will require meaningful refactoring effort.
- DOM API code for complex structures is more verbose than equivalent template literals. Introducing helper utilities (e.g. a small `createElement` wrapper) may be warranted to manage the verbosity.

## Alternatives Considered

### Alternative 1: Escape interpolated values before insertion

Use an HTML-escaping utility on every interpolated expression before assigning to `innerHTML`.

**Rejected because**: this requires correct application on every interpolation in every template — a per-usage discipline rather than a structural guarantee. A single missed escape re-opens the vulnerability. The DOM API makes the safe path the default path.

### Alternative 2: Trusted Types API

Use the browser's Trusted Types API to enforce that only explicitly constructed `TrustedHTML` objects can be assigned to `innerHTML`.

**Rejected because**: Trusted Types requires a Content Security Policy header, which this application cannot deliver as a file served without a web server. It is also not yet universally supported. It could complement the DOM API approach in a future deployment context but cannot replace it here.

### Alternative 3: DOMParser / document fragment from string

Parse template literals into a `DocumentFragment` via `DOMParser` and insert the fragment.

**Rejected because**: parsing user-supplied strings through `DOMParser` retains the same XSS risk as `innerHTML` — the parser executes any markup in the input. It solves nothing.

### Alternative 4: Sanitize strings with DOMPurify

Load a sanitization library and pass all `innerHTML` assignments through it.

**Rejected because**: sanitization is defence-in-depth, not a primary control. It introduces a CDN dependency (inconsistent with ADR-0005's bar for new dependencies) and relies on the sanitizer being correctly applied everywhere. The DOM API removes the attack surface; sanitization only reduces it.

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: Node.textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
- [MDN: Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [ADR-0013: Security Policy and Vulnerability Disclosure Process](./0013-security-policy.md) — threat model that identifies XSS as a realistic risk
- [ADR-0005: Dependency Decision Policy](./0005-dependency-decision-policy.md) — bar for new CDN dependencies
