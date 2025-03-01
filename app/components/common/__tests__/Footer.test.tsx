import { render, screen } from '@testing-library/react';
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
}));

describe('Footer Component', () => {
  it('renders all expected sections', () => {
    render(<Footer />);

    // Company information
    expect(screen.getByText('Notalock')).toBeInTheDocument();

    // Check for company description - look for any paragraph after logo
    const paragraphs = screen.getAllByText(/.+/, { selector: 'p' });
    // Find the company description paragraph (it should be near the top and contain at least 10 characters)
    const descriptionParagraph = paragraphs.find(p => p.textContent && p.textContent.length > 10);
    expect(descriptionParagraph).toBeInTheDocument();

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

  it('has correct navigation links', () => {
    render(<Footer />);

    // Shop links
    // Using getByTestId would be better but for this test we can use text content
    const shopLinks = screen.getAllByRole('link');

    // Filter out all links in the page that have these texts
    const allProductsLink = shopLinks.find(link => link.textContent?.includes('All Products'));
    expect(allProductsLink).toHaveAttribute('href', '/products');

    const categoriesLink = shopLinks.find(link => link.textContent?.includes('Categories'));
    expect(categoriesLink).toHaveAttribute('href', '/categories');

    const newArrivalsLink = shopLinks.find(link => link.textContent?.includes('New Arrivals'));
    expect(newArrivalsLink).toHaveAttribute('href', '/new-arrivals');

    const featuredProductsLink = shopLinks.find(link =>
      link.textContent?.includes('Featured Products')
    );
    expect(featuredProductsLink).toHaveAttribute('href', '/featured');

    // Company links
    const aboutUsLink = shopLinks.find(link => link.textContent?.includes('About Us'));
    expect(aboutUsLink).toHaveAttribute('href', '/about');

    const privacyPolicyLink = shopLinks.find(link => link.textContent?.includes('Privacy Policy'));
    expect(privacyPolicyLink).toHaveAttribute('href', '/privacy');

    const termsLink = shopLinks.find(link => link.textContent?.includes('Terms & Conditions'));
    expect(termsLink).toHaveAttribute('href', '/terms');

    const shippingPolicyLink = shopLinks.find(link =>
      link.textContent?.includes('Shipping Policy')
    );
    expect(shippingPolicyLink).toHaveAttribute('href', '/shipping');

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
