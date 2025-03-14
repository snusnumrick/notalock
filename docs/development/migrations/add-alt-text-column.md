# Adding alt_text to product_images Table

This migration adds two new columns to the `product_images` table:
- `alt_text`: A text field to store alternative text descriptions for product images, improving accessibility
- `updated_by`: A reference to the user who last updated the image

## Migration Details

The migration is located at:
`/supabase/migrations/20250304000000_add_alt_text_to_product_images/`

## Applying the Migration

To apply this migration, run the following command from the project root:

```bash
# Using Supabase CLI
supabase migration up

# Alternatively, if using Docker setup
docker-compose run --rm supabase migration up
```

## TypeScript Type Updates

The TypeScript type definitions in `app/features/supabase/types/Database.types.ts` have been updated to include these new fields in the `product_images` table definition.

## Related Code

The alt_text field is used in the product image upload API endpoint:
`app/routes/api.upload-product-image.ts`

## Rollback Instructions

If needed, you can rollback this migration using:

```bash
# Using Supabase CLI
supabase migration down 20250304000000_add_alt_text_to_product_images

# Alternatively, if using Docker setup
docker-compose run --rm supabase migration down 20250304000000_add_alt_text_to_product_images
```
