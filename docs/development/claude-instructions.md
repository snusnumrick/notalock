# Claude Instructions

These instructions help Claude understand and work with the Notalock project effectively.

## Project Information
- Project root: `/Users/antont/WebstormProjects/Notalock`
- README location: `/Users/antont/WebstormProjects/Notalock/README.md`

## File Operations
- Use `edit_file` for making specific changes to existing files
- Use `write_file` only when creating new files or completely rewriting existing ones
- Use `read_file` to view file contents
- Use `directory_tree` to understand project structure
- Use `list_directory` to see contents of specific folders

## Important Directories
- Source code: `/src`
- Documentation: `/docs`
- Tests: `/tests`
- Configuration files: `/` (root directory)

## Development Guidelines
- Follow existing code style and patterns
- Use TypeScript for new code
- Add appropriate documentation
- Update tests when modifying functionality

## Code and Documentation Completeness Rules
- Never use placeholder comments in code like:
  - '[previous code stays the same]'
  - '[rest of the code is unchanged]'
  - '// ... rest of the code'
  - '/* previous implementation */'
- Never use placeholder text in documentation like:
  - '[Previous section remains the same]'
  - '[Rest of content unchanged]'
  - '[See above section]'
  - '...'
  - 'etc.'
- Instead, always:
  - Show complete code when writing new files
  - Use `edit_file` for targeted changes to existing files
  - Include all relevant content when updating documentation
  - Copy and modify entire sections when needed
  - Be explicit about what is being changed or referenced

## Common Tasks
- To analyze code: Use the analysis tool with proper imports
- To create visualizations: Use React artifacts with Tailwind CSS (core utilities only)
- To modify documentation: Edit relevant markdown files
- To review code: Check specific files or directories as needed

## Best Practices
- Always check existing code before making changes
- Use step-by-step approach for complex changes
- Verify file paths before operations
- Consider impact on existing functionality
- When showing examples, include complete code
- When updating documentation, include full context

## Project Stack and Standards
- Built with Remix.js, Supabase, and Square for payments
- Use TypeScript for all new code
- Maintain consistent documentation style
- For React components:
  - Only use Tailwind's core utility classes
  - Never use arbitrary values (e.g., avoid h-[500px])
  - Follow component organization patterns
  - Include proper TypeScript types