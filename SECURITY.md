# Security Policy

## Supported Versions

This project is a single-file HTML application. Only the latest version on the main branch is supported.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

Please report vulnerabilities using GitHub's private vulnerability reporting:

- **GitHub security advisories**: https://github.com/garethm/montycap/security/advisories/new

Do **not** open a public GitHub issue for security vulnerabilities, as this exposes the vulnerability before a fix is available.

When reporting, please include:

1. A clear description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment

### Disclosure Timeline

We follow coordinated vulnerability disclosure practices:

- **Acknowledgment**: within 48 hours of receiving the report
- **Initial assessment**: within 7 days
- **Resolution target**: within 90 days of disclosure for standard vulnerabilities; critical vulnerabilities will be prioritised for faster resolution
- **Public disclosure**: we will coordinate public disclosure with the reporter, typically no later than 90 days after the vulnerability is reported

We will credit reporters in security advisories unless anonymity is requested.

## Security Considerations

This application:
- Runs entirely in the browser (client-side)
- Does not store data on servers
- Uses minimal external dependencies (only Chart.js CDN)
- Processes user-provided CSV files locally
- Does not transmit data over the network

### Potential Security Areas:
- CSV file parsing and validation
- Client-side data handling
- External CDN dependency (Chart.js)
- HTML/JavaScript security best practices
