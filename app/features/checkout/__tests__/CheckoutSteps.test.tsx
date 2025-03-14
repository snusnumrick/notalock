import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutSteps } from '../components/CheckoutSteps';
import { MemoryRouter } from 'react-router-dom';

describe('CheckoutSteps', () => {
  it('renders all steps', () => {
    render(
      <MemoryRouter>
        <CheckoutSteps currentStep="information" completedSteps={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  it('highlights the current step', () => {
    render(
      <MemoryRouter>
        <CheckoutSteps currentStep="shipping" completedSteps={['information']} />
      </MemoryRouter>
    );

    // Information step should be marked as completed
    expect(screen.getByRole('listitem', { name: /information/i })).toHaveClass('text-green-600');

    // Shipping step should be marked as active
    expect(screen.getByRole('listitem', { name: /shipping/i })).toHaveClass('text-blue-600');

    // Other steps should be inactive
    const paymentStep = screen.getByRole('listitem', { name: /payment/i });
    expect(paymentStep).not.toHaveClass('text-blue-600');
    expect(paymentStep).not.toHaveClass('text-green-600');
  });

  it('renders links for completed steps when sessionId is provided', () => {
    render(
      <MemoryRouter>
        <CheckoutSteps
          currentStep="payment"
          sessionId="session-123"
          completedSteps={['information', 'shipping']}
        />
      </MemoryRouter>
    );

    // Information step should be a link
    const informationLink = screen.getByRole('link', { name: /information/i });
    expect(informationLink).toHaveAttribute('href', '/checkout/information?session=session-123');

    // Shipping step should be a link
    const shippingLink = screen.getByRole('link', { name: /shipping/i });
    expect(shippingLink).toHaveAttribute('href', '/checkout/shipping?session=session-123');

    // Payment should not be a link (current step)
    expect(screen.queryByRole('link', { name: /payment/i })).toBeNull();

    // Review should not be a link (future step)
    expect(screen.queryByRole('link', { name: /review/i })).toBeNull();
  });

  it('does not render links when sessionId is not provided', () => {
    render(
      <MemoryRouter>
        <CheckoutSteps currentStep="payment" completedSteps={['information', 'shipping']} />
      </MemoryRouter>
    );

    // Information step should not be a link
    expect(screen.queryByRole('link', { name: /information/i })).toBeNull();

    // Shipping step should not be a link
    expect(screen.queryByRole('link', { name: /shipping/i })).toBeNull();
  });

  it('shows check icons for completed steps', () => {
    render(
      <MemoryRouter>
        <CheckoutSteps
          currentStep="review"
          completedSteps={['information', 'shipping', 'payment']}
        />
      </MemoryRouter>
    );

    // Count number of check icons (should be one for each completed step)
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons).toHaveLength(3);
  });
});
