# Database Schema Validation

This document describes how to use the schema validation tool to detect inconsistencies between TypeScript database type definitions and SQL migration files.

## Overview

The schema validation tool compares the database schema as defined in TypeScript types with the schema defined in SQL migration files to detect inconsistencies. This is useful for identifying potential database corruption issues or migration problems.

## Usage

Run the schema validation tool using the following npm script:

```bash
npm run db:validate
```

This will:
1. Parse the TypeScript types file at `app/features/supabase/types/Database.types.ts`
2. Parse all SQL migration files in the `supabase/migrations` directory
3. Compare the schemas to identify inconsistencies
4. Generate a detailed report

The validation report will be saved to `app/features/supabase/types/schema-validation-report.md` and will also be displayed in the console.

## Understanding the Report

The report will highlight the following types of inconsistencies:

1. **Tables in TypeScript but not in SQL migrations** - Tables that are defined in the TypeScript types but not found in any migration files
2. **Tables in SQL migrations but not in TypeScript** - Tables that are defined in migration files but not in the TypeScript types
3. **Column mismatches** - Columns with type or nullability inconsistencies between TypeScript and SQL definitions
4. **Enum mismatches** - Enum types with value inconsistencies between TypeScript and SQL definitions

## Fixing Inconsistencies

The report includes recommendations for resolving each type of inconsistency. Generally, you have two options:

1. **Update TypeScript types** - Run `npm run db:types:auto` to regenerate TypeScript types from the database schema
2. **Create new migrations** - Write new migration files to alter the database schema to match the TypeScript types

## When to Use

This tool is particularly useful in the following scenarios:

1. After database restore operations to ensure schema integrity
2. When suspecting database corruption
3. Before and after major schema changes
4. During development to ensure TypeScript types accurately reflect the database schema
5. As part of your continuous integration process to catch schema drift early

## How It Works

The tool:
1. Parses TypeScript types to extract table and column definitions
2. Analyzes SQL migration files to build a cumulative schema definition
3. Compares the two schemas to identify inconsistencies
4. Generates a detailed report with findings and recommendations

## Limitations

- The tool does not check for inconsistencies in database functions, triggers, or other database objects
- It does not validate constraint definitions (foreign keys, unique constraints, etc.)
- It uses heuristics to determine type compatibility, so some complex types might produce false positives

## Related Commands

- `npm run db:types:auto` - Regenerate TypeScript types from the database schema
- `npm run db:types:prod` - Generate TypeScript types from the production database
