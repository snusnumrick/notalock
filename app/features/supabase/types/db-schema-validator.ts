/**
 * Database Schema Validator
 *
 * This tool compares the database schema as defined in TypeScript types
 * with the schema defined in SQL migration files to detect inconsistencies.
 */

import * as fs from 'fs';
import * as path from 'path';

// Paths
const TYPES_PATH =
  '/Users/antont/WebstormProjects/Notalock/app/features/supabase/types/Database.types.ts';
const MIGRATIONS_PATH = '/Users/antont/WebstormProjects/Notalock/supabase/migrations';

// Interfaces
interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  enums: Map<string, string[]>;
}

interface ColumnDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  isArray: boolean;
  defaultValue?: string;
}

interface SchemaComparison {
  inTypeScriptOnly: string[];
  inMigrationsOnly: string[];
  columnMismatches: ColumnMismatch[];
  enumMismatches: EnumMismatch[];
}

interface ColumnMismatch {
  table: string;
  column: string;
  typeScriptType: string;
  sqlType: string;
  isNullableMismatch?: boolean;
}

interface EnumMismatch {
  enum: string;
  typeScriptValues: string[];
  sqlValues: string[];
  inTypeScriptOnly: string[];
  inSqlOnly: string[];
}

// Parse TypeScript types file to extract schema definition
function parseTypeScriptSchema(typesContent: string): Map<string, TableDefinition> {
  const tables = new Map<string, TableDefinition>();
  const enums = new Map<string, string[]>();

  // Extract enums
  const enumRegex = /export type (\w+) =\s+(?:\| "([^"]+)")+/g;
  const enumValueRegex = /"([^"]+)"/g;

  let enumMatch;
  while ((enumMatch = enumRegex.exec(typesContent)) !== null) {
    const enumName = enumMatch[1];
    const enumValues: string[] = [];

    let valueMatch;
    while ((valueMatch = enumValueRegex.exec(enumMatch[0])) !== null) {
      enumValues.push(valueMatch[1]);
    }

    enums.set(enumName, enumValues);
  }

  // Extract tables
  const tableRegex = /(\w+): \{\s+Row: \{([^}]+)\}/g;
  const columnRegex = /(\w+): ([^;,]+)(\?|)/g;

  let tableMatch;
  while ((tableMatch = tableRegex.exec(typesContent)) !== null) {
    const tableName = tableMatch[1];
    const columnsString = tableMatch[2];

    const columns: ColumnDefinition[] = [];
    let columnMatch;

    const columnRegexLocal = new RegExp(columnRegex);
    while ((columnMatch = columnRegexLocal.exec(columnsString)) !== null) {
      const columnName = columnMatch[1];
      let columnType = columnMatch[2].trim();
      const isNullable = columnMatch[3] === '?' || columnType.includes(' | null');

      // Clean up type
      columnType = columnType.replace(' | null', '');

      // Check if it's an array
      const isArray = columnType.endsWith('[]');
      if (isArray) {
        columnType = columnType.slice(0, -2);
      }

      columns.push({
        name: columnName,
        type: columnType,
        isNullable,
        isArray,
      });
    }

    tables.set(tableName, {
      name: tableName,
      columns,
      enums,
    });
  }

  return tables;
}

