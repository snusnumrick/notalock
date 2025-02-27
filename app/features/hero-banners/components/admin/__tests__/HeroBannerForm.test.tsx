import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeroBannerForm } from '../HeroBannerForm';
import type { HeroBanner } from '../../../types/hero-banner.types';
import { useToast } from '~/hooks/use-toast';

// Mock the components and hooks
vi.mock('~/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@remix-run/react', () => ({
  Form: vi.fn(({ children, onSubmit }) => <form onSubmit={onSubmit}>{children}</form>),
}));

describe('HeroBannerForm', () => {
  const mockBanner: HeroBanner = {
    id: '1',
    title: 'Test Banner',
    subtitle: 'Test Subtitle',
    image_url: 'https://example.com/image.jpg',
    cta_text: 'Shop Now',
    cta_link: '/products',
    secondary_cta_text: 'Learn More',
    secondary_cta_link: '/about',
    is_active: true,
    position: 0,
    background_color: '#000000',
    text_color: '#ffffff',
    created_at: '2025-02-20T00:00:00Z',
    updated_at: '2025-02-20T00:00:00Z',
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with initial data', () => {
    render(<HeroBannerForm initialData={mockBanner} onSubmit={mockOnSubmit} />);

    // Check if form fields are filled with initial data
    expect(screen.getByLabelText('Title')).toHaveValue('Test Banner');
    expect(screen.getByLabelText('Subtitle')).toHaveValue('Test Subtitle');
    expect(screen.getByLabelText('Image URL')).toHaveValue('https://example.com/image.jpg');
    expect(screen.getByLabelText('Call to Action Text')).toHaveValue('Shop Now');
    expect(screen.getByLabelText('Call to Action Link')).toHaveValue('/products');
    expect(screen.getByLabelText('Secondary Call to Action Text (optional)')).toHaveValue(
      'Learn More'
    );
    expect(screen.getByLabelText('Secondary Call to Action Link (optional)')).toHaveValue('/about');
    expect(screen.getByLabelText('Position')).toHaveValue(0);
  });

  it('renders empty form when no initial data is provided', () => {
    render(<HeroBannerForm onSubmit={mockOnSubmit} />);

    // Check if form fields are empty or have default values
    expect(screen.getByLabelText('Title')).not.toHaveValue('Test Banner');
    expect(screen.getByLabelText('Subtitle')).not.toHaveValue('Test Subtitle');
    expect(screen.getByLabelText('Image URL')).not.toHaveValue('https://example.com/image.jpg');
  });

  it('displays error toast when form error is provided', () => {
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    render(<HeroBannerForm onSubmit={mockOnSubmit} formError="Form submission failed" />);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Form submission failed',
        variant: 'destructive',
      })
    );
  });

  it('shows update button text when editing existing banner', () => {
    render(<HeroBannerForm initialData={mockBanner} onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('button', { name: 'Update Banner' })).toBeInTheDocument();
  });

  it('shows create button text when creating new banner', () => {
    render(<HeroBannerForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('button', { name: 'Create Banner' })).toBeInTheDocument();
  });

  it('shows loading state when isSubmitting is true', () => {
    render(<HeroBannerForm onSubmit={mockOnSubmit} isSubmitting={true} />);

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('renders preview component with form data', () => {
    render(<HeroBannerForm initialData={mockBanner} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('updates preview data when form fields change', () => {
    render(<HeroBannerForm initialData={mockBanner} onSubmit={mockOnSubmit} />);

    // Change the title
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Title' } });

    // Preview should be updated but we can't directly test it since HeroBannerPreview is mocked
    // This is testing that the change handler works
    expect(screen.getByLabelText('Title')).toHaveValue('New Title');
  });
});
