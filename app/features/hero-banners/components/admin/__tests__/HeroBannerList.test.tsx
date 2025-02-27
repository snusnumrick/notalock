import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeroBannerList } from '../HeroBannerList';
import type { HeroBanner } from '../../../types/hero-banner.types';
import { useToast } from '~/hooks/use-toast';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Trash2: () => <span data-testid="trash-icon">Trash2</span>,
  ArrowUp: () => <span data-testid="arrow-up-icon">ArrowUp</span>,
  ArrowDown: () => <span data-testid="arrow-down-icon">ArrowDown</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Pencil: () => <span data-testid="pencil-icon">Pencil</span>,
}));

// Create mock function for fetcher with its submit method
const mockFetcherSubmit = vi.fn();
const mockFetcher = {
  submit: mockFetcherSubmit,
  state: 'idle',
  formData: null,
};

// Mock the components and hooks
vi.mock('~/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@remix-run/react', () => ({
  Link: vi.fn(({ to, children }) => <a href={to}>{children}</a>),
  useFetcher: vi.fn(() => mockFetcher),
}));

describe('HeroBannerList', () => {
  const mockBanners: HeroBanner[] = [
    {
      id: '1',
      title: 'First Banner',
      subtitle: 'First Banner Subtitle',
      image_url: 'https://example.com/image1.jpg',
      cta_text: 'Shop Now',
      cta_link: '/products',
      is_active: true,
      position: 0,
      created_at: '2025-02-20T00:00:00Z',
      updated_at: '2025-02-20T00:00:00Z',
    },
    {
      id: '2',
      title: 'Second Banner',
      subtitle: 'Second Banner Subtitle',
      image_url: 'https://example.com/image2.jpg',
      cta_text: 'Learn More',
      cta_link: '/about',
      is_active: false,
      position: 1,
      created_at: '2025-02-20T00:00:00Z',
      updated_at: '2025-02-20T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders banner list with correct titles', () => {
    render(<HeroBannerList banners={mockBanners} />);

    expect(screen.getByText('First Banner')).toBeInTheDocument();
    expect(screen.getByText('Second Banner')).toBeInTheDocument();
  });

  it('displays empty state when no banners are provided', () => {
    render(<HeroBannerList banners={[]} />);

    expect(screen.getByText('No Hero Banners Found')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first hero banner to display on your site.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Hero Banner/i })).toBeInTheDocument();
  });

  it('shows active/inactive status with correct badges', () => {
    render(<HeroBannerList banners={mockBanners} />);

    const activeBadges = screen.getAllByText('Active');
    const inactiveBadges = screen.getAllByText('Inactive');

    expect(activeBadges.length).toBe(1);
    expect(inactiveBadges.length).toBe(1);
  });

  it('renders edit links with correct URLs', () => {
    render(<HeroBannerList banners={mockBanners} />);

    const editLinks = screen.getAllByRole('link');
    const editFirstBannerLink = editLinks.find(
      link => link.getAttribute('href') === '/admin/hero-banners/1/edit'
    );
    const editSecondBannerLink = editLinks.find(
      link => link.getAttribute('href') === '/admin/hero-banners/2/edit'
    );

    expect(editFirstBannerLink).toBeInTheDocument();
    expect(editSecondBannerLink).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when delete button is clicked', () => {
    render(<HeroBannerList banners={mockBanners} />);

    // Find delete button by test ID
    const deleteButton = screen.getAllByTestId('trash-icon')[0];
    fireEvent.click(deleteButton);

    // Check if confirmation dialog is shown
    expect(screen.getByText('Delete Hero Banner')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete "First Banner"? This action cannot be undone.'
      )
    ).toBeInTheDocument();
  });

  it('submits delete form when confirmed', () => {
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    render(<HeroBannerList banners={mockBanners} />);

    // Find delete button by test ID and click it
    const deleteButton = screen.getAllByTestId('trash-icon')[0];
    fireEvent.click(deleteButton);

    // Click confirm button
    fireEvent.click(screen.getByRole('button', { name: 'Delete Banner' }));

    // Check if form was submitted
    expect(mockFetcherSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        get: expect.any(Function),
      }),
      expect.objectContaining({
        method: 'post',
      })
    );

    // Check if toast was shown
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Banner Deleted',
        description: '"First Banner" has been deleted.',
      })
    );
  });

  it('disables up button for first banner and down button for last banner', () => {
    render(<HeroBannerList banners={mockBanners} />);

    // Get buttons by test ID
    const firstUpButtonContainer = screen.getByTestId('arrow-up-button-0');
    const lastDownButtonContainer = screen.getByTestId('arrow-down-button-1');

    // Check if the buttons have the disabled attribute
    expect(firstUpButtonContainer).toHaveAttribute('disabled');
    expect(lastDownButtonContainer).toHaveAttribute('disabled');
  });
});
