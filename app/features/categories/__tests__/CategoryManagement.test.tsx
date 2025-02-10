import { render, screen, waitFor } from '@testing-library/react';
import { CategoryManagement } from '../components/CategoryManagement';
import { CategoryService } from '../services/categoryService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient } from './mocks/supabase';

// Mock toast function
const mockToast = vi.fn();

// Mock the useToast hook
vi.mock('~/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Create service instance with mock Supabase client
const categoryService = new CategoryService(mockSupabaseClient);

describe('CategoryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  it('shows correct tabs on mobile view', async () => {
    render(<CategoryManagement categoryService={categoryService} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /tree view/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /list view/i })).toBeInTheDocument();
    });
  });
});
