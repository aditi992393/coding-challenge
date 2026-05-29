import { screen, waitFor } from "@testing-library/react";
import { ActivityRecommendations } from "@/components/ActivityRecommendations/ActivityRecommendations";
import { useCityStore } from "@/store/useCityStore";
import { renderWithProviders } from "../test-utils";
import type { City } from "@/types";

const tokyo: City = {
  id: 2,
  name: "Tokyo",
  country: "Japan",
  latitude: 35.6762,
  longitude: 139.6503,
};

function snowyResponse() {
  return {
    timezone: "Asia/Tokyo",
    current_weather: {
      temperature: -2,
      windspeed: 8,
      weathercode: 71,
      time: "2025-01-01T10:00",
    },
    daily: {
      time: ["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05"],
      temperature_2m_max: [-1, -2, -3, -1, 0],
      temperature_2m_min: [-8, -9, -10, -7, -6],
      precipitation_sum: [0, 0, 0, 0, 0],
      snowfall_sum: [4, 3, 5, 2, 4],
      windspeed_10m_max: [10, 12, 8, 10, 14],
      weathercode: [71, 73, 75, 71, 71],
    },
  };
}

function mockFetchOnce(payload: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => payload,
  });
}

describe("<ActivityRecommendations />", () => {
  beforeEach(() => {
    useCityStore.setState({ selectedCity: null });
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  it("renders nothing when no city is selected", () => {
    const { container } = renderWithProviders(<ActivityRecommendations />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all four activities ranked, highest first", async () => {
    mockFetchOnce(snowyResponse());
    useCityStore.setState({ selectedCity: tokyo });
    renderWithProviders(<ActivityRecommendations />);
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(4),
    );
    const items = screen.getAllByRole("listitem");
    // Skiing should be rank #1 for the heavy-snow forecast
    expect(items[0]).toHaveTextContent(/skiing/i);
  });

  it("shows progress bars with valid aria-valuenow", async () => {
    mockFetchOnce(snowyResponse());
    useCityStore.setState({ selectedCity: tokyo });
    renderWithProviders(<ActivityRecommendations />);
    const bars = await screen.findAllByRole("progressbar");
    expect(bars).toHaveLength(4);
    for (const bar of bars) {
      const value = Number(bar.getAttribute("aria-valuenow"));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
