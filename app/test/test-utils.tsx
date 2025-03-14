import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
interface RenderWithRouterOptions {
  initialEntries?: string[];
}

export function renderWithRouter(
  ui: React.ReactNode,
  { initialEntries = ['/'] }: RenderWithRouterOptions = {}
) {
  // We're going to wrap the UI with a div with a data-testid for easier querying
  const wrappedUi = <div data-testid="test-component">{ui}</div>;

  // For test cases, use MemoryRouter with specified initial entries
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {/* Render the component directly, without Routes */}
      {wrappedUi}
    </MemoryRouter>
  );
}
