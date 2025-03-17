/**
 * Order Search Service
 *
 * Provides advanced search capabilities for orders
 */

import type { Order, OrderStatus, PaymentStatus } from '../types';

/**
 * Order search options
 */
export interface OrderSearchOptions {
  query?: string; // Text search query
  orderIds?: string[]; // Search by specific order IDs
  orderNumbers?: string[]; // Search by specific order numbers
  customerIds?: string[]; // Search by customer ID
  emails?: string[]; // Search by customer email
  statuses?: OrderStatus[]; // Filter by order status
  paymentStatuses?: PaymentStatus[]; // Filter by payment status
  minDate?: Date; // Minimum order date
  maxDate?: Date; // Maximum order date
  minAmount?: number; // Minimum order amount
  maxAmount?: number; // Maximum order amount
  productIds?: string[]; // Orders containing specific products
  shippingCountries?: string[]; // Filter by shipping country
  exactMatch?: boolean; // Whether to require exact match for text search
  includeNotesInSearch?: boolean; // Whether to search in order notes
  limit?: number; // Maximum number of results
  offset?: number; // Results offset for pagination
  sortBy?: 'date' | 'total' | 'status'; // Sort field
  sortDirection?: 'asc' | 'desc'; // Sort direction
}

/**
 * Search result interface
 */
export interface OrderSearchResult {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Search for orders based on the provided options
 */
export function searchOrders(orders: Order[], options: OrderSearchOptions = {}): OrderSearchResult {
  let filteredOrders = [...orders];

  // Filter by specific order IDs
  if (options.orderIds && options.orderIds.length > 0) {
    filteredOrders = filteredOrders.filter(order => options.orderIds!.includes(order.id));
  }

  // Filter by specific order numbers
  if (options.orderNumbers && options.orderNumbers.length > 0) {
    filteredOrders = filteredOrders.filter(order =>
      options.orderNumbers!.includes(order.orderNumber)
    );
  }

  // Filter by customer ID
  if (options.customerIds && options.customerIds.length > 0) {
    filteredOrders = filteredOrders.filter(
      order => order.userId && options.customerIds!.includes(order.userId)
    );
  }

  // Filter by email
  if (options.emails && options.emails.length > 0) {
    filteredOrders = filteredOrders.filter(order => options.emails!.includes(order.email));
  }

  // Filter by status
  if (options.statuses && options.statuses.length > 0) {
    filteredOrders = filteredOrders.filter(order => options.statuses!.includes(order.status));
  }

  // Filter by payment status
  if (options.paymentStatuses && options.paymentStatuses.length > 0) {
    filteredOrders = filteredOrders.filter(order =>
      options.paymentStatuses!.includes(order.paymentStatus)
    );
  }

  // Filter by date range
  if (options.minDate) {
    const minDate = new Date(options.minDate);
    filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) >= minDate);
  }

  if (options.maxDate) {
    const maxDate = new Date(options.maxDate);
    filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) <= maxDate);
  }

  // Filter by amount range
  if (options.minAmount !== undefined) {
    filteredOrders = filteredOrders.filter(order => order.totalAmount >= options.minAmount!);
  }

  if (options.maxAmount !== undefined) {
    filteredOrders = filteredOrders.filter(order => order.totalAmount <= options.maxAmount!);
  }

  // Filter by product IDs
  if (options.productIds && options.productIds.length > 0) {
    filteredOrders = filteredOrders.filter(order => {
      return order.items.some(item => options.productIds!.includes(item.productId));
    });
  }

  // Filter by shipping country
  if (options.shippingCountries && options.shippingCountries.length > 0) {
    filteredOrders = filteredOrders.filter(order => {
      return (
        order.shippingAddress && options.shippingCountries!.includes(order.shippingAddress.country)
      );
    });
  }

  // Text search
  if (options.query) {
    const query = options.exactMatch ? options.query : options.query.toLowerCase();

    filteredOrders = filteredOrders.filter(order => {
      // Search in order number, email, customer name
      const orderNumber = options.exactMatch ? order.orderNumber : order.orderNumber.toLowerCase();
      const email = options.exactMatch ? order.email : order.email.toLowerCase();

      // Search in shipping and billing names if available
      let shippingName = '';
      if (order.shippingAddress) {
        shippingName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
        if (!options.exactMatch) {
          shippingName = shippingName.toLowerCase();
        }
      }

      let billingName = '';
      if (order.billingAddress) {
        billingName = `${order.billingAddress.firstName} ${order.billingAddress.lastName}`;
        if (!options.exactMatch) {
          billingName = billingName.toLowerCase();
        }
      }

      // Search in product names
      const productMatch = order.items.some(item => {
        const itemName = options.exactMatch ? item.name : item.name.toLowerCase();
        // Only use SKU if it exists
        if (item.sku) {
          const itemSku = options.exactMatch ? item.sku : item.sku.toLowerCase();
          return itemName.includes(query) || itemSku.includes(query);
        }
        return itemName.includes(query);
      });

      // Search in notes if requested
      let notesMatch = false;
      if (options.includeNotesInSearch && order.notes) {
        const notes = options.exactMatch ? order.notes : order.notes.toLowerCase();
        notesMatch = notes.includes(query);
      }

      // Check if any field matches the query
      return (
        orderNumber.includes(query) ||
        email.includes(query) ||
        shippingName.includes(query) ||
        billingName.includes(query) ||
        productMatch ||
        notesMatch
      );
    });
  }

  // Sort results
  if (options.sortBy) {
    filteredOrders.sort((a, b) => {
      const sortAsc = options.sortDirection !== 'desc';

      switch (options.sortBy) {
        case 'date': {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortAsc ? dateA - dateB : dateB - dateA;
        }

        case 'total':
          return sortAsc ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;

        case 'status': {
          const statusA = a.status;
          const statusB = b.status;
          return sortAsc ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
        }

        default:
          return 0;
      }
    });
  } else {
    // Default sorting by date, newest first
    filteredOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  // Calculate total before pagination
  const total = filteredOrders.length;

  // Apply pagination
  const limit = options.limit || total;
  const offset = options.offset || 0;

  filteredOrders = filteredOrders.slice(offset, offset + limit);

  return {
    orders: filteredOrders,
    total,
    limit,
    offset,
  };
}

