# Contributing to Notalock

## Getting Started

### Prerequisites
- Node.js 18+
- NPM or Yarn
- Git
- Supabase CLI

### Setup
1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/notalock-store.git
```
3. Install dependencies:
```bash
npm install
```
4. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Component Structure
- Use functional components with hooks
- Implement proper error handling
- Add TypeScript interfaces for props
- Include JSDoc comments for complex functions

### Testing
- Write unit tests for utilities
- Add integration tests for components
- Test browser compatibility
- Verify mobile responsiveness

### Pull Request Process
1. Update documentation if needed
2. Add tests for new features
3. Ensure CI passes
4. Request review from maintainers
5. Address review feedback

## Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes

## Commit Messages
Follow conventional commits:
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

## Issue Guidelines
- Use issue templates
- Include steps to reproduce bugs
- Add screenshots if relevant
- Tag issues appropriately

## License
By contributing, you agree that your contributions will be licensed under the MIT License.