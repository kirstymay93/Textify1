# Contributing to Textify1

Thank you for your interest in contributing to Textify1! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Development Setup

1. Fork and clone the repository
   ```bash
   git clone https://github.com/YOUR-USERNAME/Textify1.git
   cd Textify1
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Start development server
   ```bash
   npm run dev
   ```

## Branching Strategy

We follow Git Flow:

- **`main`** - Production-ready code (stable releases)
- **`develop`** - Integration branch for features
- **`feature/*`** - Feature development branches
- **`fix/*`** - Bug fix branches
- **`docs/*`** - Documentation updates

## Making Changes

### Before You Start

1. Create an issue for the feature/bug (if not already exists)
2. Comment on the issue to claim it
3. Create a branch from the appropriate base branch

### Code Standards

- **TypeScript**: Use strict mode, no `any` types
- **React**: Follow modern hooks patterns
- **Styling**: Use Tailwind CSS classes
- **Naming**: Use descriptive, camelCase names
- **Comments**: Document complex logic

### Commit Messages

Follow conventional commits:

```
type(scope): description

feat: Add layer sidebar component
fix: Correct pixel coordinate calculation
docs: Update README with installation steps
refactor: Simplify layer state management
test: Add tests for render engine
style: Format code with prettier
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `chore`

## Pull Request Process

1. **Update your branch** with latest develop
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Run local tests**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

3. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Link to related issues
   - Describe changes clearly
   - Include screenshots for UI changes
   - Request reviews from maintainers

5. **Address Review Comments**
   - Make requested changes
   - Push updates to the same branch
   - Don't force push unless asked

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test responsive design (mobile, tablet, desktop)

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Performance Considerations

Textify supports 100+ layers. When making changes:

1. Profile performance with DevTools
2. Avoid unnecessary re-renders
3. Use React.memo for expensive components
4. Monitor bundle size
5. Test with large layer counts

## Documentation

- Update README for user-facing changes
- Add JSDoc comments for exported functions
- Keep architecture documentation updated
- Document API changes

## Release Process

1. Maintainers merge PRs to `develop`
2. Create release branch: `release/vX.Y.Z`
3. Update version numbers and CHANGELOG
4. Merge to `main` and tag release
5. Merge back to `develop`

## Questions?

- Create a GitHub issue for bugs/features
- Check existing issues before opening new ones
- Join our community discussions

## License

By contributing, you agree your code is licensed under the project's license.

Thank you for contributing to Textify1! 🎉
