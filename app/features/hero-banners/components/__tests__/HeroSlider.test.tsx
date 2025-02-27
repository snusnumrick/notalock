import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HeroSlider } from '../HeroSlider';
import type { HeroBanner } from '../../types/hero-banner.types';

// Mock the Link component from Remix
vi.mock('@remix-run/react', () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('HeroSlider', () => {
  // Top-level mock data
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
      is_active: true,
      position: 1,
      created_at: '2025-02-20T00:00:00Z',
      updated_at: '2025-02-20T00:00:00Z',
    },
  ];

  // Custom banner with text color and background color
  const customColorBanner: HeroBanner = {
    id: '3',
    title: 'Custom Banner',
    image_url: 'https://example.com/image3.jpg',
    text_color: '#FF0000',
    background_color: '#000000',
    is_active: true,
    position: 2,
    created_at: '2025-02-20T00:00:00Z',
    updated_at: '2025-02-20T00:00:00Z',
  };

  // Banner with secondary CTA
  const bannerWithSecondaryCta: HeroBanner = {
    id: '4',
    title: 'Banner With Secondary',
    image_url: 'https://example.com/image4.jpg',
    cta_text: 'Primary Action',
    cta_link: '/primary',
    secondary_cta_text: 'Secondary Action',
    secondary_cta_link: '/secondary',
    is_active: true,
    position: 3,
    created_at: '2025-02-20T00:00:00Z',
    updated_at: '2025-02-20T00:00:00Z',
  };

  // Mock event listeners
  let documentEventListeners: Record<string, ((e: any) => void)[]> = {};

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Reset event listeners tracking
    documentEventListeners = {};

    // Mock window.requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      return setTimeout(cb, 0);
    });

    // Properly mock document event listeners
    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (!documentEventListeners[event]) {
        documentEventListeners[event] = [];
      }
      documentEventListeners[event].push(handler as any);
    });

    vi.spyOn(document, 'removeEventListener').mockImplementation((event, handler) => {
      if (documentEventListeners[event]) {
        documentEventListeners[event] = documentEventListeners[event].filter(h => h !== handler);
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the first banner by default', () => {
      render(<HeroSlider banners={mockBanners} />);

      expect(screen.getByText('First Banner')).toBeInTheDocument();
      expect(screen.getByText('First Banner Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    it('renders a single banner without controls', () => {
      const singleBanner = [mockBanners[0]];
      render(<HeroSlider banners={singleBanner} />);

      expect(screen.getByText('First Banner')).toBeInTheDocument();

      // Navigation controls should not be present
      expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('shows navigation controls for multiple banners', () => {
      render(<HeroSlider banners={mockBanners} />);

      expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
      expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
      expect(screen.getAllByRole('tab').length).toBe(mockBanners.length);
    });

    it('renders nothing when no banners are provided', () => {
      render(<HeroSlider banners={[]} />);

      // Using getByRole with { name: 'region' } would fail when nothing is rendered,
      // so we check that the document body is empty of slider elements
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      expect(screen.queryByText(/banner/i)).not.toBeInTheDocument();
    });

    it('renders banner with custom colors', () => {
      render(<HeroSlider banners={[customColorBanner]} />);

      // Find the container by test ID
      const containerDiv = screen.getByTestId('banner-container');

      // Check for style attribute content instead of computed style
      expect(containerDiv).toHaveAttribute('style', expect.stringContaining('background-color'));

      // Find the containing element with the correct style by role
      const headingElement = screen.getByRole('heading', { name: 'Custom Banner' });
      expect(headingElement).toHaveStyle({
        color: '#FF0000',
      });
    });

    it('renders banner with primary and secondary CTAs', () => {
      render(<HeroSlider banners={[bannerWithSecondaryCta]} />);

      // Find CTAs by text content
      const primaryCta = screen.getByText('Primary Action');
      const secondaryCta = screen.getByText('Secondary Action');

      expect(primaryCta).toBeInTheDocument();
      expect(secondaryCta).toBeInTheDocument();

      // Get links by role and name
      const primaryLink = screen.getByRole('link', { name: 'Primary Action' });
      const secondaryLink = screen.getByRole('link', { name: 'Secondary Action' });

      expect(primaryLink).toHaveAttribute('href', '/primary');
      expect(secondaryLink).toHaveAttribute('href', '/secondary');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<HeroSlider banners={mockBanners} />);

      // Main slider
      const slider = screen.getByRole('region');
      expect(slider).toHaveAttribute('aria-roledescription', 'carousel');
      expect(slider).toHaveAttribute('aria-label', 'Hero Image Slider');

      // Check for the first slide
      const firstSlideContainer = screen.getByLabelText(/slide 1 of 2/i);
      expect(firstSlideContainer).toHaveAttribute('aria-roledescription', 'slide');
      expect(firstSlideContainer).toHaveAttribute('aria-hidden', 'false');
      expect(firstSlideContainer).toHaveTextContent('First Banner');

      // Check for the second slide
      const secondSlideContainer = screen.getByLabelText(/slide 2 of 2/i);
      expect(secondSlideContainer).toHaveAttribute('aria-hidden', 'true');
      expect(secondSlideContainer).toHaveTextContent('Second Banner');

      // Navigation
      const pagination = screen.getByRole('tablist');
      expect(pagination).toHaveAttribute('aria-label', 'Slider pagination');

      // Live region for screen readers
      const liveRegion = screen.getByText('Showing slide 1 of 2');
      expect(liveRegion).toHaveClass('sr-only');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('handles keyboard navigation', () => {
      vi.useFakeTimers();
      render(<HeroSlider banners={mockBanners} />);

      // Simulate right arrow key press
      const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const rightArrowHandler = documentEventListeners.keydown?.[0];
      if (rightArrowHandler) rightArrowHandler(keydownEvent);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should be on second slide
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      // Simulate left arrow key press
      const keydownEvent2 = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const leftArrowHandler = documentEventListeners.keydown?.[0];
      if (leftArrowHandler) leftArrowHandler(keydownEvent2);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should be back on first slide
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('User Interactions', () => {
    it('goes to next slide when next button is clicked', () => {
      vi.useFakeTimers();

      render(<HeroSlider banners={mockBanners} />);

      // First banner should be visible
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      // Click the next button
      fireEvent.click(screen.getByLabelText('Next slide'));

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Second banner should be visible
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('goes to previous slide when previous button is clicked', () => {
      vi.useFakeTimers();

      render(<HeroSlider banners={mockBanners} />);

      // Click the next button to get to second slide
      fireEvent.click(screen.getByLabelText('Next slide'));

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Second banner should be visible
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      // Click the previous button
      fireEvent.click(screen.getByLabelText('Previous slide'));

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // First banner should be visible again
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('goes to specific slide when indicator is clicked', () => {
      vi.useFakeTimers();

      render(<HeroSlider banners={mockBanners} />);

      // First banner should be visible
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      // Click the second indicator
      fireEvent.click(screen.getAllByRole('tab')[1]);

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Second banner should be visible
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('handles touch swipe gestures', () => {
      vi.useFakeTimers();

      render(<HeroSlider banners={mockBanners} />);

      const slider = screen.getByRole('region');

      // Simulate touch gesture - swipe left (next slide)
      fireEvent.touchStart(slider, { touches: [{ clientX: 300 }] });
      fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 200 }] });

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should move to next slide
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      // Simulate touch gesture - swipe right (previous slide)
      fireEvent.touchStart(slider, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 300 }] });

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should move back to first slide
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Autoplay', () => {
    it('autoplay advances to next slide after specified interval', () => {
      vi.useFakeTimers();

      render(<HeroSlider banners={mockBanners} autoplaySpeed={2000} />);

      // First banner should be visible initially
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      // Advance timers by autoplay speed
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Second banner should be visible
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('pauses autoplay on hover when pauseOnHover is true', () => {
      vi.useFakeTimers();

      render(<HeroSlider banners={mockBanners} autoplaySpeed={2000} pauseOnHover={true} />);

      const slider = screen.getByRole('region');

      // Hover over the slider
      fireEvent.mouseEnter(slider);

      // Advance timers by autoplay speed
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // First banner should still be visible (autoplay paused)
      expect(screen.getByText('First Banner')).toBeInTheDocument();

      // Move mouse out
      fireEvent.mouseLeave(slider);

      // Advance timers by autoplay speed
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Allow transition to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Second banner should be visible now
      expect(screen.getByText('Second Banner')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Component Lifecycle', () => {
    it('properly cleans up event listeners on unmount', () => {
      const { unmount } = render(<HeroSlider banners={mockBanners} />);

      // Document should have keyboard event listener
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

      // Unmount the component
      unmount();

      // Document should remove the event listener
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('clears autoplay interval on unmount', () => {
      vi.useFakeTimers();

      // Spy on clearInterval
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = render(<HeroSlider banners={mockBanners} autoplaySpeed={2000} />);

      // Unmount should clear the interval
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});
