#!/usr/bin/env node
/**
 * Database Schema Validator Script
 *
 * Usage: npm run validate-schema
 *
 * This script validates that the database schema as defined in TypeScript types
 * matches the schema defined in SQL migration files.
 */

const { resolve } = require('path');
const { spawn } = require('child_process');

const validatorPath = resolve(__dirname, '../app/features/supabase/types/db-schema-validator.ts');

const proc = spawn('npx', ['ts-node', validatorPath], { stdio: 'inherit' });

proc.on('close', code => {
  process.exit(code);
});
