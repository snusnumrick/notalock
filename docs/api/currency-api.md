# Currency API

The Currency API provides endpoints for currency conversion, exchange rate management, and currency formatting functions.

## Base URL

All endpoints are relative to the base URL: `/api/currency`

## Endpoints

### Convert Currency

Converts an amount from one currency to another.

```
POST /api/currency/convert
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| amount | number | The amount to convert |
| fromCurrency | string | Source currency code (e.g., 'USD') |
| toCurrency | string | Target currency code (e.g., 'EUR') |

#### Response

```json
{
  "originalAmount": 100,
  "originalCurrency": "USD",
  "convertedAmount": 91.25,
  "convertedCurrency": "EUR",
  "exchangeRate": 0.9125,
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### Get Exchange Rates

Retrieves current exchange rates.

```
GET /api/currency/rates
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| baseCurrency | string | (Optional) Base currency code (default: store default) |
| currencies | string | (Optional) Comma-separated list of currency codes |

#### Response

```json
{
  "baseCurrency": "USD",
  "rates": {
    "EUR": 0.9125,
    "GBP": 0.78,
    "CAD": 1.35,
    "JPY": 148.25
  },
  "timestamp": "2023-12-01T12:00:00Z",
  "source": "openexchangerates"
}
```

### Get Currencies

Retrieves available currencies.

```
GET /api/currency/currencies
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| active | boolean | (Optional) Filter by active status |

#### Response

```json
{
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "exchangeRate": 1,
      "decimalPrecision": 2,
      "thousandSeparator": ",",
      "decimalSeparator": ".",
      "symbolPosition": "before",
      "isActive": true,
      "isDefault": true
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "exchangeRate": 0.9125,
      "decimalPrecision": 2,
      "thousandSeparator": ".",
      "decimalSeparator": ",",
      "symbolPosition": "after",
      "isActive": true,
      "isDefault": false
    }
  ]
}
```

### Format Price

Formats a price according to a currency's formatting rules.

```
POST /api/currency/format
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| amount | number | The amount to format |
| currencyCode | string | Currency code |
| options | object | (Optional) Formatting options |

#### Response

```json
{
  "formatted": "$1,234.56",
  "amount": 1234.56,
  "currencyCode": "USD",
  "parts": {
    "symbol": "$",
    "integer": "1,234",
    "decimal": "56",
    "decimalSeparator": "."
  }
}
```

### Get Regional Price Adjustments

Retrieves price adjustments for specific regions or currencies.

```
GET /api/currency/price-adjustments
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| currencyCode | string | (Optional) Currency code |
| productId | string | (Optional) Product ID |
| categoryId | string | (Optional) Category ID |
| active | boolean | (Optional) Filter by active status |

#### Response

```json
{
  "adjustments": [
    {
      "id": "string",
      "currencyCode": "EUR",
      "productId": null,
      "categoryId": "string",
      "adjustmentType": "percentage",
      "adjustmentValue": 5,
      "priority": 1,
      "isActive": true
    }
  ]
}
```

### Update Exchange Rates

Updates exchange rates from external provider.

```
POST /api/currency/update-rates
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | (Optional) Provider to use (default: configured provider) |
| manual | boolean | (Optional) Whether to use manual rates |
| rates | object | (Optional) Manual exchange rates by currency code |

#### Response

```json
{
  "success": true,
  "updatedCurrencies": ["EUR", "GBP", "CAD"],
  "timestamp": "2023-12-01T12:00:00Z",
  "provider": "openexchangerates"
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

- `INVALID_CURRENCY`: Invalid currency code
- `CONVERSION_ERROR`: Currency conversion error
- `PROVIDER_ERROR`: Error from exchange rate provider
- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHORIZATION_ERROR`: Missing or invalid authorization

## Authentication

Administrative currency API endpoints require authentication with appropriate permissions.

## Related Documentation

- [Shipping & Tax Calculations](../features/shipping-tax-calculations.md)
- [Checkout Process](../features/checkout.md)
