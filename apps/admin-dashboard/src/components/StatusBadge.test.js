import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

test.each([
  ['Active', 'badge badge-green'],
  ['Maintenance', 'badge badge-amber'],
  ['Under Construction', 'badge badge-amber'],
  ['Idle', 'badge badge-gray'],
  ['Inactive', 'badge badge-gray'],
  ['On Leave', 'badge badge-gray'],
])('%s is drawn as "%s" in every table and on the dashboard', (status, className) => {
  render(<StatusBadge status={status} />);
  expect(screen.getByText(status)).toHaveAttribute('class', className);
});
