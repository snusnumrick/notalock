-- Check if order_status enum needs modification
DO $$ 
BEGIN
    -- Add 'pending', 'paid', and 'failed' to order_status enum if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'pending') THEN
        ALTER TYPE order_status ADD VALUE 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'paid') THEN
        ALTER TYPE order_status ADD VALUE 'paid';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'failed') THEN
        ALTER TYPE order_status ADD VALUE 'failed';
    END IF;
END $$;

-- Create order_status_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add payment_intent_id and payment_provider columns to orders table if they don't exist
-- THIS MUST COME BEFORE CREATING INDEXES ON THESE COLUMNS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_intent_id') THEN
        ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_provider') THEN
        ALTER TABLE orders ADD COLUMN payment_provider TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method_id') THEN
        ALTER TABLE orders ADD COLUMN payment_method_id TEXT;
    END IF;
END $$;

-- Add indexes if they don't exist (after columns exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_payment_intent_id') THEN
        CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_status_history_order_id') THEN
        CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
    END IF;
END $$;

-- Add RLS policies
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for order_status_history with proper existence checks
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Users can view their own order status history'
    ) THEN
        EXECUTE $POLICY$
            CREATE POLICY "Users can view their own order status history" 
            ON order_status_history FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM orders
                    WHERE orders.id = order_status_history.order_id
                    AND orders.user_id = auth.uid()
                )
            );
        $POLICY$;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Admins can view all order status history'
    ) THEN
        EXECUTE $POLICY$
            CREATE POLICY "Admins can view all order status history" 
            ON order_status_history FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            );
        $POLICY$;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Admins can insert order status history'
    ) THEN
        EXECUTE $POLICY$
            CREATE POLICY "Admins can insert order status history" 
            ON order_status_history FOR INSERT 
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            );
        $POLICY$;
    END IF;
END $$;

-- Check if order_updated_at_function exists and create it if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $BODY$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $BODY$ language 'plpgsql';
    END IF;
END $$;

-- Add trigger to automatically update the updated_at field
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to add status history when order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS NULL OR NEW.status <> OLD.status THEN
        INSERT INTO order_status_history (
            order_id,
            status,
            notes,
            created_by
        ) VALUES (
            NEW.id,
            NEW.status,
            'Status changed from ' || COALESCE(OLD.status::TEXT, 'NULL') || ' to ' || NEW.status::TEXT,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_order_status_change ON orders;
CREATE TRIGGER log_order_status_change
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE log_order_status_change();

-- Create a function to log initial order status
CREATE OR REPLACE FUNCTION log_initial_order_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO order_status_history (
        order_id,
        status,
        notes,
        created_by
    ) VALUES (
        NEW.id,
        NEW.status,
        'Order created with status ' || NEW.status::TEXT,
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_initial_order_status ON orders;
CREATE TRIGGER log_initial_order_status
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE log_initial_order_status();
