-- Add highlight flag and priority for category highlights feature
ALTER TABLE categories
ADD COLUMN is_highlighted BOOLEAN DEFAULT FALSE,
ADD COLUMN highlight_priority INTEGER DEFAULT 0;

-- Add index for quick retrieval of highlighted categories
CREATE INDEX idx_categories_highlight ON categories(is_highlighted) WHERE is_highlighted = TRUE;

-- Add index for ordering highlighted categories
CREATE INDEX idx_categories_highlight_priority ON categories(highlight_priority) WHERE is_highlighted = TRUE;

-- Add constraint to ensure highlight_priority is non-negative
ALTER TABLE categories
ADD CONSTRAINT check_highlight_priority_non_negative 
CHECK (highlight_priority >= 0);

COMMENT ON COLUMN categories.is_highlighted IS 'Flag indicating if the category should be highlighted on the homepage';
COMMENT ON COLUMN categories.highlight_priority IS 'Order/priority for displaying highlighted categories (higher numbers shown first)';