import { render as rtlRender, screen, waitFor, fireEvent } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

function customRender(
  ui: ReactElement,
  { route = '/', ...renderOptions }: RenderOptions & { route?: string } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export { customRender as render, screen, waitFor, fireEvent };
