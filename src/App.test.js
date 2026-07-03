import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

const mockSupporters = [
  { id: 1, name: 'Alice', amount: 5 },
  { id: 2, name: 'Bob', amount: 10 },
];

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();

  global.fetch = jest.fn((url, options = {}) => {
    const method = String(options.method || 'GET').toUpperCase();

    if (method === 'POST' && String(url).includes('/api/website/visit')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, sent: 1 }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, supporters: mockSupporters }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders QR payment app correctly', async () => {
  render(<App />);
  const qrImage = await screen.findByAltText(/Scan to pay QR Code/i);
  expect(qrImage).toBeInTheDocument();
});

test('renders all payment buttons', async () => {
  render(<App />);
  expect(await screen.findByText(/ABA PAY/i)).toBeInTheDocument();
  expect(await screen.findByText(/ACLEDA PAY/i)).toBeInTheDocument();
  expect(await screen.findByText(/WING PAY/i)).toBeInTheDocument();
});

test('renders contact section', async () => {
  render(<App />);
  expect(await screen.findByText(/Contact/i)).toBeInTheDocument();
});



test('does not render an expiry timer', async () => {
  render(<App />);
  await screen.findByAltText(/Scan to pay QR Code/i);
  expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  expect(screen.queryByText(/Expired/i)).not.toBeInTheDocument();
});

test('loads and sorts supporter list from backend response', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  expect(screen.getByText('$15.00')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/supporters'),
    expect.objectContaining({ method: 'GET' })
  );
});

test('sends website visit notification as binary payload', async () => {
  render(<App />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/website/visit'),
      expect.objectContaining({ method: 'POST' })
    );
  }, { timeout: 3000 });

  const visitCall = global.fetch.mock.calls.find(([url, options]) => (
    String(url).includes('/api/website/visit') &&
    String(options?.method || '').toUpperCase() === 'POST'
  ));

  expect(visitCall).toBeTruthy();
  const body = JSON.parse(visitCall[1].body);
  expect(body.encrypted).toBe(true);
  expect(body.encryption).toBe('binary-json-v1');
  expect(body.payloadBinary).toMatch(/^[01]+$/);
  expect(body.payload).toBeUndefined();
});
