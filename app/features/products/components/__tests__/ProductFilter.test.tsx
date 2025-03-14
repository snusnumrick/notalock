import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProductFilter from '../ProductFilter';
import { DEFAULT_PAGE_LIMIT } from '../../../../config/pagination';

const mockSubmit = vi.fn();

vi.mock('@remix-run/react', async () => {
  const actual = await vi.importActual('@remix-run/react');
  return {
    ...actual,
    useSubmit: () => mockSubmit,
    useSearchParams: () => [new URLSearchParams()],
  };
});

const TestRemixContext = ({ children }: { children: React.ReactNode }) => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: children,
    },
  ]);

  return <RouterProvider router={router} />;
};

const defaultProps = {
  onFilterChange: vi.fn(),
  categories: [],
};

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<TestRemixContext>{ui}</TestRemixContext>);
};

describe('ProductFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    mockSubmit.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Price Input Behavior', () => {
    it('maintains focus while typing in max price input', () => {
      renderWithRouter(<ProductFilter {...defaultProps} />);
      const maxPriceInput = screen.getByLabelText('Maximum price') as HTMLInputElement;

      maxPriceInput.focus();
      fireEvent.change(maxPriceInput, { target: { value: DEFAULT_PAGE_LIMIT.toString() } });
      vi.advanceTimersByTime(0);

      expect(screen.getByLabelText('Maximum price')).toHaveFocus();
      expect(maxPriceInput.value).toBe(DEFAULT_PAGE_LIMIT.toString());
    });

    it('properly resets focus on blur', () => {
      renderWithRouter(<ProductFilter {...defaultProps} />);
      const maxPriceInput = screen.getByLabelText('Maximum price') as HTMLInputElement;
      const minPriceInput = screen.getByLabelText('Minimum price') as HTMLInputElement;

      maxPriceInput.focus();
      vi.advanceTimersByTime(0);

      // Focus another input to trigger a real blur
      minPriceInput.focus();

      // Process microtasks
      vi.advanceTimersByTime(0);

      // Process the requestAnimationFrame callback
      vi.runAllTimers();

      expect(maxPriceInput).not.toHaveFocus();
    });

    it('handles rapid typing without losing focus', () => {
      renderWithRouter(<ProductFilter {...defaultProps} />);
      const maxPriceInput = screen.getByLabelText('Maximum price') as HTMLInputElement;

      maxPriceInput.focus();
      vi.advanceTimersByTime(0);

      fireEvent.change(maxPriceInput, { target: { value: '1' } });
      vi.advanceTimersByTime(0);

      expect(screen.getByLabelText('Maximum price')).toHaveFocus();
      expect(maxPriceInput.value).toBe('1');
    });
  });

  describe('Form Behavior', () => {
    it('submits form data with proper debouncing', () => {
      renderWithRouter(<ProductFilter {...defaultProps} />);
      const maxPriceInput = screen.getByLabelText('Maximum price') as HTMLInputElement;

      fireEvent.change(maxPriceInput, { target: { value: '100' } });
      vi.advanceTimersByTime(400);
      expect(mockSubmit).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('maintains form state during rapid updates', () => {
      renderWithRouter(<ProductFilter {...defaultProps} />);
      const maxPriceInput = screen.getByLabelText('Maximum price') as HTMLInputElement;

      maxPriceInput.focus();
      fireEvent.change(maxPriceInput, { target: { value: '50' } });
      vi.advanceTimersByTime(0);
      fireEvent.change(maxPriceInput, { target: { value: '75' } });
      vi.advanceTimersByTime(0);

      expect(maxPriceInput.value).toBe('75');
      expect(screen.getByLabelText('Maximum price')).toHaveFocus();
    });
  });
});
