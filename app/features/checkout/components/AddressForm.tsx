import type { Address } from '../types/checkout.types';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
// import { Select } from '~/components/ui/select';

interface AddressFormProps {
  address?: Partial<Address>;
  errors?: Partial<Record<keyof Address, string>>;
  fieldPrefix?: string;
  requireEmail?: boolean;
  readOnly?: boolean;
}

/**
 * Form component for address input
 */
export function AddressForm({
  address = {},
  errors = {},
  fieldPrefix = '',
  requireEmail = false,
  readOnly = false,
}: AddressFormProps) {
  const prefix = fieldPrefix ? `${fieldPrefix}_` : '';

  // List of countries
  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
  ];

  // Common US states
  const usStates = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' },
  ];

  // If in readonly mode, render as formatted address
  if (readOnly && address) {
    return (
      <div className="space-y-1">
        <p className="font-medium">
          {address.firstName} {address.lastName}
        </p>
        {address.email && <p>{address.email}</p>}
        {address.phone && <p>{address.phone}</p>}
        <p>{address.address1}</p>
        {address.address2 && <p>{address.address2}</p>}
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{countries.find(c => c.value === address.country)?.label || address.country}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}firstName`}>First Name *</Label>
          <Input
            id={`${prefix}firstName`}
            name={`${prefix}firstName`}
            defaultValue={address.firstName || ''}
            aria-invalid={errors.firstName ? 'true' : undefined}
            className={errors.firstName ? 'border-red-500' : ''}
            required
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <Label htmlFor={`${prefix}lastName`}>Last Name *</Label>
          <Input
            id={`${prefix}lastName`}
            name={`${prefix}lastName`}
            defaultValue={address.lastName || ''}
            aria-invalid={errors.lastName ? 'true' : undefined}
            className={errors.lastName ? 'border-red-500' : ''}
            required
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {(requireEmail || !fieldPrefix) && (
        <div>
          <Label htmlFor={`${prefix}email`}>Email {requireEmail ? '*' : ''}</Label>
          <Input
            id={`${prefix}email`}
            name={`${prefix}email`}
            type="email"
            defaultValue={address.email || ''}
            aria-invalid={errors.email ? 'true' : undefined}
            className={errors.email ? 'border-red-500' : ''}
            required={requireEmail}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>
      )}

      <div>
        <Label htmlFor={`${prefix}phone`}>Phone Number *</Label>
        <Input
          id={`${prefix}phone`}
          name={`${prefix}phone`}
          type="tel"
          defaultValue={address.phone || ''}
          aria-invalid={errors.phone ? 'true' : undefined}
          className={errors.phone ? 'border-red-500' : ''}
          required
          placeholder="e.g. +1 (555) 123-4567"
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor={`${prefix}address1`}>Address Line 1 *</Label>
        <Input
          id={`${prefix}address1`}
          name={`${prefix}address1`}
          defaultValue={address.address1 || ''}
          aria-invalid={errors.address1 ? 'true' : undefined}
          className={errors.address1 ? 'border-red-500' : ''}
          required
        />
        {errors.address1 && <p className="text-sm text-red-500 mt-1">{errors.address1}</p>}
      </div>

      <div>
        <Label htmlFor={`${prefix}address2`}>Address Line 2</Label>
        <Input
          id={`${prefix}address2`}
          name={`${prefix}address2`}
          defaultValue={address.address2 || ''}
          aria-invalid={errors.address2 ? 'true' : undefined}
          className={errors.address2 ? 'border-red-500' : ''}
        />
        {errors.address2 && <p className="text-sm text-red-500 mt-1">{errors.address2}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}city`}>City *</Label>
          <Input
            id={`${prefix}city`}
            name={`${prefix}city`}
            defaultValue={address.city || ''}
            aria-invalid={errors.city ? 'true' : undefined}
            className={errors.city ? 'border-red-500' : ''}
            required
          />
          {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
        </div>
        <div>
          <Label htmlFor={`${prefix}state`}>State/Province *</Label>
          <select
            id={`${prefix}state`}
            name={`${prefix}state`}
            defaultValue={address.state || ''}
            aria-invalid={errors.state ? 'true' : undefined}
            className={`flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.state ? 'border-red-500' : 'border-input'}`}
            required
          >
            <option value="">Select State/Province</option>
            {usStates.map(state => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}postalCode`}>Postal/Zip Code *</Label>
          <Input
            id={`${prefix}postalCode`}
            name={`${prefix}postalCode`}
            defaultValue={address.postalCode || ''}
            aria-invalid={errors.postalCode ? 'true' : undefined}
            className={errors.postalCode ? 'border-red-500' : ''}
            required
          />
          {errors.postalCode && <p className="text-sm text-red-500 mt-1">{errors.postalCode}</p>}
        </div>
        <div>
          <Label htmlFor={`${prefix}country`}>Country *</Label>
          <select
            id={`${prefix}country`}
            name={`${prefix}country`}
            defaultValue={address.country || 'US'}
            aria-invalid={errors.country ? 'true' : undefined}
            className={`flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.country ? 'border-red-500' : 'border-input'}`}
            required
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
        </div>
      </div>
    </div>
  );
}
