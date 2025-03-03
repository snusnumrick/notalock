# Deployment Guide

## Overview
This document outlines the deployment process for the Notalock e-commerce platform.

## Prerequisites
- Node.js 18+
- NPM or Yarn
- Supabase account
- Square account (for payments)
- Git

## Environment Setup

### Development
1. Clone the repository:
```bash
git clone [repository-url]
cd notalock-store
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Supabase configuration
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Square configuration
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_ENVIRONMENT=sandbox # or production

# General configuration
NODE_ENV=development
SESSION_SECRET=your_session_secret
```

4. Run database migrations:
```bash
npm run supabase:migration:generate
npm run supabase:migration:up
```

5. Start development server:
```bash
npm run dev
```

### Production
1. Build the application:
```bash
npm run build
```

2. Set up environment variables in your hosting platform:
```bash
# Required environment variables
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_ENVIRONMENT=production
NODE_ENV=production
SESSION_SECRET=your_session_secret
```

## Deployment Options

### Vercel Deployment
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Docker Deployment
1. Build Docker image:
```bash
docker build -t notalock-store .
```

2. Run container:
```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=your_project_url \
  -e SUPABASE_ANON_KEY=your_anon_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e SQUARE_ACCESS_TOKEN=your_square_token \
  -e SQUARE_LOCATION_ID=your_location_id \
  -e SQUARE_ENVIRONMENT=production \
  -e NODE_ENV=production \
  -e SESSION_SECRET=your_session_secret \
  notalock-store
```

## Database Setup

### Supabase Configuration
1. Create new Supabase project
2. Run initial migrations:
```bash
npm run supabase:migration:up
```
3. Set up Row Level Security (RLS) policies
4. Create storage buckets:
```sql
-- Create product images bucket
INSERT INTO storage.buckets (id, name)
VALUES ('product-images', 'Product Images');

-- Set up public access policy
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

### Database Backups
1. Enable automatic backups in Supabase dashboard
2. Configure backup retention period
3. Test backup restoration process

## Monitoring and Logging

### Application Monitoring
1. Set up error tracking (e.g., Sentry):
```typescript
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
});
```

2. Configure performance monitoring:
```typescript
Sentry.init({
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing()
  ]
});
```

### Database Monitoring
1. Enable Supabase monitoring
2. Set up alerts for:
    - High database load
    - Storage usage thresholds
    - Failed queries
    - Authentication errors

## Security Considerations

### SSL Configuration
1. Enable SSL in production
2. Configure SSL certificates
3. Set up automatic certificate renewal

### Security Headers
Configure security headers in `remix.config.cjs`:
```javascript
module.exports = {
  headers: {
    "/*": [
      "X-Frame-Options: DENY",
      "X-Content-Type-Options: nosniff",
      "Referrer-Policy: same-origin",
      "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    ],
  },
};
```

### Rate Limiting
Implement rate limiting for API endpoints:
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

## Maintenance

### Regular Tasks
1. Update dependencies monthly
2. Review and rotate access keys quarterly
3. Test backup restoration process
4. Monitor storage usage
5. Review security policies

### Troubleshooting
Common issues and solutions:

1. Database connection issues:
    - Check Supabase status
    - Verify environment variables
    - Check RLS policies

2. Image upload failures:
    - Verify storage bucket permissions
    - Check file size limits
    - Monitor storage quota

3. Payment processing issues:
    - Verify Square credentials
    - Check webhook configurations
    - Review transaction logs

## Scaling

### Database Scaling
1. Enable connection pooling
2. Optimize queries with indexes
3. Implement caching strategy

### Storage Scaling
1. Monitor storage usage
2. Implement image optimization
3. Set up CDN if needed

### Application Scaling
1. Configure auto-scaling rules
2. Implement caching strategy
3. Optimize build process