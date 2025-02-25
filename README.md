# Notalock - European Door Hardware Store

## Overview
Notalock is a modern e-commerce platform specializing in high-end European door hardware, built with Remix.js.

Our product catalog includes:
- Premium locks and locking mechanisms
- Designer door handles and levers
- Heavy-duty hinges and pivot systems
- Pocket door rails and sliding systems
- Special opening systems (folding, invisible)

## Tech Stack
- Framework: Remix.js (v2)
- Styling: Tailwind CSS with shadcn/ui
- Backend: Supabase
- Payments: Square (planned)

## Quick Start

### Prerequisites
- Node.js 18+
- NPM or Yarn
- Supabase account
- Square account (for payments)

### Development Setup
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

3. Start development server:
```bash
npm run dev
```

## Documentation

Detailed documentation is available in the [docs](./docs/README.md) directory.

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
- [Category Management](./docs/features/category-management.md)
  - Hierarchical structure
  - Tree visualization
  - Drag-and-drop ordering
  - Mobile responsiveness

### Planning
- [Development Roadmap](./docs/roadmap/development-plan.md)

## Contributing
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.