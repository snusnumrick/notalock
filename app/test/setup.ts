import { vi } from 'vitest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Mock console.error to keep test output clean
vi.spyOn(console, 'error').mockImplementation(() => {});
