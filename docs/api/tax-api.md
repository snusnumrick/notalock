# Tax API

The Tax API provides endpoints for tax calculation, tax rate retrieval, tax exemption management, and tax compliance functions.

## Base URL

All endpoints are relative to the base URL: `/api/tax`

## Endpoints

### Calculate Tax

Calculates tax for a given address and list of items.

```
POST /api/tax/calculate
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| toAddress | object | Destination address with country, state, city, postal code |
| fromAddress | object | (Optional) Origin address for sourcing rules |
| items | array | Array of items with product ID, variant ID, quantity, price, tax category |
| customerId | string | (Optional) Customer ID for exemption status |
| exemptionCertificateId | string | (Optional) Tax exemption certificate ID |
| shipping | number | Shipping amount for shipping tax calculation |
| currencyCode | string | Currency code (e.g., 'USD', 'EUR') |

#### Response

```json
{
  "totalTax": 8.55,
  "taxesByJurisdiction": [
    {
      "jurisdictionId": "string",
      "jurisdictionName": "California",
      "taxType": "state",
      "taxRate": 0.0625,
      "taxAmount": 6.25
    },
    {
      "jurisdictionId": "string",
      "jurisdictionName": "Los Angeles County",
      "taxType": "county",
      "taxRate": 0.01,
      "taxAmount": 1.00
    }
  ],
  "taxesByItem": [
    {
      "itemIndex": 0,
      "taxAmount": 5.00,
      "taxableAmount": 50.00,
      "taxRate": 0.1,
      "exemptAmount": 0
    }
  ],
  "shippingTax": 0.50,
  "exemptAmount": 0,
  "taxableAmount": 85.50,
  "timestamp": "2023-12-01T12:00:00Z",
  "currencyCode": "USD"
}
```

### Get Tax Rates

Retrieves tax rates for a specific location.

```
GET /api/tax/rates
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Country code |
| state | string | (Optional) State/province code |
| city | string | (Optional) City |
| postalCode | string | (Optional) Postal/ZIP code |
| categoryId | string | (Optional) Product category ID |

#### Response

```json
{
  "rates": [
    {
      "jurisdictionId": "string",
      "jurisdictionName": "California",
      "taxType": "state",
      "taxRate": 0.0625,
      "categoryId": null,
      "isCompound": false
    },
    {
      "jurisdictionId": "string",
      "jurisdictionName": "Los Angeles County",
      "taxType": "county",
      "taxRate": 0.01,
      "categoryId": null,
      "isCompound": false
    }
  ],
  "combinedRate": 0.0725,
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### Get Tax Categories

Retrieves available tax categories.

```
GET /api/tax/categories
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| active | boolean | (Optional) Filter by active status |

#### Response

```json
{
  "categories": [
    {
      "id": "string",
      "name": "General",
      "description": "Standard taxable products",
      "isExempt": false,
      "isActive": true
    },
    {
      "id": "string",
      "name": "Food",
      "description": "Food and grocery items",
      "isExempt": true,
      "isActive": true
    }
  ]
}
```

### Validate Tax Exemption Certificate

Validates a tax exemption certificate.

```
POST /api/tax/validate-exemption
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| certificateNumber | string | The exemption certificate number |
| jurisdictionId | string | The jurisdiction ID |
| customerName | string | The customer name |

#### Response

```json
{
  "valid": true,
  "expirationDate": "2025-12-31",
  "jurisdictions": ["string"],
  "exemptionType": "RESALE",
  "messages": []
}
```

### Generate Tax Report

Generates a tax report for a given period.

```
POST /api/tax/reports
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| reportType | string | Type of report (sales_tax, vat, gst) |
| startDate | string | Start date (YYYY-MM-DD) |
| endDate | string | End date (YYYY-MM-DD) |
| jurisdictions | array | (Optional) Array of jurisdiction IDs |
| format | string | Output format (csv, xlsx, pdf, json) |

#### Response

```json
{
  "success": true,
  "reportUrl": "https://example.com/reports/tax-report.pdf",
  "reportId": "string",
  "generatedAt": "2023-12-01T12:00:00Z"
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

- `INVALID_ADDRESS`: Invalid address for tax calculation
- `INVALID_CERTIFICATE`: Invalid tax exemption certificate
- `TAX_PROVIDER_ERROR`: Error from tax provider API
- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHORIZATION_ERROR`: Missing or invalid authorization

## Authentication

Administrative tax API endpoints require authentication with appropriate permissions.

## Related Documentation

- [Shipping & Tax Calculations](../features/shipping-tax-calculations.md)
- [Checkout Process](../features/checkout.md)
