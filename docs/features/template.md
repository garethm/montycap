# Feature: [Feature Name]

<!--
FRAMING GUIDE

These documents are specifications, not retrospective documentation. Write them
as forward-looking declarations of what the feature must do, not descriptions of
what the current implementation does.

Language:
- Use "must" for requirements: "Task names must be passed through sanitisation before export"
- Use declarative present tense for facts about the model: "Each task row contains nine elements"
- Avoid "is/are/does" when describing implementation behaviour — that framing documents the past
- Do not reference function names, variable names, or line numbers unless this is a
  technical feature (testing infrastructure, build tooling, security controls). For
  user-facing features, describe behaviour and intent.

Mandatory sections:
- Every section in this template must appear in every document, including sections
  that do not apply. When a section does not apply, include it with a brief
  explanation of why — for example: "This feature performs no DOM rendering and
  introduces no outbound data vectors." Omitting a section signals that it was
  forgotten, not considered.

Implementation Details section:
- Include it only for technical features (e.g. property-based tests, build pipeline,
  security tooling) where knowing the code structure is part of the specification
- Omit it for user-facing features — the feature documents what the product must do,
  not how it must be built
-->

## Overview

Brief description of what this feature does and why it exists.

## User Story

As a [user type], I want [functionality] so that [benefit/goal].

## Functionality

### Core Features

- Feature requirement 1
- Feature requirement 2
- Feature requirement 3

### User Interface

Describe the UI elements and interactions this feature requires. For features with a
visual layout, an ASCII diagram is appropriate to show structure and relative position
of elements. If the feature has no UI, state that and explain why.

### Data Flow

Explain how data must move through the system for this feature.

## Security Considerations

### Attack Surface

#### Inbound Data Vectors
- **User inputs**: Form fields, file uploads, URL parameters
- **File content**: CSV data, configuration files
- **External resources**: CDN scripts, external APIs
- **Browser APIs**: LocalStorage, SessionStorage, IndexedDB

#### Outbound Data Vectors
- **Network requests**: API calls, CDN requests, analytics
- **File downloads**: Generated CSV files, reports
- **Browser storage**: Data persisted locally
- **Console/logs**: Debug information, error messages
- **Clipboard**: Copy/paste operations
- **Print/export**: Screen content, generated documents

#### Trust Boundaries
- **Browser to application**: User-provided data entry points
- **Application to browser**: Data displayed to user
- **Application to external services**: CDN, analytics, external APIs
- **Application to local storage**: Persistent data handling

### Threat Model

- **Threat 1**: [Description] → Mitigation: [How it must be addressed]
- **Threat 2**: [Description] → Mitigation: [How it must be addressed]

Common threats to consider:
- **Data injection**: Malicious data in CSV files, user inputs
- **XSS**: Cross-site scripting through dynamic content
- **Data exfiltration**: Unintended data exposure via downloads/storage
- **Information disclosure**: Sensitive data in logs, exports, or storage
- **Client-side tampering**: Modified JavaScript execution
- **Supply chain**: CDN/external dependency risks
- **Data leakage**: Unintended data in outbound requests or files

### Security Controls

- Input validation requirements
- Output encoding/escaping requirements
- Content Security Policy considerations
- Safe defaults and fail-secure behaviours
- Data sanitisation for outbound flows

<!--
IMPLEMENTATION DETAILS — include this section only for technical features.
Remove it for user-facing features.

## Implementation Details

### Key Components

- **Component 1**: Description of its role
- **Component 2**: Description of its role

### Code Location

- Primary implementation: `src/` — describe the relevant file and area
- Related files: list other files involved

### Dependencies

- External libraries used
- Internal components depended upon
-->

## Configuration

Any named constants or configuration values that govern this feature's behaviour.

## Usage Examples

### Basic Usage

```text
Step-by-step example of basic usage
```

### Advanced Usage

```text
Example of a more complex usage scenario
```

## Validation & Error Handling

- Input validation rules
- Error conditions and how they must be handled
- User feedback requirements
- Security-related error handling
- Outbound data validation

## Testing

### Test Cases

- Test case 1: Expected behaviour
- Test case 2: Edge case handling
- Test case 3: Error condition
- **Security test cases**: Malicious input, boundary conditions, injection attempts
- **Data flow security**: Verify no sensitive data in outbound channels

### Manual Testing Steps

1. Step 1
2. Step 2
3. Expected result
4. Security verification steps
5. Outbound data inspection

## Performance Considerations

- Performance characteristics
- Resource usage
- Optimisation requirements
- DoS protection mechanisms

## Known Limitations

- Limitation 1 and workaround
- Limitation 2 and workaround
- Security limitations and risk acceptance

## Future Enhancements

- Potential improvement 1
- Potential improvement 2
- Security enhancements under consideration

## Related Documentation

- [Related Feature](./related-feature.md)
- [ADR-XXXX](../adr/xxxx-decision-title.md)
- [Security Policy](../development/SECURITY.md)
