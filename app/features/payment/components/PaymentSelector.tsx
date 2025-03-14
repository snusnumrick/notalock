import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { getPaymentService } from '../PaymentService';

interface PaymentSelectorProps {
  onPaymentTypeChange: (type: string, provider: string) => void;
  selectedProvider?: string;
  selectedType?: string;
  errors?: Record<string, string>;
}

/**
 * Payment method selector component
 * Displays payment options based on available providers
 */
export function PaymentSelector({
  onPaymentTypeChange,
  selectedProvider = 'mock',
  selectedType = 'credit_card',
  errors = {},
}: PaymentSelectorProps) {
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [activeProvider, setActiveProvider] = useState(selectedProvider);
  const [activeType, setActiveType] = useState(selectedType);

  // Load available payment providers
  useEffect(() => {
    const paymentService = getPaymentService();
    const availableProviders = paymentService.getAvailableProviders();
    setProviders(availableProviders);
  }, []);

  // Handle payment type change
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    onPaymentTypeChange(type, activeProvider);
  };

  // Handle provider change
  const handleProviderChange = (provider: string) => {
    setActiveProvider(provider);
    onPaymentTypeChange(activeType, provider);
  };

  return (
    <div className="space-y-4">
      {/* Provider selection - would typically be hidden in production */}
      {providers.length > 1 && (
        <div className="mb-4">
          <Label htmlFor="paymentProvider">Payment Provider</Label>
          <select
            id="paymentProvider"
            name="paymentProvider"
            value={activeProvider}
            onChange={e => handleProviderChange(e.target.value)}
            className="block w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
          >
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <input type="hidden" name="paymentProvider" value={activeProvider} />
      <input type="hidden" name="paymentType" value={activeType} />

      {/* Payment method tabs */}
      <Tabs defaultValue={activeType} onValueChange={handleTypeChange}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="credit_card">Credit Card</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
        </TabsList>

        <TabsContent value="credit_card">
          <Card>
            <CardContent className="pt-4">
              {/* Credit Card Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    name="cardholderName"
                    type="text"
                    className={errors.cardholderName ? 'border-red-500' : ''}
                    placeholder="John Smith"
                    required
                  />
                  {errors.cardholderName && (
                    <p className="text-sm text-red-500 mt-1">{errors.cardholderName}</p>
                  )}
                </div>

                {/* In a real implementation, this would be where we integrate with Square or Stripe Elements */}
                <div id="card-container" className="min-h-24 p-4 border rounded-md">
                  <p className="text-sm text-gray-600">
                    In a real implementation, this would integrate with the{' '}
                    {activeProvider === 'stripe' ? 'Stripe Elements' : 'Square Web Payments SDK'} to
                    securely collect and process payment information. For this demo, we&apos;ll
                    simply simulate the payment process.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paypal">
          <Card>
            <CardContent className="pt-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-600">
                  In a production environment, this would integrate with the PayPal SDK to redirect
                  to PayPal for secure payment. For this demo, we&apos;ll simulate the PayPal
                  payment flow.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {errors.paymentType && <p className="text-sm text-red-500 mt-1">{errors.paymentType}</p>}
    </div>
  );
}
