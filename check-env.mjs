#!/usr/bin/env node

console.log('Checking environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'defined' : 'undefined');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined');
