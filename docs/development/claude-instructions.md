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
- Never use placeholders in code comments like '[previous code stays the same]', 
  '[the rest of the code is unchanged]', or any variations - always show the complete code 
  or use `edit_file` for targeted changes

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

## Notes
- The project uses Remix.js, Supabase, and Square for payments
- Follow TypeScript conventions for type safety
- Maintain consistent documentation style
- When updating files, prefer targeted changes using `edit_file` over complete rewrites
- For React components, only use Tailwind's core utility classes (avoid arbitrary values)