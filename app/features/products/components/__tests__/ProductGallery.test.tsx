// app/features/products/components/__tests__/ProductGallery.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProductGallery from '~/features/products/components/ProductGallery';

// Mock the Dialog component
vi.mock('~/components/ui/dialog', () => ({
  Dialog: vi
    .fn()
    .mockImplementation(({ children, open }) =>
      open ? <div data-testid="dialog-content">{children}</div> : null
    ),
  DialogContent: vi
    .fn()
    .mockImplementation(({ children }) => <div data-testid="dialog-body">{children}</div>),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="icon-left">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="icon-right">ChevronRight</div>,
  ZoomIn: () => <div data-testid="icon-zoom">ZoomIn</div>,
  X: () => <div data-testid="icon-close">X</div>,
}));

describe('ProductGallery Component', () => {
  // Mock image data
  const mockImages = [
    { id: 'img-1', url: '/image1.jpg', is_primary: true },
    { id: 'img-2', url: '/image2.jpg', is_primary: false },
    { id: 'img-3', url: '/image3.jpg', is_primary: false },
  ];

  // TouchEvent mock setup
  const createTouchEventMock = (clientX: number) => ({
    touches: [{ clientX }],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the gallery with images', () => {
    render(<ProductGallery images={mockImages} />);

    // Main image should be visible
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toBeInTheDocument();
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));

    // Thumbnails should be visible (3 images)
    const thumbnails = screen.getAllByRole('tab');
    expect(thumbnails).toHaveLength(3);
  });

  it('handles navigation between images with arrow buttons', async () => {
    render(<ProductGallery images={mockImages} />);

    // Initial state - first image selected
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));

    // Navigate to next image
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    // Should show the second image
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image2.jpg'));

    // Navigate to previous image
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);

    // Should return to the first image
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));
  });

  it('shows the correct image when clicking on a thumbnail', async () => {
    render(<ProductGallery images={mockImages} />);

    // Click on the third thumbnail
    const thumbnails = screen.getAllByRole('tab');
    fireEvent.click(thumbnails[2]);

    // Should show the third image
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image3.jpg'));
  });

  it('handles zoom toggle when clicking the zoom button', async () => {
    render(<ProductGallery images={mockImages} />);

    // Find and click zoom button
    const zoomButton = screen.getByLabelText('Toggle zoom');
    fireEvent.click(zoomButton);

    // Main image should have zoomed class
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toHaveClass('scale-150');

    // Click zoom button again to toggle off
    fireEvent.click(zoomButton);
    expect(mainImage).toHaveClass('scale-100');
  });

  it('opens the lightbox when clicking the fullscreen button', async () => {
    render(<ProductGallery images={mockImages} />);

    // Find and click fullscreen button
    const fullscreenButton = screen.getByLabelText('Open fullscreen view');
    fireEvent.click(fullscreenButton);

    // Lightbox dialog should be visible
    await waitFor(() => {
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });
  });

  it('handles touch swipe gestures to navigate images', async () => {
    render(<ProductGallery images={mockImages} />);

    const mainImageContainer = screen.getByRole('presentation');
    const mainImage = within(mainImageContainer).getByRole('img');

    // Start with first image
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));

    // Simulate touch start
    fireEvent.touchStart(mainImageContainer, createTouchEventMock(100));

    // Simulate touch move (swipe left)
    fireEvent.touchMove(mainImageContainer, createTouchEventMock(20));

    // Simulate touch end
    fireEvent.touchEnd(mainImageContainer);

    // Should show second image after left swipe
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image2.jpg'));

    // Now swipe right to go back
    fireEvent.touchStart(mainImageContainer, createTouchEventMock(20));
    fireEvent.touchMove(mainImageContainer, createTouchEventMock(100));
    fireEvent.touchEnd(mainImageContainer);

    // Should show first image again
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));
  });

  it('sorts images with primary image first', () => {
    // Shuffle the images to test sorting
    const shuffledImages = [
      { id: 'img-3', url: '/image3.jpg', is_primary: false },
      { id: 'img-1', url: '/image1.jpg', is_primary: true },
      { id: 'img-2', url: '/image2.jpg', is_primary: false },
    ];

    render(<ProductGallery images={shuffledImages} />);

    // First image should be the primary one (image1)
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));
  });

  it('applies image optimization parameters to image URLs', () => {
    render(<ProductGallery images={mockImages} />);

    // Main image should have optimization params
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('?width=800&format=webp'));

    // Thumbnails should have thumbnail optimization params
    const thumbnails = screen.getAllByRole('tab');
    const thumbnailImg = within(thumbnails[0]).getByRole('img');
    expect(thumbnailImg).toHaveAttribute(
      'src',
      expect.stringContaining('?width=150&height=150&format=webp')
    );
  });

  it('handles keyboard navigation for accessibility', async () => {
    render(<ProductGallery images={mockImages} />);

    // Navigate using keyboard - next image
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.keyDown(nextButton, { key: 'Enter' });

    // Should show second image
    const presentationElement = screen.getByRole('presentation');
    const mainImage = within(presentationElement).getByRole('img');
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image2.jpg'));

    // Navigate using keyboard - previous image
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.keyDown(prevButton, { key: 'Enter' });

    // Should show first image again
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('/image1.jpg'));
  });

  it('renders empty gallery gracefully when no images', () => {
    render(<ProductGallery images={[]} />);

    // Should not throw errors, but won't have main image
    const presentation = screen.queryByRole('presentation');
    expect(presentation).toBeInTheDocument();

    // Thumbnails should not exist
    const tablist = screen.queryByRole('tablist');
    expect(tablist).toBeEmptyDOMElement();
  });
});
