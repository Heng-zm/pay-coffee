import { act, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
  window.sessionStorage.clear();

  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ ok: true, sent: true }),
  }));
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

const renderLoadedApp = async () => {
  render(<App />);

  act(() => {
    jest.advanceTimersByTime(120);
  });

  return screen.findByAltText(/Payment QR code/i);
};

test('renders QR payment app correctly', async () => {
  const qrImage = await renderLoadedApp();
  expect(qrImage).toBeInTheDocument();
});

test('removes the old hero copy above the QR code', async () => {
  await renderLoadedApp();

  expect(screen.queryByText(/Support Creator/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /Scan QR Code/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/Recipient:/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Ozo\. Designer/i)).not.toBeInTheDocument();
});

test('renders all payment buttons', async () => {
  await renderLoadedApp();
  expect(screen.getByText(/ABA PAY/i)).toBeInTheDocument();
  expect(screen.getByText(/ACLEDA PAY/i)).toBeInTheDocument();
  expect(screen.getByText(/WING PAY/i)).toBeInTheDocument();
});

test('renders contact section', async () => {
  await renderLoadedApp();
  expect(screen.getByText(/Contact/i)).toBeInTheDocument();
});

test('does not render an expiry timer', async () => {
  await renderLoadedApp();
  expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  expect(screen.queryByText(/Expired/i)).not.toBeInTheDocument();
});

test('sends website visit notification through Vercel API only', async () => {
  await renderLoadedApp();

  act(() => {
    jest.advanceTimersByTime(800);
  });

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  expect(global.fetch).toHaveBeenCalledWith(
    '/api/website/visit',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: expect.any(String),
    })
  );

  const [, options] = global.fetch.mock.calls[0];
  const body = JSON.parse(options.body);
  expect(body.event).toBe('website_visit');
  expect(body.url).toEqual(expect.any(String));
  expect(body.browser).toEqual(expect.any(String));
});