/**
 * Quick search function that searches across common fields
 */
export function quickSearchOrders(orders: Order[], searchQuery: string): Order[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return [];
  }

  const query = searchQuery.toLowerCase().trim();

  return orders.filter(order => {
    // Check order number and email
    if (
      order.orderNumber.toLowerCase().includes(query) ||
      order.email.toLowerCase().includes(query)
    ) {
      return true;
    }

    // Check customer name in shipping address
    if (order.shippingAddress) {
      const name =
        `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.toLowerCase();
      if (name.includes(query)) {
        return true;
      }
    }

    // Check product names and SKUs
    return order.items.some(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      // Only check SKU if it exists
      if (item.sku) {
        return nameMatch || item.sku.toLowerCase().includes(query);
      }
      return nameMatch;
    });
  });
}

/**
 * Fuzzy search for orders by text
 */
export function fuzzySearchOrders(orders: Order[], query: string): Order[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  // Function to calculate simple similarity score (higher is better match)
  const calculateScore = (text: string, term: string): number => {
    if (!text) return 0;
    const lowercaseText = text.toLowerCase();

    // Exact match gets highest score
    if (lowercaseText === term) return 1.0;
    // Contains term gets good score
    if (lowercaseText.includes(term)) return 0.8;

    // Partial word matches
    const words = lowercaseText.split(/\s+/);
    for (const word of words) {
      if (word === term) return 0.7;
      if (word.startsWith(term)) return 0.6;
      if (word.includes(term)) return 0.4;
    }

    // Check for substrings with typos (very simple implementation)
    let maxScore = 0;
    for (let i = 0; i < lowercaseText.length - term.length + 1; i++) {
      const substring = lowercaseText.substring(i, i + term.length);
      let matches = 0;
      for (let j = 0; j < term.length; j++) {
        if (substring[j] === term[j]) {
          matches++;
        }
      }
      const score = (matches / term.length) * 0.3; // Lower score for partial character matches
      if (score > maxScore) {
        maxScore = score;
      }
    }

    return maxScore;
  };

  // Score each order for all search terms
  const scoredOrders = orders.map(order => {
    let score = 0;

    for (const term of searchTerms) {
      // Check various fields with different weights
      score += calculateScore(order.orderNumber, term) * 10; // Order number is most important
      score += calculateScore(order.email, term) * 5;

      if (order.shippingAddress) {
        score +=
          calculateScore(
            `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            term
          ) * 5;
      }

      // Check products (use highest score of any product)
      let maxProductScore = 0;
      for (const item of order.items) {
        const itemScore =
          calculateScore(item.name, term) * 3 + (item.sku ? calculateScore(item.sku, term) * 4 : 0);
        if (itemScore > maxProductScore) {
          maxProductScore = itemScore;
        }
      }

      score += maxProductScore;

      // Check notes
      if (order.notes) {
        score += calculateScore(order.notes, term) * 2;
      }
    }

    return { order, score };
  });

  // Filter out orders with zero score and sort by score
  return scoredOrders
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.order);
}
