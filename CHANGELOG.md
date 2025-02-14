# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Enhanced Login Page Error Handling
  - Replaced 401 error page redirect with inline error messages
  - Implemented Remix's ErrorBoundary pattern for better error handling
  - Added field-level validation with specific error messages
  - Added loading states during form submission
  - Improved form accessibility and user feedback
  - Better error message presentation using shadcn/ui Alert component

### Added
- Comprehensive Error Handling System
  - Added root-level ErrorBoundary for global error catching
  - Implemented specialized admin ErrorBoundary for admin section
  - Proper error status code and message handling
  - Styled error pages matching application design
  - Integrated with Remix's error boundary system
  - Full error hierarchy support for nested routes
  - Enhanced UX with clear error messages and recovery actions

### Added
- Featured Products Section
  - Added new FeaturedProducts component for homepage
  - Implemented product card design with hover effects
  - Added loading states with skeleton animation
  - Integrated with Supabase for featured products data
  - Added multi-category display with badges
  - Responsive grid layout (1/2/4 columns)
  - Added proper error handling
  - Euro currency formatting for prices

### Changed
- Improved product-category relationship implementation
  - Updated database schema to support many-to-many relationships
  - Added proper foreign key constraints
  - Enhanced category display in product management
  - Added null handling for product prices and stock
  - Updated type definitions for better null safety
  - Refactored product management components

### Added
- Bulk Operations for Categories
  - Added multi-select functionality in category management
  - Implemented bulk delete operations
  - Added bulk visibility toggle feature
  - Created confirmation dialogs for bulk actions
  - Implemented error handling for bulk operations
  - Added undo functionality for bulk actions
- Category-Product Relations
  - Implemented many-to-many relationship between categories and products
  - Added database migrations for category_products junction table
  - Created API endpoints for managing product categories
  - Added UI components for assigning products to categories
  - Implemented bulk category assignment functionality
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