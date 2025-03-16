import { test, expect } from '@playwright/test';

/**
 * E2E test for the complete checkout and order creation flow.
 * Tests the following:
 * 1. Adding products to the cart
 * 2. Going through the checkout flow
 * 3. Verifying order creation
 * 4. Viewing the completed order
 */
test.describe('Checkout and Order Flow', () => {
  // Helper function to log in
  async function login(page) {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL('/account');
  }

  // Helper function to clear cart if it's not empty
  async function setupEmptyCart(page) {
    // Navigate to cart
    await page.goto('/cart');

    // Check if cart has items
    const emptyCartMessage = page.locator('text=Your cart is empty');
    if (!(await emptyCartMessage.isVisible())) {
      // Try to find and click any "Remove" buttons
      const removeButtons = page.locator('button:has-text("Remove")');
      const count = await removeButtons.count();

      // If there are items, remove them one by one
      for (let i = 0; i < count; i++) {
        // Always click the first one as they shift up after removal
        await removeButtons.first().click();
        // Wait for the item to be removed
        await page.waitForResponse(
          response => response.url().includes('/api/cart') && response.status() === 200
        );
      }
    }

    // Verify cart is empty
    await expect(emptyCartMessage).toBeVisible();
  }

  // This is the main test
  test('complete checkout to order creation process', async ({ page }) => {
    // Step 1: Login
    await login(page);

    // Step 2: Setup clean cart
    await setupEmptyCart(page);

    // Step 3: Navigate to products page and add items to cart
    await page.goto('/products');

    // Select the first product
    await page.click('.product-card a', { timeout: 5000 });

    // Wait for product page to load
    await page.waitForSelector('button:has-text("Add to Cart")');

    // Add to cart
    await page.click('button:has-text("Add to Cart")');

    // Wait for success notification
    await page.waitForSelector('text=Item added to cart');

    // Go to cart
    await page.click('[data-testid="cart-icon"]');

    // Verify item is in cart
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // Step 4: Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');

    // Wait for checkout page
    await page.waitForURL(/\/checkout/);

    // Step 5: Fill in shipping details if needed
    // Since we're logged in, this might be pre-filled
    const shippingForm = page.locator('[data-testid="shipping-form"]');
    if (await shippingForm.isVisible()) {
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="address1"]', '123 Main St');
      await page.fill('input[name="city"]', 'Anytown');
      await page.fill('input[name="state"]', 'CA');
      await page.fill('input[name="postalCode"]', '12345');
      await page.fill('input[name="phone"]', '555-123-4567');

      // Continue to next step
      await page.click('button:has-text("Continue")');
    }

    // Step 6: Select shipping method
    await page.click('input[name="shippingMethod"][value="standard"]');
    await page.click('button:has-text("Continue")');

    // Step 7: Fill in payment information
    // For testing, we'll use Stripe test card
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('input[name="cardNumber"]').fill('4242424242424242');
    await stripeFrame.locator('input[name="cardExpiry"]').fill('12/30');
    await stripeFrame.locator('input[name="cardCvc"]').fill('123');
    await stripeFrame.locator('input[name="billingName"]').fill('John Doe');

    // Complete order
    await page.click('button:has-text("Complete Order")');

    // Wait for order confirmation page
    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 30000 });

    // Step 8: Verify order confirmation
    await expect(page.locator('h1:has-text("Thank You for Your Order")')).toBeVisible();

    // Extract order number
    const orderNumberElement = page.locator('text=/Order #([A-Z0-9-]+)/');
    const orderNumberText = await orderNumberElement.textContent();
    let orderNumber = '';

    if (orderNumberText) {
      const match = orderNumberText.match(/Order #([A-Z0-9-]+)/);
      if (match && match[1]) {
        orderNumber = match[1];
        console.log(`Order number: ${orderNumber}`);
      }
    }

    expect(orderNumber).toBeTruthy();

    // Step 9: Navigate to order details page
    await page.click('a:has-text("View Order Details")');

    // Wait for order details page
    await page.waitForURL(/\/account\/orders\//);

    // Verify order details
    await expect(page.locator(`text=Order #${orderNumber}`)).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Verify order items
    await expect(page.locator('.order-item')).toBeVisible();

    // Clean up - optionally cancel the order for test environment
    if (page.locator('button:has-text("Cancel Order")').isVisible()) {
      await page.click('button:has-text("Cancel Order")');
      await page.waitForSelector('text=Order has been cancelled');
    }
  });

  test('order status updates correctly after payment processing', async ({ page }) => {
    // This test requires admin or backend access to simulate payment processing
    // For E2E test purposes, we'll use direct API calls or admin UI

    // Step 1: Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminPassword123');
    await page.click('button[type="submit"]');

    // Wait for admin dashboard
    await page.waitForURL('/admin/dashboard');

    // Step 2: Navigate to orders section
    await page.click('a:has-text("Orders")');

    // Wait for orders page
    await page.waitForURL('/admin/orders');

    // Step 3: Select most recent order (first in the list)
    await page.click('table tbody tr:first-child a:has-text("Details")');

    // Step 4: Update order status
    await page.selectOption('select[name="status"]', 'processing');
    await page.click('button:has-text("Update")');

    // Verify status updated
    await page.waitForSelector('text=Order status updated');

    // Step 5: Update payment status
    await page.selectOption('select[name="paymentStatus"]', 'paid');
    await page.click('button:has-text("Update")');

    // Verify payment status updated
    await page.waitForSelector('text=Payment status updated');

    // Step 6: Verify complete status update
    await page.selectOption('select[name="status"]', 'completed');
    await page.click('button:has-text("Update")');

    // Verify completed status
    await page.waitForSelector('text=Order status updated');

    // Step 7: Logout as admin
    await page.click('button:has-text("Log out")');

    // Step 8: Log in as customer to verify status
    await login(page);

    // Navigate to orders
    await page.goto('/account/orders');

    // Click on the latest order
    await page.click('table tbody tr:first-child a:has-text("View")');

    // Verify status is now completed
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Paid')).toBeVisible();
  });

  // Helper function to set up direct order state for resilient testing
  async function setupDirectOrderState(page, orderStatus) {
    // This demonstrates the "hybrid" approach mentioned in the testing guidelines
    // If UI interactions fail, we fall back to direct state manipulation

    try {
      // Try UI approach first
      await page.goto('/admin/orders');
      await page.click('table tbody tr:first-child a:has-text("Details")');
      await page.selectOption('select[name="status"]', orderStatus);
      await page.click('button:has-text("Update")');
      await page.waitForSelector('text=Order status updated');
    } catch (error) {
      console.log('UI approach failed, using direct API call');

      // Get the first order ID
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/orders?limit=1');
        const data = await res.json();
        return data.orders[0]?.id;
      });

      if (response) {
        // Update order directly via API
        await page.evaluate(
          async (orderId, status) => {
            await fetch(`/api/admin/orders/${orderId}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status }),
            });
          },
          response,
          orderStatus
        );
      }
    }
  }

  test('customer can view and track different order statuses', async ({ page }) => {
    // Use the resilient approach from the testing guidelines

    // Step 1: Log in as admin to set up the test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Step 2: Set up an order with "processing" status
    await setupDirectOrderState(page, 'processing');

    // Step 3: Log out admin and log in as customer
    await page.click('button:has-text("Log out")');
    await login(page);

    // Step 4: Navigate to orders and verify processing status
    await page.goto('/account/orders');
    await page.click('table tbody tr:first-child a:has-text("View")');
    await expect(page.locator('text=Processing')).toBeVisible();

    // Step 5: Log out customer and back in as admin
    await page.click('a:has-text("Log out")');
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminPassword123');
    await page.click('button[type="submit"]');

    // Step 6: Update to "completed" status
    await setupDirectOrderState(page, 'completed');

    // Step 7: Log back in as customer and verify completed status
    await page.click('button:has-text("Log out")');
    await login(page);

    // Step 8: Navigate to orders and verify completed status
    await page.goto('/account/orders');
    await page.click('table tbody tr:first-child a:has-text("View")');
    await expect(page.locator('text=Completed')).toBeVisible();

    // Step 9: Verify UI changes based on completed status
    // Cancel button should not be visible for completed orders
    await expect(page.locator('a:has-text("Cancel Order")')).not.toBeVisible();
  });
});
