/**
 * Tax system types
 */

/**
 * Tax jurisdiction (location-based tax authority)
 */
export interface TaxJurisdiction {
  id: string;
  name: string;
  country: string;
  state?: string;
  county?: string;
  city?: string;
  postalCodePattern?: string;
  isActive: boolean;
}

/**
 * Tax category for products
 */
export interface TaxCategory {
  id: string;
  name: string;
  description: string;
  isExempt: boolean;
  isActive: boolean;
}

/**
 * Tax rate configuration
 */
export interface TaxRate {
  id: string;
  jurisdictionId: string;
  categoryId?: string; // If null, applies to all categories
  rate: number; // Decimal, e.g., 0.08 for 8%
  isCompound: boolean;
  priority: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * Tax exemption certificate
 */
export interface TaxExemptionCertificate {
  id: string;
  customerId: string;
  certificateNumber: string;
  issuer: string;
  jurisdictionId: string;
  expirationDate?: string;
  documentUrl?: string;
  isVerified: boolean;
  isActive: boolean;
}

/**
 * Tax calculation request parameters
 */
export interface TaxCalculationRequest {
  toAddress: {
    country: string;
    state?: string;
    county?: string;
    city?: string;
    postalCode?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  fromAddress?: {
    country: string;
    state?: string;
    county?: string;
    city?: string;
    postalCode?: string;
  };
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    taxCategoryId?: string;
    taxCode?: string;
  }[];
  customerId?: string;
  exemptionCertificateId?: string;
  shipping: number;
  currencyCode: string;
}

/**
 * Tax calculation result
 */
export interface TaxCalculationResult {
  totalTax: number;
  taxesByJurisdiction: {
    jurisdictionId: string;
    jurisdictionName: string;
    taxType: string;
    taxRate: number;
    taxAmount: number;
  }[];
  taxesByItem: {
    itemIndex: number;
    taxAmount: number;
    taxableAmount: number;
    taxRate: number;
    exemptAmount?: number;
  }[];
  shippingTax: number;
  exemptAmount: number;
  taxableAmount: number;
  timestamp: string;
  currencyCode: string;
}

/**
 * Tax provider type (external tax calculation services)
 */
export type TaxProviderType = 'manual' | 'avalara' | 'taxjar' | 'vertex';

/**
 * Tax provider configuration
 */
export interface TaxProviderConfig {
  id: string;
  type: TaxProviderType;
  name: string;
  isActive: boolean;
  config: Record<string, never>;
  priority: number;
}

/**
 * Tax report type
 */
export type TaxReportType = 'sales_tax' | 'vat' | 'gst' | 'customs';

/**
 * Tax report request
 */
export interface TaxReportRequest {
  reportType: TaxReportType;
  startDate: string;
  endDate: string;
  jurisdictions?: string[];
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
}
