import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Footer } from '../Footer';

// Mock the Link component from Remix
vi.mock('@remix-run/react', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock HeroIcons
vi.mock('@heroicons/react/24/outline', () => ({
  EnvelopeIcon: ({ className }: { className: string }) => (
    <span className={className} data-testid="envelope-icon">
      Email icon
    </span>
  ),
  PhoneIcon: ({ className }: { className: string }) => (
    <span className={className} data-testid="phone-icon">
      Phone icon
    </span>
  ),
  MapPinIcon: ({ className }: { className: string }) => (
    <span className={className} data-testid="map-pin-icon">
      Address icon
    </span>
  ),
  ChevronDownIcon: ({ className }: { className: string }) => (
    <span className={className} data-testid="chevron-down-icon">
      Expand icon
    </span>
  ),
}));

// Mock window resize for testing mobile view
const mockWindowInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Footer Component', () => {
  // Reset window size after each test
  afterEach(() => {
    mockWindowInnerWidth(1024); // Reset to desktop
  });
  it('renders all expected sections in desktop view', () => {
    mockWindowInnerWidth(1024); // Desktop width
    render(<Footer />);

    // Company information
    expect(screen.getByText('Notalock')).toBeInTheDocument();

    // Check for company description
    expect(
      screen.getByText(/Premium European door hardware solutions for homes and businesses/i)
    ).toBeInTheDocument();

    // Navigation categories
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();

    // Navigation links
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('New Arrivals')).toBeInTheDocument();
    expect(screen.getByText('Featured Products')).toBeInTheDocument();

    // Company links
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.getByText('Shipping Policy')).toBeInTheDocument();

    // Contact info
    expect(screen.getByTestId('envelope-icon')).toBeInTheDocument();
    expect(screen.getByText('support@notalock.com')).toBeInTheDocument();
    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    expect(
      screen.getByText('123 Commerce St, Suite 100, Business City, BC 12345')
    ).toBeInTheDocument();

    // Social media links
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();

    // Copyright
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Notalock`))).toBeInTheDocument();
  });

  it('collapses sections on mobile and expands them when clicked', () => {
    mockWindowInnerWidth(375); // Mobile width
    render(<Footer />);

    // Initially collapsed sections
    expect(screen.getByTestId('shop-links')).toHaveClass('hidden');
    expect(screen.getByTestId('company-links')).toHaveClass('hidden');
    expect(screen.getByTestId('contact-links')).toHaveClass('hidden');

    // Expand Shop section
    const shopHeader = screen.getByText('Shop');
    fireEvent.click(shopHeader);
    expect(screen.getByTestId('shop-links')).not.toHaveClass('hidden');

    // Expand Company section
    const companyHeader = screen.getByText('Company');
    fireEvent.click(companyHeader);
    expect(screen.getByTestId('company-links')).not.toHaveClass('hidden');

    // Expand Contact section
    const contactHeader = screen.getByText('Contact');
    fireEvent.click(contactHeader);
    expect(screen.getByTestId('contact-links')).not.toHaveClass('hidden');
  });

  it('has correct navigation links', () => {
    mockWindowInnerWidth(1024); // Desktop width
    render(<Footer />);

    // Shop links
    expect(screen.getByRole('link', { name: /All Products/i })).toHaveAttribute(
      'href',
      '/products'
    );
    expect(screen.getByRole('link', { name: /Categories/i })).toHaveAttribute(
      'href',
      '/categories'
    );
    expect(screen.getByRole('link', { name: /New Arrivals/i })).toHaveAttribute(
      'href',
      '/new-arrivals'
    );
    expect(screen.getByRole('link', { name: /Featured Products/i })).toHaveAttribute(
      'href',
      '/featured'
    );

    // Company links
    expect(screen.getByRole('link', { name: /About Us/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(screen.getByRole('link', { name: /Terms & Conditions/i })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(screen.getByRole('link', { name: /Shipping Policy/i })).toHaveAttribute(
      'href',
      '/shipping'
    );

    // Contact links
    expect(screen.getByRole('link', { name: 'support@notalock.com' })).toHaveAttribute(
      'href',
      'mailto:support@notalock.com'
    );
    expect(screen.getByRole('link', { name: '(555) 123-4567' })).toHaveAttribute(
      'href',
      'tel:+1-555-123-4567'
    );

    // Social links
    const socialLinks = [
      { name: 'Twitter', url: 'https://twitter.com/notalock' },
      { name: 'Facebook', url: 'https://facebook.com/notalock' },
      { name: 'Instagram', url: 'https://instagram.com/notalock' },
      { name: 'GitHub', url: 'https://github.com/notalock' },
    ];

    socialLinks.forEach(link => {
      // Use aria-label to find social links as they use sr-only for text
      expect(screen.getByRole('link', { name: link.name })).toHaveAttribute('href', link.url);
    });
  });

  it('displays current year in copyright text', () => {
    // Mock current date
    const mockDate = new Date(2025, 2, 15); // March 15, 2025
    const originalDate = global.Date;
    global.Date = class extends Date {
      constructor(...args: any[]) {
        super();
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...(args as []));
      }
      getFullYear() {
        if (this === mockDate) return 2025;
        return super.getFullYear();
      }
    } as DateConstructor;

    try {
      render(<Footer />);
      expect(screen.getByText(/© 2025 Notalock/)).toBeInTheDocument();
    } finally {
      global.Date = originalDate; // Restore original Date
    }
  });
});
