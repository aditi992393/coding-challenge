import { screen } from '@testing-library/react';
import { WeatherForecast } from '@/components/WeatherForecast/WeatherForecast';
import { renderWithProviders } from '../test-utils';
import type { City } from '@/types';

const london: City = {
  id: 1,
  name: 'London',
  country: 'United Kingdom',
  admin1: 'England',
  latitude: 51.5074,
  longitude: -0.1278,
};

const weatherResponse = {
  timezone: 'Europe/London',
  current_weather: {
    temperature: 18,
    windspeed: 12,
    weathercode: 1,
    time: '2025-01-01T10:00',
  },
  daily: {
    time: ['2025-01-01', '2025-01-02', '2025-01-03'],
    temperature_2m_max: [20, 22, 19],
    temperature_2m_min: [12, 14, 11],
    precipitation_sum: [0, 1.2, 0],
    snowfall_sum: [0, 0, 0],
    windspeed_10m_max: [12, 10, 15],
    weathercode: [1, 2, 61],
  },
};

function mockFetchOnce(payload: unknown, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  });
}

describe('<WeatherForecast />', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  it('renders the empty state when no city is selected', () => {
    renderWithProviders(<WeatherForecast city={null} />);
    expect(screen.getByText(/no city selected yet/i)).toBeInTheDocument();
  });

  it('renders skeleton placeholders while loading', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = renderWithProviders(<WeatherForecast city={london} />);
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it('renders the current temperature and daily forecast when data loads', async () => {
    mockFetchOnce(weatherResponse);
    renderWithProviders(<WeatherForecast city={london} />);
    expect(await screen.findByRole('heading', { name: /london/i })).toBeInTheDocument();
    expect(await screen.findByText('18°C')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows an error state and a retry button when the API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('503'));
    renderWithProviders(<WeatherForecast city={london} />);
    expect(await screen.findByText(/couldn't load the forecast/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
