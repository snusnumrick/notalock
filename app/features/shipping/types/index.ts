/**
 * Shipping system types
 */

/**
 * Represents a geographical shipping zone
 */
export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states?: string[];
  isActive: boolean;
}

/**
 * Shipping carrier (e.g., USPS, FedEx)
 */
export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  requiresCredentials: boolean;
  supportsTrackingNumbers: boolean;
  supportsLabelGeneration: boolean;
}

/**
 * Price calculation method for shipping
 */
export type ShippingPriceMethod =
  | 'flat_rate'
  | 'weight_based'
  | 'price_based'
  | 'distance_based'
  | 'carrier_api'
  | 'free';

/**
 * Shipping method configuration
 */
export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  carrierId?: string;
  priceCalculationMethod: ShippingPriceMethod;
  basePrice: number;
  minimumOrderAmount?: number;
  isActive: boolean;
  estimatedDeliveryDays?: {
    min: number;
    max: number;
  };
}

/**
 * Package dimensions and weight
 */
export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: 'cm' | 'in';
  weightUnit: 'kg' | 'lb' | 'oz';
}

/**
 * Shipping rate results
 */
export interface ShippingRate {
  methodId: string;
  methodName: string;
  carrierName?: string;
  price: number;
  estimatedDeliveryDays?: {
    min: number;
    max: number;
  };
  formattedEstimatedDelivery?: string;
  currency: string;
  serviceName: string;
  carrierLogo?: string;
}

/**
 * Shipping rule types
 */
export type ShippingRuleType =
  | 'free_shipping_threshold'
  | 'weight_surcharge'
  | 'remote_area_surcharge'
  | 'handling_fee'
  | 'discount';

/**
 * Shipping rule configuration
 */
export interface ShippingRule {
  id: string;
  name: string;
  type: ShippingRuleType;
  condition: never; // This would be a complex type based on rule type
  action: never; // This would be a complex type based on rule type
  priority: number;
  isActive: boolean;
}

/**
 * Request parameters for shipping rate calculation
 */
export interface ShippingRateRequest {
  address: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    price: number;
  }[];
  currency: string;
  orderTotal: number;
}

/**
 * Response from shipping rate calculation
 */
export interface ShippingRateResponse {
  rates: ShippingRate[];
  errors?: string[];
  currency: string;
  formattedAddress?: string;
}