// Parse SQL migration files to extract schema definition
function parseSQLMigrations(migrationsPath: string): Map<string, TableDefinition> {
  const tables = new Map<string, TableDefinition>();
  const enums = new Map<string, string[]>();

  // Read all SQL files
  const files = fs
    .readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(migrationsPath, file));

  // Process each file
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // Extract enum types
    const enumTypeRegex = /CREATE TYPE (\w+) AS ENUM \(([^)]+)\)/g;
    const enumValueRegex = /'([^']+)'/g;

    let enumMatch;
    while ((enumMatch = enumTypeRegex.exec(content)) !== null) {
      const enumName = enumMatch[1];
      const enumValuesString = enumMatch[2];
      const enumValues: string[] = [];

      let valueMatch;
      while ((valueMatch = enumValueRegex.exec(enumValuesString)) !== null) {
        enumValues.push(valueMatch[1]);
      }

      // Update or merge enum values
      if (enums.has(enumName)) {
        const existingValues = enums.get(enumName)!;
        const combinedValues = [...new Set([...existingValues, ...enumValues])];
        enums.set(enumName, combinedValues);
      } else {
        enums.set(enumName, enumValues);
      }
    }

    // Extract enum alterations
    const enumAlterRegex = /ALTER TYPE (\w+) ADD VALUE '([^']+)'/g;

    let alterMatch;
    while ((alterMatch = enumAlterRegex.exec(content)) !== null) {
      const enumName = alterMatch[1];
      const newValue = alterMatch[2];

      if (enums.has(enumName)) {
        const values = enums.get(enumName)!;
        if (!values.includes(newValue)) {
          values.push(newValue);
        }
      } else {
        enums.set(enumName, [newValue]);
      }
    }

    // Extract table definitions
    const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)\s*\(([^;]+)\)/g;
    const columnRegex = /\s*(\w+)\s+([^,;]+)(?:,|$)/g;

    let tableMatch;
    while ((tableMatch = createTableRegex.exec(content)) !== null) {
      const tableName = tableMatch[1];
      const columnsString = tableMatch[2];

      let columns: ColumnDefinition[] = [];
      if (tables.has(tableName)) {
        columns = tables.get(tableName)!.columns;
      }

      // Parse columns
      let columnMatch;
      const columnRegexLocal = new RegExp(columnRegex);
      while ((columnMatch = columnRegexLocal.exec(columnsString)) !== null) {
        const columnDef = columnMatch[0].trim();

        // Skip primary key constraints, unique constraints, etc.
        if (
          columnDef.startsWith('PRIMARY KEY') ||
          columnDef.startsWith('CONSTRAINT') ||
          columnDef.startsWith('UNIQUE') ||
          columnDef.startsWith('FOREIGN KEY')
        ) {
          continue;
        }

        const columnName = columnMatch[1];
        let columnType = columnMatch[2].trim().split(' ')[0].toUpperCase();

        // Handle array types
        const isArray = columnType.includes('[]');
        if (isArray) {
          columnType = columnType.replace('[]', '');
        }

        // Check for NOT NULL
        const isNullable = !columnMatch[2].includes('NOT NULL');

        // Check for default values
        const defaultMatch = /DEFAULT ([^,;]+)/.exec(columnMatch[2]);
        const defaultValue = defaultMatch ? defaultMatch[1] : undefined;

        // Check if column already exists
        const existingColumnIndex = columns.findIndex(c => c.name === columnName);

        if (existingColumnIndex >= 0) {
          // Update existing column
          columns[existingColumnIndex] = {
            ...columns[existingColumnIndex],
            type: columnType,
            isNullable,
            isArray,
            defaultValue,
          };
        } else {
          // Add new column
          columns.push({
            name: columnName,
            type: columnType,
            isNullable,
            isArray,
            defaultValue,
          });
        }
      }

      // Update or create table
      tables.set(tableName, {
        name: tableName,
        columns,
        enums,
      });
    }

    // Extract ALTER TABLE ADD COLUMN statements
    const alterTableRegex = /ALTER TABLE (?:public\.)?(\w+) ADD (?:COLUMN )?(\w+) ([^;]+);/g;

    let alterTableMatch;
    while ((alterTableMatch = alterTableRegex.exec(content)) !== null) {
      const tableName = alterTableMatch[1];
      const columnName = alterTableMatch[2];
      let columnType = alterTableMatch[3].trim().split(' ')[0].toUpperCase();

      // Handle array types
      const isArray = columnType.includes('[]');
      if (isArray) {
        columnType = columnType.replace('[]', '');
      }

      // Check for NOT NULL
      const isNullable = !alterTableMatch[3].includes('NOT NULL');

      // Check for default values
      const defaultMatch = /DEFAULT ([^,;]+)/.exec(alterTableMatch[3]);
      const defaultValue = defaultMatch ? defaultMatch[1] : undefined;

      if (!tables.has(tableName)) {
        tables.set(tableName, {
          name: tableName,
          columns: [],
          enums,
        });
      }

      const table = tables.get(tableName)!;
      const existingColumnIndex = table.columns.findIndex(c => c.name === columnName);

      if (existingColumnIndex >= 0) {
        // Update existing column
        table.columns[existingColumnIndex] = {
          ...table.columns[existingColumnIndex],
          type: columnType,
          isNullable,
          isArray,
          defaultValue,
        };
      } else {
        // Add new column
        table.columns.push({
          name: columnName,
          type: columnType,
          isNullable,
          isArray,
          defaultValue,
        });
      }
    }
  }

  // Update tables with enum references
  for (const [tableName, table] of tables.entries()) {
    table.enums = enums;
    tables.set(tableName, table);
  }

  return tables;
}

