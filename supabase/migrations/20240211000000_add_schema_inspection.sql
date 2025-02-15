-- Create schema inspection function
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH table_info AS (
        SELECT 
            t.tablename AS table_name,
            jsonb_agg(
                jsonb_build_object(
                    'column_name', c.column_name,
                    'data_type', c.data_type,
                    'is_nullable', c.is_nullable,
                    'column_default', c.column_default
                ) ORDER BY c.ordinal_position
            ) AS columns
        FROM pg_tables t
        LEFT JOIN information_schema.columns c ON t.tablename = c.table_name 
        WHERE t.schemaname = 'public'
        GROUP BY t.tablename
    ),
    enum_info AS (
        SELECT 
            t.typname AS enum_name,
            jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
    )
    SELECT jsonb_build_object(
        'tables', jsonb_object_agg(table_name, columns),
        'enums', jsonb_object_agg(enum_name, enum_values)
    ) INTO result
    FROM table_info, enum_info;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_schema_info() TO authenticated;

-- Add description
COMMENT ON FUNCTION get_schema_info IS 'Returns database schema information including tables, columns, and enums';
