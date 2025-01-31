# Notalock - European Door Hardware Store

## Project Overview
Notalock is an e-commerce platform specializing in high-end European door hardware. The store offers sophisticated products including:
- Locks
- Handles
- Hinges
- Pocket door rails
- Special opening systems (folding, invisible)

## Tech Stack
- Frontend: Remix.js with Tailwind CSS
- Backend: Supabase (Authentication, Database)
- Payments: Square (planned)

## Current Implementation Status

### Completed Features
1. **Basic Project Setup**
   - Remix.js project structure
   - Tailwind CSS integration
   - Supabase connection
   - Environmental variables configuration

2. **Authentication System**
   - User login functionality
   - Admin role implementation
   - Session management
   - Protected routes

3. **Database Structure**
   - Categories table
   - Products table
   - User profiles
   - Row Level Security (RLS) policies

4. **Admin Features**
   - Category management (Create, Read)
   - Admin dashboard prototype
   - Role-based access control

### In Progress
- Product catalog implementation
- Shopping cart functionality
- User profile management

## Development Roadmap

### Phase 1: Core E-commerce Features
1. **Product Management**
   - Complete product CRUD operations
   - Image upload and management
   - Product categorization
   - Search and filtering

2. **Shopping Experience**
   - Shopping cart implementation
   - Checkout process
   - Square payment integration
   - Order management system

3. **User Features**
   - User registration
   - Profile management
   - Order history
   - Wishlist functionality

### Phase 2: Enhanced Features
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

### Phase 3: Optimization
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

## Project Structure

```
notalock-store/
├── app/                      # Main application directory
│   ├── routes/              # All route components
│   │   ├── _index.tsx      # Homepage route
│   │   ├── admin.test.tsx  # Admin testing/dashboard route
│   │   ├── login.tsx       # Authentication route
│   │   └── unauthorized.tsx # Unauthorized access page
│   ├── services/           # External service integrations
│   │   └── supabase.server.ts  # Supabase client configuration
│   ├── styles/             # Style-related files
│   │   └── tailwind.css    # Tailwind configuration
│   ├── types/              # TypeScript type definitions
│   │   └── supabase.ts     # Supabase type definitions
│   ├── utils/              # Utility functions
│   │   └── auth.server.js  # Authentication utilities
│   └── root.tsx            # Root component with layout
├── public/                 # Static assets
│   ├── favicon.ico         # Site favicon
│   └── favicon.svg         # Vector version of favicon
├── .env                    # Environment variables
├── package.json           # Project dependencies and scripts
├── remix.config.js        # Remix configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

### Key Directories and Files

- `app/routes/`: Contains all page components and API routes. Each file corresponds to a URL path.
- `app/services/`: External service configurations and clients, keeping integration logic separate.
- `app/utils/`: Shared utility functions and helpers, including authentication logic.
- `app/types/`: TypeScript type definitions, especially important for Supabase database schema.
- `public/`: Static assets that are served directly by the web server.
- Configuration files at the root level control various aspects of the build and runtime behavior.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation
1. Clone the repository
```bash
git clone [repository-url]
cd notalock-store
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Fill in the required environment variables:
- SUPABASE_URL
- SUPABASE_ANON_KEY

4. Run the development server
```bash
npm run dev
```

## Current Development State and Next Steps

### Database Schema
Currently implemented tables in Supabase:
```sql
- categories
  - id (uuid)
  - name (text, not null)
  - description (text)
  - created_at (timestamp with timezone)

- profiles
  - id (uuid, references auth.users)
  - email (text)
  - role (enum: 'customer', 'business', 'admin')
  - created_at (timestamp with timezone)
```

### Authentication Status
- Implemented basic authentication with Supabase
- Created admin role and verification
- RLS policies are set up for:
   - Categories (viewable by all, modifiable by admins)
   - User profiles (viewable by all, modifiable by owners)

### Immediate Next Steps
1. **Product Management**
   - Create products table in Supabase
   - Implement product CRUD operations in admin panel
   - Set up image upload functionality

2. **UI Enhancements**
   - Add logout functionality
   - Implement navigation breadcrumbs
   - Create proper admin dashboard layout

3. **Security Improvements**
   - Add CSRF protection
   - Implement rate limiting
   - Set up error boundaries
   - Add input validation

### Known Issues
1. TypeScript setup needs completion
2. Form validation needs improvement
3. Error handling needs to be more robust
4. Missing proper loading states in UI

### Environment Setup Notes
Required environment variables:
```bash
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

To get these values:
1. Go to Supabase dashboard
2. Select your project
3. Go to Project Settings > API
4. Copy the URL and anon key

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

## Contributing
[Contributing guidelines to be added]

## License
[License information to be added]