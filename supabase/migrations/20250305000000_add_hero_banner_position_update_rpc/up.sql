-- Create a function to update hero banner positions
CREATE OR REPLACE FUNCTION update_hero_banner_positions(banner_ids UUID[])
RETURNS void AS $$
DECLARE
    banner_id UUID;
    i INTEGER;
BEGIN
    -- Loop through the array of banner IDs and update positions
    FOR i IN 1..array_length(banner_ids, 1)
    LOOP
        banner_id := banner_ids[i];
        
        -- Update position based on array index
        UPDATE hero_banners
        SET 
            position = i - 1,
            updated_at = NOW()
        WHERE id = banner_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_hero_banner_positions(UUID[]) TO authenticated;
