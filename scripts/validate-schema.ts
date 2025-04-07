/**
 * Database Schema Validator Script
 *
 * Usage: npm run validate-schema
 *
 * This script validates that the database schema as defined in TypeScript types
 * matches the schema defined in SQL migration files.
 */

import { resolve } from 'path';
import { exec } from 'child_process';

const validatorPath = resolve(__dirname, '../app/features/supabase/types/db-schema-validator.ts');

exec(`npx ts-node "${validatorPath}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});
