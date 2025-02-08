# Notalock - European Door Hardware Store

## Project Overview
Notalock is an e-commerce platform specializing in high-end European door hardware. We offer sophisticated products including:
- Premium locks and locking mechanisms
- Designer door handles and levers
- Heavy-duty hinges and pivot systems
- Pocket door rails and sliding systems
- Special opening systems (folding, invisible)

## Quick Start

### Prerequisites
- Node.js 18+
- NPM or Yarn
- Supabase account
- Square account (for payments)

### Setup
1. Clone and install:
```bash
git clone [repository-url]
cd notalock-store
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Start development:
```bash
npm run dev
```

## Tech Stack
- Frontend: Remix.js with Tailwind CSS
- Backend: Supabase (Authentication, Database, Storage)
- Payments: Square (planned)
- Image Storage: Supabase Storage

## Latest Updates (As of Feb 7, 2025)

### Recently Completed
- Product Management System:
  - Basic CRUD interface for products
  - Product variants with custom options
  - Advanced search and filtering
  - Bulk operations for multiple products
  - Product form with validation
- Image Management System:
  - Multi-file upload with drag-and-drop
  - Image reordering and primary image selection
  - Enhanced product gallery with zoom and lightbox
  - Mobile-friendly with touch swipe support
  - Optimized image handling and preloading
- Role-based access control
- Integration with Supabase Storage

### Known Issues
- Admin dashboard navigation needs styling
- RLS policies need refinement

## Documentation

Detailed documentation is available in the `docs` directory:

### Development
- [Development Guidelines](./docs/development/guidelines.md)
- [Code Organization](./docs/development/code-organization.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Claude Instructions](./docs/development/claude-instructions.md)

### Features
- [Product Management](./docs/features/product-management.md)
  - Product variants
  - Advanced search & filtering
  - Bulk operations
  - Database structure

### Planning
- [Development Roadmap](./docs/roadmap/development-plan.md)

## Contributing
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.