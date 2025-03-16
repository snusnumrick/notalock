import { describe, it, expect, afterAll } from 'vitest';
import { createClient, PostgrestError } from '@supabase/supabase-js';

// Mock environment variables for tests
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';

// Helper type for database operations
type DbResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Test suite for order schema migrations
 * Note: These tests require a local Supabase instance to be running
 */
describe('Orders Schema Migrations', () => {
  // Create a Supabase client with the service role key
  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // Test data for database operations
  const testOrder = {
    order_number: 'TEST-20250315-ABCD',
    email: 'test@example.com',
    status: 'pending',
    payment_status: 'pending',
    shipping_cost: 10,
    tax_amount: 5,
    subtotal_amount: 100,
    total_amount: 115,
  };

  let orderId: string;

  // Helper functions
  async function cleanupTestData() {
    if (orderId) {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('order_status_history').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
    }
  }

  // Clean up after all tests
  afterAll(async () => {
    await cleanupTestData();
  });

  it('verifies the orders table exists with correct columns', async () => {
    // Test table existence by attempting to insert a record
    const result: DbResult<any> = await supabase
      .from('orders')
      .insert({ ...testOrder })
      .select()
      .single();

    // Save the order ID for cleanup and related tests
    if (result.data) {
      orderId = result.data.id;
    }

    // Assertions
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data.id).toBeDefined();
    expect(result.data.created_at).toBeDefined();
    expect(result.data.updated_at).toBeDefined();
    expect(result.data.order_number).toBe(testOrder.order_number);
    expect(result.data.status).toBe(testOrder.status);
    expect(result.data.payment_status).toBe(testOrder.payment_status);
  });

  it('verifies the order_items table exists with correct columns', async () => {
    // Skip if no orderId from previous test
    if (!orderId) {
      console.warn('Skipping test because no orderId was generated');
      return;
    }

    // Test item insertion
    const itemResult: DbResult<any> = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: 'test-product-1',
        name: 'Test Product',
        sku: 'TP1',
        quantity: 2,
        unit_price: 50,
        total_price: 100,
      })
      .select()
      .single();

    // Assertions
    expect(itemResult.error).toBeNull();
    expect(itemResult.data).not.toBeNull();
    expect(itemResult.data.id).toBeDefined();
    expect(itemResult.data.order_id).toBe(orderId);
    expect(itemResult.data.product_id).toBe('test-product-1');
    expect(itemResult.data.quantity).toBe(2);
    expect(itemResult.data.unit_price).toBe(50);
    expect(itemResult.data.total_price).toBe(100);
  });

  it('verifies the order_status_history table exists with correct columns', async () => {
    // Skip if no orderId from previous test
    if (!orderId) {
      console.warn('Skipping test because no orderId was generated');
      return;
    }

    // Test status history insertion
    const historyResult: DbResult<any> = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'pending',
        notes: 'Order created during testing',
      })
      .select()
      .single();

    // Assertions
    expect(historyResult.error).toBeNull();
    expect(historyResult.data).not.toBeNull();
    expect(historyResult.data.id).toBeDefined();
    expect(historyResult.data.order_id).toBe(orderId);
    expect(historyResult.data.status).toBe('pending');
    expect(historyResult.data.notes).toBe('Order created during testing');
    expect(historyResult.data.created_at).toBeDefined();
  });

  it('verifies foreign key constraints exist between tables', async () => {
    // Try to insert a record with an invalid order_id
    const invalidOrderId = '00000000-0000-0000-0000-000000000000';

    // Test item with invalid foreign key
    const itemResult: DbResult<any> = await supabase
      .from('order_items')
      .insert({
        order_id: invalidOrderId,
        product_id: 'test-product-2',
        name: 'Invalid Product',
        sku: 'IP1',
        quantity: 1,
        unit_price: 25,
        total_price: 25,
      })
      .select()
      .single();

    // Test status history with invalid foreign key
    const historyResult: DbResult<any> = await supabase
      .from('order_status_history')
      .insert({
        order_id: invalidOrderId,
        status: 'pending',
        notes: 'This should fail',
      })
      .select()
      .single();

    // Assertions - Both should fail due to foreign key constraints
    expect(itemResult.error).not.toBeNull();
    expect(historyResult.error).not.toBeNull();
    expect(itemResult.error?.code).toBe('23503'); // Foreign key violation
    expect(historyResult.error?.code).toBe('23503'); // Foreign key violation
  });

  it('verifies order_number uniqueness constraint', async () => {
    // Try to insert a record with the same order number
    const duplicateResult: DbResult<any> = await supabase
      .from('orders')
      .insert({
        ...testOrder, // Same order number as in the first test
      })
      .select()
      .single();

    // Assertions
    expect(duplicateResult.error).not.toBeNull();
    expect(duplicateResult.error?.code).toBe('23505'); // Unique violation
  });

  it('verifies default status values', async () => {
    // Insert order with minimal fields
    const minimalResult: DbResult<any> = await supabase
      .from('orders')
      .insert({
        order_number: 'TEST-20250315-EFGH', // Different from test order
        email: 'test@example.com',
        shipping_cost: 10,
        tax_amount: 5,
        subtotal_amount: 100,
        total_amount: 115,
      })
      .select()
      .single();

    // Clean up this test order
    if (minimalResult.data?.id) {
      const tempId = minimalResult.data.id;
      // Cleanup after assertions
      await supabase.from('orders').delete().eq('id', tempId);
    }

    // Assertions - check if default values were applied
    expect(minimalResult.error).toBeNull();
    expect(minimalResult.data).not.toBeNull();
    expect(minimalResult.data.status).toBe('pending');
    expect(minimalResult.data.payment_status).toBe('pending');
  });

  it('verifies data types are correctly defined', async () => {
    // Skip if no orderId from previous test
    if (!orderId) {
      console.warn('Skipping test because no orderId was generated');
      return;
    }

    // Retrieve the created order
    const { data: order } = await supabase.from('orders').select().eq('id', orderId).single();

    // Assertions for data types
    expect(order).not.toBeNull();
    expect(typeof order.id).toBe('string');
    expect(typeof order.order_number).toBe('string');
    expect(typeof order.email).toBe('string');
    expect(typeof order.status).toBe('string');
    expect(typeof order.payment_status).toBe('string');
    expect(typeof order.shipping_cost).toBe('number');
    expect(typeof order.tax_amount).toBe('number');
    expect(typeof order.subtotal_amount).toBe('number');
    expect(typeof order.total_amount).toBe('number');
    expect(order.created_at instanceof Date || typeof order.created_at === 'string').toBeTruthy();
    expect(order.updated_at instanceof Date || typeof order.updated_at === 'string').toBeTruthy();
  });
});
