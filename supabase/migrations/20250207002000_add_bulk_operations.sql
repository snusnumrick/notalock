-- Create functions for bulk price and stock adjustments
CREATE OR REPLACE FUNCTION adjust_retail_prices(
    product_ids UUID[],
    adjustment DECIMAL
) RETURNS void AS $$
BEGIN
    UPDATE products
    SET retail_price = retail_price + adjustment
    WHERE id = ANY(product_ids)
    AND retail_price + adjustment >= 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION adjust_business_prices(
    product_ids UUID[],
    adjustment DECIMAL
) RETURNS void AS $$
BEGIN
    UPDATE products
    SET business_price = business_price + adjustment
    WHERE id = ANY(product_ids)
    AND business_price + adjustment >= 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION adjust_stock(
    product_ids UUID[],
    adjustment INTEGER
) RETURNS void AS $$
BEGIN
    UPDATE products
    SET stock = stock + adjustment
    WHERE id = ANY(product_ids)
    AND stock + adjustment >= 0;
END;
$$ LANGUAGE plpgsql;