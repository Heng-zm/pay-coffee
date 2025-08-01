import { render, screen } from '@testing-library/react';
import App from './App';

test('renders donation app correctly', () => {
  render(<App />);
  const titleElement = screen.getByText(/PAY ME A COFFEE/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders payment buttons', () => {
  render(<App />);
  const abaButton = screen.getByText(/ABA PAY/i);
  const acledaButton = screen.getByText(/ACLEDA PAY/i);
  expect(abaButton).toBeInTheDocument();
  expect(acledaButton).toBeInTheDocument();
});

test('renders donation list section', () => {
  render(<App />);
  const donationTitle = screen.getByText(/THANKS FOR SUPPORT/i);
  expect(donationTitle).toBeInTheDocument();
});
