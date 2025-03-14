# Shipping API

The Shipping API provides endpoints for calculating shipping rates, validating addresses, generating shipping labels, and managing shipping-related data.

## Base URL

All endpoints are relative to the base URL: `/api/shipping`

## Endpoints

### Calculate Shipping Rates

Calculates available shipping rates for a given address and package details.

```
POST /api/shipping/calculate-rates
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| address | object | Shipping address with country, state, city, postal code |
| items | array | Array of items with product ID, variant ID, quantity, weight, dimensions |
| currency | string | Currency code for rates (e.g., 'USD', 'EUR') |
| orderTotal | number | Total order amount for threshold-based rates |

#### Response

```json
{
  "rates": [
    {
      "methodId": "string",
      "methodName": "string",
      "carrierName": "string",
      "price": 9.99,
      "estimatedDeliveryDays": {
        "min": 3,
        "max": 5
      },
      "formattedEstimatedDelivery": "3-5 business days",
      "currency": "USD",
      "serviceName": "Standard Shipping"
    }
  ],
  "currency": "USD",
  "formattedAddress": "123 Main St, Anytown, CA 12345, USA"
}
```

### Validate Address

Validates and normalizes a shipping address.

```
POST /api/shipping/validate-address
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| address | object | Address with country, state, city, postal code, etc. |

#### Response

```json
{
  "valid": true,
  "normalized": {
    "country": "US",
    "countryName": "United States",
    "state": "CA",
    "stateName": "California",
    "city": "San Francisco",
    "postalCode": "94103",
    "addressLine1": "123 Main St",
    "addressLine2": "Suite 100"
  },
  "messages": [],
  "alternatives": []
}
```

### Get Shipping Zones

Retrieves available shipping zones.

```
GET /api/shipping/zones
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | (Optional) Filter by country |
| active | boolean | (Optional) Filter by active status |

#### Response

```json
{
  "zones": [
    {
      "id": "string",
      "name": "United States",
      "countries": ["US"],
      "states": ["CA", "NY", "TX"],
      "isActive": true
    }
  ]
}
```

### Get Shipping Methods

Retrieves available shipping methods for a specific zone.

```
GET /api/shipping/methods
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| zoneId | string | (Optional) Filter by zone ID |
| active | boolean | (Optional) Filter by active status |

#### Response

```json
{
  "methods": [
    {
      "id": "string",
      "name": "Standard Shipping",
      "description": "Delivery in 3-5 business days",
      "zoneId": "string",
      "carrierId": "string",
      "priceCalculationMethod": "flat_rate",
      "basePrice": 9.99,
      "minimumOrderAmount": 0,
      "isActive": true,
      "estimatedDeliveryDays": {
        "min": 3,
        "max": 5
      }
    }
  ]
}
```

### Generate Shipping Label

Generates a shipping label for an order.

```
POST /api/shipping/generate-label
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | The order ID to generate a label for |
| carrierId | string | The carrier ID to use for the label |
| serviceCode | string | The specific service code |
| packageDimensions | object | Package dimensions and weight |

#### Response

```json
{
  "success": true,
  "labelUrl": "https://example.com/labels/label.pdf",
  "trackingNumber": "1Z999AA10123456784",
  "carrierId": "string",
  "serviceName": "Standard Shipping",
  "estimatedDelivery": "2023-12-15"
}
```

## Error Responses

All endpoints return a standard error format in case of failure:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `INVALID_ADDRESS`: Invalid shipping address
- `NO_RATES_AVAILABLE`: No shipping rates available for the given parameters
- `CARRIER_ERROR`: Error from shipping carrier API
- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHORIZATION_ERROR`: Missing or invalid authorization

## Authentication

Administrative shipping API endpoints require authentication with appropriate permissions.

## Related Documentation

- [Shipping & Tax Calculations](../features/shipping-tax-calculations.md)
- [Checkout Process](../features/checkout.md)
