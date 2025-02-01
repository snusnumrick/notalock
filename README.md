# Notalock - European Door Hardware Store

## Project Overview
Notalock is an e-commerce platform specializing in high-end European door hardware. We offer sophisticated products including:
- Premium locks and locking mechanisms
- Designer door handles and levers
- Heavy-duty hinges and pivot systems
- Pocket door rails and sliding systems
- Special opening systems (folding, invisible)

## Tech Stack
- Frontend: Remix.js with Tailwind CSS
- Backend: Supabase (Authentication, Database, Storage)
- Payments: Square (planned)
- Image Storage: Supabase Storage

## Latest Updates (As of Feb 1, 2025)

### Recently Completed
1. **Admin Product Management**
   - ✅ Basic CRUD interface for products
   - ✅ Product form with validation
   - ✅ Image upload capability
   - ✅ Role-based access control
   - ✅ Integration with Supabase Storage

### Known Issues
1. **UI/UX**
   - React hydration warnings in development (non-blocking)
   - Admin dashboard navigation needs styling improvements

2. **Authentication**
   - RLS policies need refinement for product management
   - Need better error handling for unauthorized actions

### Next Steps
1. **Immediate Priorities**
   - Fix RLS policies for product management
   - Complete image upload functionality
   - Add product variant management
   - Implement product categorization

2. **Short-term Goals**
   - Add product search and filtering
   - Implement product list pagination
   - Add product preview functionality
   - Enhance form validation and error handling

## Database Schema

### Core Tables
1. **profiles**
   - User profile management
   - Role-based access (customer, business, admin)
   - Default shipping and billing addresses
   - Business account information

2. **categories**
   - Hierarchical category structure
   - SEO-friendly slugs
   - Category ordering and visibility control
   - Row Level Security implemented
   - Full CRUD operations via admin interface

3. **products**
   - Comprehensive product information
   - Multiple pricing tiers (retail/business)
   - Image management through Supabase Storage
   - Technical specifications (JSONB)
   - Inventory tracking
   - Row Level Security implemented
   - Full CRUD operations via admin interface

4. **product_images**
   - Image management for products
   - Support for multiple images per product
   - Primary image designation
   - Sort order management
   - Automatic storage handling

5. **product_variants**
   - Support for different finishes/colors
   - Independent SKU management
   - Price adjustments for variants
   - Separate inventory tracking
   - Active/inactive status

6. **orders**
   - Order processing and tracking
   - Multiple status states
   - Shipping and billing information
   - Business order handling

7. **order_items**
   - Individual order items
   - Price tracking
   - Quantity management

## Development Roadmap

### Phase 1: Core E-commerce (Q1 2025)
1. **Product Management (Sprint 1) - IN PROGRESS**
   - ✅ Basic product CRUD
   - 🔄 Image management
   - Product variants
   - Advanced search/filter
   - Bulk operations

2. **Category Management (Sprint 2)**
   - Category CRUD
   - Hierarchical structure
   - Category-product relations
   - Category-based navigation

3. **Shopping Experience (Sprint 3)**
   - Product listing page
   - Product detail page
   - Shopping cart
   - Checkout process

4. **Order Management (Sprint 4)**
   - Order processing
   - Order status tracking
   - Email notifications
   - Order history

### Phase 2: Enhanced Features (Q2 2025)
1. **Business Accounts**
   - Bulk ordering system
   - Special pricing
   - Quote requests
   - Account management

2. **Content Management**
   - Product documentation
   - Installation guides
   - Technical specifications
   - Product comparisons

3. **Customer Service**
   - Support ticket system
   - Live chat integration
   - Returns management
   - FAQ system

### Phase 3: Optimization (Q3 2025)
1. **Performance**
   - Image optimization
   - Caching implementation
   - Load time optimization
   - Mobile responsiveness

2. **Analytics & Reporting**
   - Sales analytics
   - Inventory management
   - Customer behavior tracking
   - Performance metrics

## Project Setup

### Environment Requirements
- Node.js 18+
- NPM or Yarn
- Supabase account
- Square account (for payments)

### Local Development
1. Clone and Install
```bash
git clone [repository-url]
cd notalock-store
npm install
```

2. Environment Configuration
Create a `.env` file:
```bash
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SQUARE_ACCESS_TOKEN=your_square_token
```

3. Start Development Server
```bash
npm run dev
```

## Project Structure
```
notalock-store/
├── app/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductManagement.tsx
│   │   └── ui/
│   ├── lib/
│   ├── routes/
│   │   ├── _index.tsx
│   │   ├── admin.tsx
│   │   ├── admin.products.tsx
│   │   ├── admin.test.tsx
│   │   ├── login.tsx
│   │   └── unauthorized.tsx
│   ├── services/
│   ├── styles/
│   │   └── tailwind.css
│   ├── types/
│   ├── utils/
│   └── root.tsx
├── docs/
│   ├── database.md
│   ├── api.md
│   └── deployment.md
├── hooks/
├── public/
├── CONTRIBUTING.md
├── LICENSE.md
├── README.md
├── components.json
├── package.json
├── postcss.config.cjs
├── remix.config.js
├── tailwind.config.cjs
└── tsconfig.json
```

## Contributing
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.