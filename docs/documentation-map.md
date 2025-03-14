# Notalock Documentation Map

```
docs/
├── README.md                          # Main documentation entry point
│
├── development/                       # Developer resources
│   ├── README.md                      # Development overview
│   ├── claude-instructions.md         # Instructions for Claude AI
│   ├── code-organization.md           # Project structure guide
│   ├── error-handling.md              # Error handling standards
│   ├── guidelines.md                  # General development guidelines
│   ├── middleware.md                  # Middleware documentation
│   ├── testing.md                     # Testing guidelines and practices
│   ├── checkout-flow.md               # Checkout flow implementation details
│   ├── checkout-routing.md            # Checkout routing structure
│   ├── checkout-fixes.md              # Checkout fixes and improvements
│   ├── image-optimization-guide.md    # Guide for image optimization
│   ├── anonymous-carts.md             # Anonymous shopping carts
│   ├── cart-removal.md               # Cart item removal implementation
│   └── fixing-failing-tests-guide.md  # Guide for fixing tests
│
├── api/                               # API documentation
│   ├── README.md                      # API overview
│   ├── cart-api.md                    # Cart API endpoints
│   ├── category-management.md         # Category API endpoints
│   ├── image-optimization.md          # Image optimization API
│   └── product-management.md          # Product management API
│
├── features/                          # Feature documentation
│   ├── README.md                      # Features overview
│   ├── category-management.md         # Category management feature
│   ├── checkout.md                   # Checkout feature
│   ├── image-management.md            # Image management feature
│   ├── payment-integration.md          # Payment provider integration
│   ├── product-detail.md              # Product detail page feature
│   ├── product-management.md          # Product management feature
│   └── shipping-tax-calculations.md    # Shipping and tax calculation system
│
├── user/                              # User documentation (new)
│   ├── README.md                      # User guide overview
│   ├── getting-started.md             # Getting started guide
│   └── faq.md                         # Frequently asked questions
│
├── database/                          # Database documentation (moved)
│   ├── README.md                      # Database overview
│   └── schema.md                      # Database schema details
│
├── deployment/                        # Deployment documentation (moved)
│   ├── README.md                      # Deployment overview
│   └── guide.md                       # Detailed deployment guide
│
└── roadmap/                           # Roadmap and planning
    ├── README.md                      # Roadmap overview
    └── development-plan.md            # Detailed development plan
```

## Documentation Navigation

### For New Developers
1. Start with `docs/README.md`
2. Read `docs/development/guidelines.md`
3. Understand the code structure via `docs/development/code-organization.md`
4. Review error handling and testing practices

### For Feature Developers
1. Start with relevant feature documentation in `docs/features/`
2. Reference API documentation in `docs/api/`
3. Check database schema in `docs/database/`

### For System Administrators
1. Start with `docs/deployment/`
2. Reference database setup in `docs/database/`

### For End Users
1. Start with `docs/user/`
2. Review FAQs and getting started guide

## Documentation Conventions

- All documentation uses Markdown
- Code examples are provided in syntax-highlighted blocks
- Each major section has its own README.md as an entry point
- Cross-references use relative paths