// Compare TypeScript schema and SQL schema
function compareSchemas(
  typeScriptSchema: Map<string, TableDefinition>,
  sqlSchema: Map<string, TableDefinition>
): SchemaComparison {
  const comparison: SchemaComparison = {
    inTypeScriptOnly: [],
    inMigrationsOnly: [],
    columnMismatches: [],
    enumMismatches: [],
  };

  // Check tables in TypeScript but not in SQL
  for (const tableName of typeScriptSchema.keys()) {
    if (!sqlSchema.has(tableName)) {
      comparison.inTypeScriptOnly.push(tableName);
    }
  }

  // Check tables in SQL but not in TypeScript
  for (const tableName of sqlSchema.keys()) {
    if (!typeScriptSchema.has(tableName)) {
      comparison.inMigrationsOnly.push(tableName);
    }
  }

  // Compare table columns
  for (const [tableName, tsTable] of typeScriptSchema.entries()) {
    if (!sqlSchema.has(tableName)) continue;

    const sqlTable = sqlSchema.get(tableName)!;

    // Compare columns
    for (const tsColumn of tsTable.columns) {
      const sqlColumn = sqlTable.columns.find(c => c.name === tsColumn.name);

      if (!sqlColumn) {
        comparison.columnMismatches.push({
          table: tableName,
          column: tsColumn.name,
          typeScriptType: tsColumn.type,
          sqlType: 'MISSING',
        });
        continue;
      }

      // Check type consistency
      if (!typesAreCompatible(tsColumn.type, sqlColumn.type)) {
        comparison.columnMismatches.push({
          table: tableName,
          column: tsColumn.name,
          typeScriptType: tsColumn.type,
          sqlType: sqlColumn.type,
        });
      }

      // Check nullability
      if (tsColumn.isNullable !== sqlColumn.isNullable) {
        comparison.columnMismatches.push({
          table: tableName,
          column: tsColumn.name,
          typeScriptType: `${tsColumn.type}${tsColumn.isNullable ? ' | null' : ''}`,
          sqlType: `${sqlColumn.type}${sqlColumn.isNullable ? '' : ' NOT NULL'}`,
          isNullableMismatch: true,
        });
      }
    }

    // Check for columns in SQL but not in TypeScript
    for (const sqlColumn of sqlTable.columns) {
      const tsColumn = tsTable.columns.find(c => c.name === sqlColumn.name);

      if (!tsColumn) {
        comparison.columnMismatches.push({
          table: tableName,
          column: sqlColumn.name,
          typeScriptType: 'MISSING',
          sqlType: sqlColumn.type,
        });
      }
    }
  }

  // Compare enums
  const tsEnums = typeScriptSchema.values().next().value?.enums || new Map<string, string[]>();
  const sqlEnums = sqlSchema.values().next().value?.enums || new Map<string, string[]>();

  for (const [enumName, tsValues] of tsEnums.entries()) {
    if (!sqlEnums.has(enumName)) {
      comparison.enumMismatches.push({
        enum: enumName,
        typeScriptValues: tsValues,
        sqlValues: [],
        inTypeScriptOnly: tsValues,
        inSqlOnly: [],
      });
      continue;
    }

    const sqlValues = sqlEnums.get(enumName)!;
    const inTypeScriptOnly = tsValues.filter((v: string) => !sqlValues.includes(v));
    const inSqlOnly = sqlValues.filter((v: string) => !tsValues.includes(v));

    if (inTypeScriptOnly.length > 0 || inSqlOnly.length > 0) {
      comparison.enumMismatches.push({
        enum: enumName,
        typeScriptValues: tsValues,
        sqlValues,
        inTypeScriptOnly,
        inSqlOnly,
      });
    }
  }

  for (const [enumName, sqlValues] of sqlEnums.entries()) {
    if (!tsEnums.has(enumName)) {
      comparison.enumMismatches.push({
        enum: enumName,
        typeScriptValues: [],
        sqlValues,
        inTypeScriptOnly: [],
        inSqlOnly: sqlValues,
      });
    }
  }

  return comparison;
}

