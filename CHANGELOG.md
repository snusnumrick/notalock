# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Category Tree Visualization
  - New CategoryTreeView component with expand/collapse functionality
  - Interactive folder icons and visibility indicators
  - Split view layout with tree and list views
  - Mobile-friendly tab interface
  - Enhanced category selection and editing
  - Comprehensive test coverage for tree functionality
- Drag-and-drop reordering functionality for categories
  - New DraggableCategoryList component
  - New SortableCategoryItem component
  - Integration with @dnd-kit library
  - Visual feedback during drag operations
  - Optimistic updates with error recovery
  - Server-side position updates
- New test suites for tree view and drag-and-drop functionality
- Added @dnd-kit dependencies to the project

### Changed
- Updated CategoryManagement to use new split view layout
- Enhanced category visualization with hierarchical tree structure
- Improved category ordering UX with drag handles and visual feedback
- Updated project documentation to reflect new category management features
- Added comprehensive test coverage for new components

### Dependencies
- Added @dnd-kit/core ^6.1.0
- Added @dnd-kit/sortable ^8.0.0
- Added @dnd-kit/utilities ^3.2.2