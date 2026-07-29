import { render, screen } from '@testing-library/react';
import App from './App';

test('renders system admin dashboard heading', () => {
  render(<App />);
  expect(screen.getByText(/system admin dashboard/i)).toBeInTheDocument();
});
