import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the admin sign-in form when nobody is signed in', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /admin sign in/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in to dashboard/i })).toBeInTheDocument();
});
