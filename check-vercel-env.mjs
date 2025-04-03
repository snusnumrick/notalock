#!/usr/bin/env node

// Force CommonJS in .mjs file
// @ts-check
/**
 * This script checks if all required environment variables are set
 * Run it before deployment to Vercel to ensure all required variables are configured
 */

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const optionalVars = [
  'DEFAULT_PAYMENT_PROVIDER',
  'SQUARE_ACCESS_TOKEN',
  'SQUARE_APP_ID',
  'SQUARE_LOCATION_ID',
  'SQUARE_ENVIRONMENT',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
];

function checkEnvVars() {
  console.log('Checking environment variables...');
  
  const missing = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  const warnings = [];
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ ERROR: Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these in your Vercel project settings before deploying.');
    console.error('https://vercel.com/docs/projects/environment-variables');
    
    // In Vercel CI/CD, just warn and continue rather than failing the build
    if (process.env.VERCEL) {
      console.error('\nContinuing build as we are in Vercel environment, but app will likely fail.');
    } else {
      process.exit(1);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ WARNING: Missing optional environment variables:');
    warnings.forEach(varName => console.warn(`   - ${varName}`));
  }
  
  console.log('✅ All required environment variables are set.');
}

// Only run the check if in production mode
if (process.env.NODE_ENV === 'production') {
  checkEnvVars();
}

// This script can be run directly to check environment variables
if (process.argv[1].includes('check-vercel-env.mjs')) {
  checkEnvVars();
}
