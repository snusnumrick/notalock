#!/bin/bash

# Check if project ID is provided
if [ -z "$1" ]; then
  echo "Error: Project ID is required."
  echo "Usage: ./scripts/generate-types.sh <project_id>"
  exit 1
fi

PROJECT_ID=$1

# Create directory if it doesn't exist
mkdir -p app/features/supabase/types

# Generate types
npx supabase gen types typescript --project-id $PROJECT_ID --schema public > app/features/supabase/types/Database.types.ts

echo "Types generated successfully from project $PROJECT_ID"
