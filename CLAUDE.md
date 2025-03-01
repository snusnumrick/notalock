# Notalock Development Guide

## Commands
- Build: `npm run build`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint` (fix with `npm run lint:fix`)
- Tests: `npm test` (all) or `npx vitest path/to/test.test.tsx` (single file) or `npx vitest -t "test name"` (specific test)
- Test UI: `npm run test:ui`
- Test coverage: `npm run test:coverage`

## Code Style
- TypeScript with strict typing and defined interfaces for all props
- React Hooks follow dependency array best practices
- Use Remix patterns: loaders for data, actions for mutations
- Components: Shadcn/UI with Tailwind CSS
- Imports ordered: React/Remix, third-party, project modules, relative
- Error handling: Use Response throws with appropriate status codes in loaders/actions
- See more at [Development Guidelines](./docs/development/guidelines.md)

## Project Structure
- Features organized by domain (products, categories) with components, api, services
- Route modules delegate to feature API functions
- Test files in `__tests__` directories beside implementation
- Form handling with React Hook Form + Zod validation
- Auth with Supabase - session managed at loader level, passed to components
- Cursor-based pagination with explicit sort orders
- See more at [Code Organization](./docs/development/code-organization.md)

## Testing
- Component tests use mock loaders and service functions
- Error tests verify both status and user-facing messages
- See more at [Testing Guidelines](./docs/development/testing.md)