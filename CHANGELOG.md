# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Customer-focused product filtering system
  - Implemented price range filter
  - Added category selection
  - Added in-stock only filter
  - Simple sorting options (Featured, Price Low/High, Newest)
  - Mobile-friendly filter interface with slide-out panel
  - Desktop sidebar filter layout
  - URL-based filter state management
  - Clear filters functionality

### Changed
- Enhanced product listing page
  - Separated admin and customer filter interfaces
  - Improved responsive design
  - Added default sorting by featured products
  - Optimized category filtering
  - Added loading states

### Added Database
- Added has_variants column to products table
  - Default value set to false
  - Added index for performance
  - Updated database documentation

### Changed
- Migrated to multiple product categories
  - Added product_categories junction table
  - Migrated existing category relationships
  - Removed single category_id column
  - Updated database documentation
  - Added proper RLS policies for product categories

### Added
- Product Listing Page
  - Product grid/list view with toggle functionality
  - Responsive product cards with hover effects
  - Price formatting in EUR
  - Image optimization with aspect ratio
  - Empty state handling

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