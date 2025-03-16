import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { getPaymentService } from '../PaymentService';
import { SquarePaymentForm } from './providers/SquarePaymentForm';
import { StripePaymentForm } from './providers/StripePaymentForm';

interface PaymentSelectorProps {
  onPaymentTypeChange: (type: string, provider: string) => void;
  onPaymentMethodCreated?: (paymentMethodId: string, provider: string) => void;
  clientSecret?: string;
  // paymentIntentId removed as it's not currently used
  amount?: number;
  currency?: string;
  selectedProvider?: string;
  selectedType?: string;
  errors?: Record<string, string>;
  isProcessing?: boolean;
}

/**
 * Payment method selector component
 * Displays payment options based on available providers
 */
export function PaymentSelector({
  onPaymentTypeChange,
  onPaymentMethodCreated,
  clientSecret,
  amount = 0,
  currency = 'USD',
  selectedProvider = 'mock',
  selectedType = 'credit_card',
  errors = {},
  isProcessing = false,
}: PaymentSelectorProps) {
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [activeProvider, setActiveProvider] = useState(selectedProvider);
  const [activeType, setActiveType] = useState(selectedType);
  const [providerConfig, setProviderConfig] = useState<Record<string, unknown>>({});
  const [cardholderName, setCardholderName] = useState('');

  // Load available payment providers
  useEffect(() => {
    const paymentService = getPaymentService();
    const availableProviders = paymentService.getAvailableProviders();
    setProviders(availableProviders);

    // Load client config for the selected provider
    try {
      const config = paymentService.getClientConfig(selectedProvider);
      setProviderConfig(config);
    } catch (error) {
      console.error('Failed to load payment provider configuration:', error);
    }
  }, [selectedProvider]);

  // Handle payment type change
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    onPaymentTypeChange(type, activeProvider);
  };

  // Handle provider change
  const handleProviderChange = (provider: string) => {
    setActiveProvider(provider);
    onPaymentTypeChange(activeType, provider);

    // Load updated provider config
    const paymentService = getPaymentService();
    try {
      const config = paymentService.getClientConfig(provider);
      setProviderConfig(config);
    } catch (error) {
      console.error('Failed to load payment provider configuration:', error);
    }
  };

  // Handle payment method creation
  const handlePaymentMethodCreated = (paymentMethodId: string) => {
    if (onPaymentMethodCreated) {
      onPaymentMethodCreated(paymentMethodId, activeProvider);
    }
  };

  // Handle payment errors
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Here you would typically display the error to the user
  };

  return (
    <div className="space-y-4">
      {/* Provider selection - would typically be hidden in production for normal users */}
      {providers.length > 1 && (
        <div className="mb-4">
          <Label htmlFor="paymentProvider">Payment Provider</Label>
          <Select value={activeProvider} onValueChange={handleProviderChange}>
            <SelectTrigger id="paymentProvider" className="w-full">
              <SelectValue placeholder="Select payment provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          {activeProvider === 'square' &&
            typeof providerConfig.applicationId === 'string' &&
            typeof providerConfig.locationId === 'string' && (
              <SquarePaymentForm
                applicationId={providerConfig.applicationId as string}
                locationId={providerConfig.locationId as string}
                clientSecret={clientSecret}
                amount={amount}
                currency={currency}
                onPaymentMethodCreated={handlePaymentMethodCreated}
                onError={handlePaymentError}
                isProcessing={isProcessing}
              />
            )}

          {activeProvider === 'stripe' &&
            typeof providerConfig.publishableKey === 'string' &&
            clientSecret && (
              <StripePaymentForm
                publishableKey={providerConfig.publishableKey as string}
                clientSecret={clientSecret}
                amount={amount}
                currency={currency}
                onPaymentMethodCreated={handlePaymentMethodCreated}
                onError={handlePaymentError}
                isProcessing={isProcessing}
              />
            )}

          {activeProvider === 'mock' && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    name="cardholderName"
                    value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                    placeholder="John Smith"
                    required
                    disabled={isProcessing}
                    className={errors.cardholderName ? 'border-red-500' : ''}
                  />
                  {errors.cardholderName && (
                    <p className="text-sm text-red-500 mt-1">{errors.cardholderName}</p>
                  )}
                </div>

                {/* Mock credit card form for testing */}
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="4111 1111 1111 1111"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      placeholder="MM/YY"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" name="cvv" placeholder="123" required disabled={isProcessing} />
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center mt-2">
                  This is a mock payment form for testing purposes.
                  <br />
                  No real payment will be processed.
                </div>
              </CardContent>
            </Card>
          )}
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
