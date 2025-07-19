# Contributing to Monte Carlo Capacity Planning Tool

Thank you for your interest in contributing to this project! This document provides guidelines for contributing to the codebase.

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor or IDE
- Node.js (for development tools)
- Python 3.6+ (for pre-commit hooks)

### Development Setup

1. Fork the repository
2. Clone your fork locally
3. Install pre-commit hooks (if not already installed on your system):

   ```bash
   pip install pre-commit
   pre-commit install
   ```

   For more information about pre-commit, see the [official documentation](https://pre-commit.com/).

4. Open `web/index.html` in your browser to test the application
5. Make your changes
6. Test thoroughly across different browsers

### Pre-commit Hooks

This repository uses pre-commit hooks to maintain code quality and security. The hooks will run automatically when you commit and check for:

- Hardcoded secrets and sensitive data
- JSON and YAML syntax
- Merge conflicts
- Private key exposure
- File formatting (end of lines, trailing whitespace)

If hooks fail, fix the issues and commit again. The hooks help maintain consistent code quality and prevent security issues.

**Note**: You only need to install pre-commit once per development environment. Once installed, it will work across all repositories that use pre-commit.

## Development Workflow

### Making Changes

1. **Single File Architecture**: All application code is in `web/index.html`
2. **Edit directly**: Make changes to the HTML, CSS, and JavaScript within the file
3. **Test immediately**: Refresh the browser to see changes
4. **Validate**: Run `npx html-validate web/index.html` to check markup

### Code Style

- **HTML**: Use semantic HTML5 elements
- **CSS**: Follow BEM methodology for class naming
- **JavaScript**: Use ES6+ features, prefer `const`/`let` over `var`
- **Comments**: Add comments for complex statistical calculations
- **Formatting**: Use consistent indentation (2 spaces)

### Security Guidelines

Before contributing, ensure your changes:

- **Validate all inputs**: Sanitize user data and CSV content
- **Avoid `innerHTML` with user data**: Use safe DOM manipulation
- **No `eval()` or similar**: Avoid dynamic code execution
- **Secure defaults**: Fail safely when errors occur
- **Review dependencies**: Only add trusted external libraries
- **No hardcoded secrets**: Pre-commit hooks will catch these

## Testing

### Manual Testing Checklist

- [ ] Application loads without errors
- [ ] All simulation features work correctly
- [ ] CSV import/export functionality works
- [ ] Results display properly with charts
- [ ] No console errors or warnings
- [ ] Responsive design works on different screen sizes
- [ ] Pre-commit hooks pass successfully

### Browser Compatibility

Test your changes in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Security Testing

- [ ] Test with malicious CSV content
- [ ] Verify no sensitive data in browser console
- [ ] Check for XSS vulnerabilities
- [ ] Validate input sanitization
- [ ] Pre-commit hooks detect no security issues

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes**: Follow the guidelines above
3. **Test thoroughly**: Complete the testing checklist
4. **Ensure hooks pass**: Commit should pass all pre-commit checks
5. **Commit with clear messages**: Use conventional commit format
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a pull request**: Include description of changes and testing done

### Commit Message Format

```text
type(scope): description

- Detailed explanation of changes
- Why the change was made
- Any breaking changes or migration notes
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Requirements

- [ ] Changes are tested across multiple browsers
- [ ] Code follows established style guidelines
- [ ] Pre-commit hooks pass without errors
- [ ] Security considerations have been reviewed
- [ ] Documentation is updated if needed
- [ ] No breaking changes (or clearly documented)
- [ ] HTML validation passes

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing functionality
- Fixing security issues
- Modifying file formats or data structures

### Documentation Types

- **Feature docs**: Add to `docs/features/` for significant new features
- **ADRs**: Create in `docs/adr/` for architectural decisions
- **README**: Update for user-facing changes
- **Security**: Update `docs/development/SECURITY.md` for security-related changes

## Security Considerations

### Reporting Security Issues

- **Do not** open public issues for security vulnerabilities
- Follow the process outlined in `docs/development/SECURITY.md`
- Contact maintainers privately for security concerns

### Security Review Process

All contributions undergo security review focusing on:

- Input validation and sanitization
- Output encoding
- Client-side data handling
- External dependency security
- Attack surface analysis
- Pre-commit hook security checks

## Getting Help

### Resources

- **Documentation**: Check `docs/` directory for detailed information
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Pre-commit**: See [pre-commit.com](https://pre-commit.com/) for hook documentation

### Contact

- Open an issue for bugs or feature requests
- Use discussions for general questions
- Email maintainers for security concerns (see SECURITY.md)

## Recognition

Contributors will be recognized in:

- Git commit history
- Release notes for significant contributions
- README acknowledgments for major features

Thank you for contributing to the security and functionality of this project!
