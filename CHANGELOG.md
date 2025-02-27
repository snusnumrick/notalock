# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Hero Banner Improvements:
  - Implemented banner image optimization for faster loading
  - Added support for banner images in Supabase bucket
  - Started development of banner image upload UI

- Error Handling Improvements:
  - Added useRetry hook with exponential backoff
  - Implemented retry mechanism for failed product loads
  - Added retry UI with attempt tracking and progress indicators
  - Added manual retry option for graceful error recovery
  - Added exponential backoff with configurable parameters
  - Added proper handling for authentication errors
  - Added comprehensive test coverage for retry logic

- Hero Banner Improvements:
    - Implemented banner image optimization for faster loading
    - Added support for banner images in Supabase bucket
    - Started development of banner image upload UI

- Error Handling Improvements:
  - Added useRetry hook with exponential backoff
  - Implemented retry mechanism for failed product loads
  - Added retry UI with attempt tracking and progress indicators
  - Added manual retry option for graceful error recovery
  - Added exponential backoff with configurable parameters
  - Added proper handling for authentication errors
  - Added comprehensive test coverage for retry logic

- Infinite Scroll Implementation for Product Listing
  - Added cursor-based pagination with Supabase
  - Implemented IntersectionObserver for scroll detection
  - Added loading skeleton components for smooth UX
  - Implemented scroll position restoration
  - Added request debouncing for performance
  - Added proper cleanup for unmounted components
  - Added scroll position memoization
  - Optimized database queries with proper indexing


### Added
- Product Detail Page Implementation
  - Created clean, responsive layout
  - Added product image gallery
  - Implemented product information display
  - Added loading states with skeleton animations
  - Added error handling for non-existent products
  - Comprehensive test coverage for components and route
  - Added "Add to Cart" button placeholder
- New Components
  - ProductInfo component for displaying product details
  - PageLayout component for consistent page structure
- Test Suite
  - Added route tests for products.$id.tsx
  - Added component tests for ProductInfo
  - Included loading state and error handling tests

### Changed
- Fixed product navigation using ID instead of SKU
- Improved loading state handling with useNavigation
- Enhanced error handling in product loader
- Updated development roadmap with new product detail features

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