// Check if TypeScript and SQL types are compatible
function typesAreCompatible(tsType: string, sqlType: string): boolean {
  // Map of compatible types
  const typeMap: Record<string, string[]> = {
    string: ['TEXT', 'VARCHAR', 'CHAR', 'CHARACTER', 'UUID', 'TIMESTAMP', 'DATE', 'TIME'],
    number: [
      'INT',
      'INTEGER',
      'NUMERIC',
      'DECIMAL',
      'FLOAT',
      'DOUBLE',
      'REAL',
      'SMALLINT',
      'BIGINT',
    ],
    boolean: ['BOOLEAN', 'BOOL'],
    Json: ['JSON', 'JSONB'],
  };

  // Check if the TypeScript type's compatible SQL types include the actual SQL type
  for (const [tsTypeKey, compatibleSqlTypes] of Object.entries(typeMap)) {
    if (tsType === tsTypeKey || tsType.startsWith(tsTypeKey)) {
      return compatibleSqlTypes.some(t => sqlType.includes(t));
    }
  }

  // Handle enum types
  if (tsType.includes('Enums')) {
    // Extract the enum name from TypeScript type
    const enumMatch = /Enums\["([^"]+)"\]/.exec(tsType);
    if (enumMatch) {
      const enumName = enumMatch[1];
      return sqlType.toUpperCase() === enumName.toUpperCase();
    }
  }

  return false;
}

