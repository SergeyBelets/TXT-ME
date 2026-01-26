import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../utils/AuthContext';

export function renderWithProviders(ui, { route = '/', ...renderOptions } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>,
    renderOptions
  );
}

export function renderWithRouter(ui, { route = '/', ...renderOptions } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    renderOptions
  );
}
