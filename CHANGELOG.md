# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New Arrivals Section Implementation
  - Created reusable NewArrivals component for homepage and other sections
  - Implemented dedicated New Arrivals page with expanded product list
  - Added visual "New" badge for products less than 14 days old
  - Implemented responsive grid layout for all screen sizes
  - Added loading skeletons and error handling
  - Enhanced empty state design with informative messages
  - Added date display to show when products were added
  - Created comprehensive test suite for component
  - Made component customizable with configurable title, description, and limit

### Fixed
- Shopping Cart Persistence Bug
  - Fixed issue where cart changes made on the cart page weren't persisting when navigating to other pages
  - Resolved infinite refresh loop when navigating between cart and other pages
  - Improved cart state synchronization across the application
  - Added CartProvider to root layout for global cart state access
  - Optimized localStorage operations to prevent circular dependencies
  - Added comprehensive test suite to prevent regression
    - Unit tests for CartContext functionality
    - Edge case tests for error handling
    - Loop prevention tests
    - Integration tests for cart navigation

### Added
- Product Detail Page Enhancement - COMPLETED
  - Implemented full-featured product detail page
  - Added zoomable product image gallery with lightbox
  - Implemented swipe gestures for mobile image navigation
  - Added variant selection UI with grouped options display
  - Implemented "Add to Cart" functionality with cart API and service
  - Added related products section
  - Implemented comprehensive SEO with OpenGraph and structured data
  - Added breadcrumb navigation
  - Implemented loading skeletons for all components
  - Created responsive layout for all screen sizes
  - Added error boundaries with specific error states
  - Created complete test suite with 8 test files covering all components
  - Added accessibility features including keyboard navigation
  - Implemented image optimization with WebP format

### Added
- Footer Component Implementation
  - Created responsive footer with company information
  - Added navigation links for products, categories, and company pages
  - Implemented contact information section with email and phone links
  - Added social media links with accessible design
  - Included dynamic copyright year that updates automatically
  - Added conditional rendering to show footer only on customer-facing pages
  - Created comprehensive test suite for footer content and visibility
  - Made styling consistent with overall design system

### Added
- Server-Side Image Optimization
    - Added image optimization API endpoint at `/api/images/optimize`
    - Implemented server middleware with Sharp for high-quality image processing
    - Created `ServerImageOptimizer` for efficient server-side optimization
    - Added client-side fallback for reliability
    - Integrated with `ProductImageService` via `imageServiceProvider` utility
    - Added configuration system in `config/image-optimization.ts`
    - Added format auto-detection and WebP support
    - Implemented feature flags for controlling optimization method
    - Added integration tests for the optimization pipeline

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


### Changed
- Updated Product Detail Page Implementation to full-featured version
  - Enhanced product gallery with advanced features
  - Added variant selection capabilities
  - Implemented full cart integration
  - Added comprehensive SEO features
  - Implemented related products section
  - Enhanced testing suite with coverage for all components

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