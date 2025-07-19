# Security Policy

## Supported Versions

This project is a client-side web application. Security updates are applied to the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Security Considerations

### Data Privacy
- **All data processing occurs locally** in your browser - no data is transmitted to external servers
- Task configurations and simulation results are stored only in your browser's local storage
- CSV files are processed entirely client-side using the HTML5 File API

### Browser Security
- Uses standard web APIs (FileReader, Canvas, localStorage)
- **External Dependency**: Loads Chart.js from `cdnjs.cloudflare.com` CDN

### Input Validation
- Numeric inputs are validated and sanitized
- CSV file parsing includes error handling for malformed data
- File upload is restricted to text/CSV content only

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately:

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Send an email to the project maintainer with:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Suggested fix (if applicable)

### Response Timeline
- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days with preliminary assessment
- **Resolution**: Security fixes will be prioritized and released as soon as possible

## Security Best Practices for Users

When using this tool:

1. **Data Sensitivity**: Be cautious when uploading CSV files containing sensitive project information
2. **Browser Security**: Keep your browser updated to the latest version
3. **Local Storage**: Clear browser data if using on shared computers
4. **File Handling**: Only upload CSV files from trusted sources

## Known Limitations

- Client-side validation only - malicious CSV files could potentially cause browser issues
- No server-side security controls (by design - fully client-side application)
- Dependent on browser security model for isolation
- **CDN Dependency**: Relies on Chart.js from cdnjs.cloudflare.com - potential supply chain risk if CDN is compromised

## Security Updates

Security updates will be communicated through:
- GitHub releases with security advisory labels
- README updates highlighting security improvements
- Git commit messages clearly marked with security fixes
