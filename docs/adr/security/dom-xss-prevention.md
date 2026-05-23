# ADR: DOM XSS Prevention

Dynamic HTML content is constructed using the DOM API rather than by assigning template literals or concatenated strings to `innerHTML`.

## Decision

1. **`innerHTML` must not be used with any interpolated value.** Assigning a plain string literal with no `${}` expressions is the only permitted exception (e.g. clearing: `element.innerHTML = ''`).
2. **User-supplied strings must be set via `textContent`.** The browser never interprets `textContent` as markup, regardless of the string's content.
3. **Event handlers must be attached via `addEventListener`.** Inline `onclick` attributes in template literals bypass Content Security Policy and mix markup with behaviour.

## Rationale

**`innerHTML` with interpolation is structurally unsafe.** The browser parses the entire string passed to `innerHTML` as HTML. Any `<`, `>`, `"`, `'`, or `&` in an interpolated value can break out of the intended context and introduce executable content. The DOM API avoids the problem entirely — `textContent` treats its argument as a plain string with no parse step.

**The risk scales with codebase growth.** At present, no user-supplied string reaches an `innerHTML` assignment. That is a property of the current call graph, not a property of the pattern. As features are added, the likelihood of a user-supplied string flowing into a template literal grows. Prohibiting the pattern now costs less than auditing every future change for XSS exposure.

**A single reviewable rule.** With `innerHTML` prohibited for interpolation, reviewers can identify unsafe DOM manipulation by a single mechanical check rather than tracing every interpolated expression back to its source.

## Consequences

### Benefits

- User-supplied strings cannot cause XSS regardless of their content — the DOM API never interprets them as markup
- New contributors cannot accidentally introduce XSS by following existing examples
- Inline `onclick` attributes are eliminated, enabling a stricter Content Security Policy

### Risks

- DOM API code for complex structures is more verbose than equivalent template literals; helper utilities may be warranted to manage verbosity in heavily dynamic sections

## Rejected Approaches

**Escaping interpolated values.** Requires correct application on every interpolation — a per-usage discipline rather than a structural guarantee. A single missed escape re-opens the vulnerability.

**Trusted Types API.** Would enforce that only explicitly constructed `TrustedHTML` objects can be assigned to `innerHTML`, but requires a Content Security Policy header that cannot be delivered by a file served without a web server. Not universally supported.

**DOMParser / document fragment from string.** Parsing template literals via `DOMParser` retains the same XSS risk as `innerHTML` — the parser executes any markup in the input.

**DOMPurify sanitisation.** Defence-in-depth, not a primary control. Introduces a CDN dependency and relies on correct application everywhere. The DOM API removes the attack surface; sanitisation only reduces it.

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [security-policy.md](security-policy.md)
