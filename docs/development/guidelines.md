# Development Guidelines

## Code Quality Tools

The project uses several tools to ensure code quality and consistency:

### TypeScript
- Strict mode enabled
- Custom path aliases configured (`~/*` maps to `./app/*`)
- Enhanced type checking with additional compiler options

### ESLint
- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Configured with recommended Remix settings

### Prettier
- Auto-formatting on commit
- 100 character line width
- Single quotes
- 2 space indentation

### Git Hooks (Husky)
- Pre-commit hooks for linting and formatting
- Runs automatically on `git commit`

## Development Best Practices

### Code Structure
1. Keep components small and focused
2. Use TypeScript types for all props and state
3. Implement error boundaries where appropriate
4. Follow the feature-first organization pattern

### State Management
1. Use React Query for server state
2. Implement local state with useState/useReducer
3. Consider context for shared state
4. Keep state as close to usage as possible

### Performance
1. Implement proper memoization
2. Use lazy loading where appropriate
3. Optimize images and assets
4. Monitor and optimize bundle size

### Testing
1. Write unit tests for utilities
2. Implement integration tests for features
3. Use E2E tests for critical paths
4. Maintain good test coverage

### Security
1. Implement proper input validation
2. Use prepared statements for queries
3. Follow security best practices
4. Regular security audits

## Development Workflow

### Branch Strategy
1. Feature branches from `develop`
2. Pull requests for all changes
3. Code review required
4. Automated testing before merge

### Commit Guidelines
1. Use conventional commits
2. Keep commits focused
3. Write clear commit messages
4. Reference issues when applicable

### Code Review Process
1. Review all changes
2. Use pull request templates
3. Automated checks must pass
4. Document review decisions