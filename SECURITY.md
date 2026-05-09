# Security Policy

## Supported Versions

This project is a single-file HTML application. Only the latest version on the main branch is supported.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **Do NOT** open a public issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include a clear description of the vulnerability
4. Provide steps to reproduce if applicable
5. Include any potential impact assessment

### What to expect:
- Acknowledgment within 48 hours
- Initial assessment within 1 week
- Regular updates on progress
- Credit in security advisories (if desired)

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
