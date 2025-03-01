import { render, RenderOptions } from '@testing-library/react';
import { RemixMockProvider } from '~/__mocks__/remix';
import React from 'react';

/**
 * Renders a React component within a Remix data router context
 * This allows components to use Remix-specific hooks like useFetcher, useLoaderData, etc.
 *
 * Based on testing guidelines from docs/development/testing.md
 *
 * @param ui The React component to render
 * @param options Optional render options from testing-library
 * @returns The result of render with all the testing-library queries
 *
 * Example usage:
 * ```tsx
 * const { getByText } = renderWithRemix(<MyComponent />);
 * expect(getByText('Hello')).toBeInTheDocument();
 * ```
 */
export function renderWithRemix(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => <RemixMockProvider>{children}</RemixMockProvider>,
    ...options,
  });
}
