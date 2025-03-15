import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert';

interface SquarePaymentFormProps {
  applicationId: string;
  locationId: string;
  clientSecret?: string;
  orderId?: string;
  amount: number;
  currency: string;
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

/**
 * Square Payment Form Component
 * Integrates with Square Web Payments SDK to securely collect payment information
 */
export function SquarePaymentForm({
  applicationId,
  locationId,
  amount,
  currency,
  onPaymentMethodCreated,
  onError,
  isProcessing,
}: SquarePaymentFormProps) {
  const [cardholderName, setCardholderName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [cardElementLoaded, setCardElementLoaded] = useState(false);
  const [paymentFormInitialized, setPaymentFormInitialized] = useState(false);
  const [paymentForm, setPaymentForm] = useState<unknown>(null);
  const [card, setCard] = useState<unknown>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    // Early return if already initialized or if Square SDK is not loaded
    if (paymentFormInitialized || !window.Square) {
      return;
    }

    async function initializeSquarePayments() {
      try {
        // Create and initialize a payments instance
        const payments = await window.Square?.payments(applicationId, locationId);

        // Create card payment method
        const card = await payments.card();

        // Save references
        setPaymentForm(payments);
        setCard(card);
        setPaymentFormInitialized(true);

        // Attach card to container
        await card.attach('#square-card');
        setCardElementLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Square payments:', error);
        setLoadingError('Failed to load payment form. Please try again later.');
      }
    }

    // Load Square SDK if needed
    if (!window.Square) {
      // In a real implementation, we'd load the SDK dynamically here
      setLoadingError('Square SDK not loaded. Please refresh the page.');
    } else {
      initializeSquarePayments();
    }
  }, [applicationId, locationId, paymentFormInitialized]);

  // Handle payment submission
  const handleSubmitPayment = async () => {
    if (!card || !paymentForm || isProcessing) {
      return;
    }

    try {
      // Collect additional payment details
      // Not using paymentDetails currently
      const _paymentDetails = {
        amount,
        currency,
        intent: 'CHARGE', // or 'STORE' to save the card for later use
      };

      // Tokenize the card details
      const result = await card.tokenize();

      if (result.status === 'OK') {
        // Pass the payment token to the parent component
        onPaymentMethodCreated(result.token);
      } else {
        onError(result.errors?.[0]?.message || 'Failed to process card information');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onError(error instanceof Error ? error.message : 'An error occurred processing your payment');
    }
  };

  if (loadingError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{loadingError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="cardholderName">Cardholder Name</Label>
          <Input
            id="cardholderName"
            name="cardholderName"
            value={cardholderName}
            onChange={e => setCardholderName(e.target.value)}
            placeholder="Name as it appears on card"
            required
            disabled={isProcessing}
          />
        </div>

        <div>
          <Label htmlFor="square-card">Card Information</Label>
          <div
            id="square-card"
            className={`mt-1 p-3 border rounded-md min-h-[40px] ${!cardElementLoaded ? 'bg-gray-50' : ''}`}
          >
            {!cardElementLoaded && <p className="text-sm text-gray-400">Loading payment form...</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="postalCode">Postal / ZIP Code</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
            placeholder="Payment zip/postal code"
            required
            disabled={isProcessing}
          />
        </div>

        <Button
          type="button"
          className="w-full mt-4"
          onClick={handleSubmitPayment}
          disabled={!cardElementLoaded || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
        </Button>
      </CardContent>
    </Card>
  );
}
