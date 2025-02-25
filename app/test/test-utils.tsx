import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

interface RouteType {
  path?: string;
  element?: React.ReactNode;
}

export function renderWithRouter(ui: React.ReactNode, { routes = [] as RouteType[] } = {}) {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ui} />
        {routes.map((route: RouteType, i) => (
          <Route key={i} {...route} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
