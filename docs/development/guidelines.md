# Development Guidelines

## Core Development Principles

### Middleware-First Approach
The project follows a middleware-first approach for common functionality:

1. Authentication & Authorization
   - Use `requireAuth` for protected routes
   - Use `requireAdmin` for admin routes
   - Implement role-based access control

2. Error Handling
   - Wrap routes with `withErrorHandler`
   - Use `AppError` for custom errors
   - Implement proper error boundaries

3. Image Processing
   - Use `processImage` for uploads
   - Follow optimization guidelines
   - Handle image storage properly

4. Supabase Integration
   - Use `createSupabaseClient` consistently
   - Handle response headers properly
   - Follow database access patterns

## Code Quality Tools

### TypeScript
- Strict mode enabled
- Custom path aliases configured (`~/*` maps to `./app/*`)
- Enhanced type checking with additional compiler options
- Proper type definitions for all middleware

### ESLint
- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Additional rules for middleware usage
- Configured with recommended Remix settings

### Prettier
- Auto-formatting on commit
- 100 character line width
- Single quotes
- 2 space indentation

### Git Hooks (Husky)
- Pre-commit hooks for linting and formatting
- Type checking before commit
- Automated tests for critical paths
- Runs automatically on `git commit`

## Development Best Practices

### Route Implementation
1. Structure
   - Follow feature-based organization
   - Use proper type annotations
   - Keep components focused
   - Follow response patterns

2. Error Handling (see [Error Handling Guidelines](./error-handling.md))
   - Use try/catch in loaders/actions
   - Implement route error boundaries
   - Log errors appropriately
   - Handle redirects correctly

2. Authentication
   - Always use auth middleware
   - Handle user roles properly
   - Implement proper redirects
   - Secure sensitive routes

3. Data Handling
   - Validate input data
   - Handle edge cases
   - Implement proper error responses
   - Follow database patterns

4. Response Format
   - Consistent error format
   - Proper status codes
   - Handle headers correctly
   - Follow REST conventions

### Component Development
1. Structure
   - Keep components focused
   - Use TypeScript types
   - Implement error boundaries
   - Follow component patterns

2. State Management
   - Use appropriate hooks
   - Handle loading states
   - Implement error states
   - Follow state patterns

3. Performance
   - Implement memoization
   - Use lazy loading
   - Optimize renders
   - Monitor bundle size

### Testing Strategy
1. Unit Tests
   - Test middleware functions
   - Test utility functions
   - Test hooks
   - Mock external services

2. Integration Tests
   - Test route handlers
   - Test authentication flow
   - Test error handling
   - Test form submissions

3. End-to-End Tests
   - Test critical paths
   - Test user flows
   - Test error scenarios
   - Test performance

### Security Practices
1. Input Validation
   - Validate all user input
   - Sanitize data
   - Handle edge cases
   - Follow security patterns

2. Authentication
   - Use middleware consistently
   - Implement proper sessions
   - Handle role-based access
   - Secure sensitive routes

3. Data Protection
   - Use prepared statements
   - Implement RLS policies
   - Handle sensitive data
   - Regular security audits

## Development Workflow

### Branch Strategy
1. Feature Branches
   - Branch from `develop`
   - Follow naming convention
   - Keep changes focused
   - Regular updates from base

2. Pull Requests
   - Use PR template
   - Require reviews
   - Pass all checks
   - Clear description

### Commit Guidelines
1. Structure
   - Use conventional commits
   - Clear messages
   - Reference issues
   - Atomic commits

2. Quality Checks
   - Run tests
   - Check types
   - Run linting
   - Verify builds

### Code Review Process
1. Review Checklist
   - Check middleware usage
   - Verify error handling
   - Review security
   - Test coverage

2. Documentation
   - Update docs
   - Clear comments
   - API documentation
   - Update guidelines

### Deployment Process
1. Environment Setup
   - Configure variables
   - Verify services
   - Check permissions
   - Test connections

2. Deployment Steps
   - Run checks
   - Build assets
   - Deploy services
   - Verify deployment

3. Monitoring
   - Check logs
   - Monitor performance
   - Track errors
   - User feedback