// Generate a report of schema inconsistencies
function generateReport(comparison: SchemaComparison): string {
  let report = '# Database Schema Validation Report\n\n';

  const hasIssues =
    comparison.inTypeScriptOnly.length > 0 ||
    comparison.inMigrationsOnly.length > 0 ||
    comparison.columnMismatches.length > 0 ||
    comparison.enumMismatches.length > 0;

  if (!hasIssues) {
    report += '✅ No inconsistencies found! TypeScript types match SQL schema.\n';
    return report;
  }

  // Tables in TypeScript only
  if (comparison.inTypeScriptOnly.length > 0) {
    report += '## Tables in TypeScript but not in SQL migrations\n\n';
    for (const table of comparison.inTypeScriptOnly) {
      report += `- \`${table}\`\n`;
    }
    report += '\n';
  }

  // Tables in SQL only
  if (comparison.inMigrationsOnly.length > 0) {
    report += '## Tables in SQL migrations but not in TypeScript\n\n';
    for (const table of comparison.inMigrationsOnly) {
      report += `- \`${table}\`\n`;
    }
    report += '\n';
  }

  // Column mismatches
  if (comparison.columnMismatches.length > 0) {
    report += '## Column mismatches\n\n';
    report += '| Table | Column | TypeScript Type | SQL Type | Issue |\n';
    report += '| --- | --- | --- | --- | --- |\n';

    for (const mismatch of comparison.columnMismatches) {
      const issue =
        mismatch.typeScriptType === 'MISSING'
          ? 'Missing in TypeScript'
          : mismatch.sqlType === 'MISSING'
            ? 'Missing in SQL'
            : mismatch.isNullableMismatch
              ? 'Nullability mismatch'
              : 'Type mismatch';

      report += `| \`${mismatch.table}\` | \`${mismatch.column}\` | \`${mismatch.typeScriptType}\` | \`${mismatch.sqlType}\` | ${issue} |\n`;
    }
    report += '\n';
  }

  // Enum mismatches
  if (comparison.enumMismatches.length > 0) {
    report += '## Enum mismatches\n\n';

    for (const mismatch of comparison.enumMismatches) {
      report += `### Enum: \`${mismatch.enum}\`\n\n`;

      report += '**TypeScript values:**\n\n';
      report +=
        mismatch.typeScriptValues.length > 0
          ? `\`${mismatch.typeScriptValues.join('`, `')}\`\n\n`
          : 'None\n\n';

      report += '**SQL values:**\n\n';
      report +=
        mismatch.sqlValues.length > 0 ? `\`${mismatch.sqlValues.join('`, `')}\`\n\n` : 'None\n\n';

      if (mismatch.inTypeScriptOnly.length > 0) {
        report += '**Values in TypeScript only:**\n\n';
        report += `\`${mismatch.inTypeScriptOnly.join('`, `')}\`\n\n`;
      }

      if (mismatch.inSqlOnly.length > 0) {
        report += '**Values in SQL only:**\n\n';
        report += `\`${mismatch.inSqlOnly.join('`, `')}\`\n\n`;
      }
    }
  }

  // Add recommendations
  report += '## Recommendations\n\n';

  if (comparison.inTypeScriptOnly.length > 0) {
    report += '### For tables in TypeScript but not in SQL:\n\n';
    report += '- Create migration files to add these tables to the database, or\n';
    report += '- Remove these tables from the TypeScript definitions if they are not needed\n\n';
  }

  if (comparison.inMigrationsOnly.length > 0) {
    report += '### For tables in SQL but not in TypeScript:\n\n';
    report += '- Run `supabase gen types typescript` to regenerate the TypeScript types, or\n';
    report += '- Add these tables manually to the TypeScript definitions\n\n';
  }

  if (comparison.columnMismatches.length > 0) {
    report += '### For column mismatches:\n\n';
    report += '- For columns missing in SQL: Create migrations to add these columns\n';
    report += '- For columns missing in TypeScript: Update TypeScript definitions\n';
    report += '- For type mismatches: Ensure SQL and TypeScript types are compatible\n';
    report +=
      '- For nullability mismatches: Update either SQL schema or TypeScript definitions\n\n';
  }

  if (comparison.enumMismatches.length > 0) {
    report += '### For enum mismatches:\n\n';
    report +=
      '- For values in TypeScript only: Add them to SQL enums using ALTER TYPE statements\n';
    report += '- For values in SQL only: Add them to the TypeScript definitions\n\n';
  }

  report += '## General steps to fix inconsistencies\n\n';
  report += '1. Regenerate TypeScript types using `supabase gen types typescript`\n';
  report +=
    '2. For remaining issues, create new migrations to align the database schema with TypeScript\n';
  report +=
    '3. If database corruption is suspected, consider using this report to create a migration that fixes the schema\n';

  return report;
}

// Main function
async function main() {
  try {
    // Read TypeScript types file
    const typesContent = fs.readFileSync(TYPES_PATH, 'utf8');

    // Parse schemas
    const typeScriptSchema = parseTypeScriptSchema(typesContent);
    const sqlSchema = parseSQLMigrations(MIGRATIONS_PATH);

    // Compare schemas
    const comparison = compareSchemas(typeScriptSchema, sqlSchema);

    // Generate report
    const report = generateReport(comparison);

    // Write report to file
    const reportPath = path.join(path.dirname(TYPES_PATH), 'schema-validation-report.md');
    fs.writeFileSync(reportPath, report);

    console.log(`Schema validation complete. Report written to: ${reportPath}`);
    console.log(report);

    // Return success code based on whether issues were found
    const hasIssues =
      comparison.inTypeScriptOnly.length > 0 ||
      comparison.inMigrationsOnly.length > 0 ||
      comparison.columnMismatches.length > 0 ||
      comparison.enumMismatches.length > 0;

    return hasIssues ? 1 : 0;
  } catch (error) {
    console.error('Error:', error);
    return 1;
  }
}

// Execute main function
main();
