/**
 * Shared constants for cart functionality
 */

/**
 * Cookie name for anonymous cart ID
 * This is the single source of truth for the cookie name used across the application
 */
export const ANONYMOUS_CART_COOKIE_NAME = 'notalock_anonymous_cart';

/**
 * LocalStorage key for cart data
 */
export const CART_DATA_STORAGE_KEY = 'notalock_cart_data';

/**
 * LocalStorage key prefix for preferred cart
 */
export const PREFERRED_CART_PREFIX = 'preferred_cart_';

/**
 * LocalStorage key for current cart ID
 */
export const CURRENT_CART_ID_KEY = 'current_cart_id';

/**
 * A constant representing the name of the cookie used to trigger the clearing of the shopping cart.
 * This cookie is typically used in scenarios where the cart should be reset or emptied.
 *
 * The value assigned to this constant is the string identifier for the cookie.
 */
export const CLEAR_CART_COOKIE_NAME = 'notalock_cart_clear';

/**
 * A constant string that represents the name of the event triggered
 * when the cart count is updated.
 *
 * This event name can be used to listen for or dispatch events
 * related to updates in the number of items in a shopping cart.
 */
export const CART_COUNT_EVENT_NAME = 'cart-count-update';

export const CART_INDICATOR_EVENT_NAME = 'cart-indicator-update';
