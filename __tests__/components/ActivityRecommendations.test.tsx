import { screen, waitFor } from "@testing-library/react";
import { ActivityRecommendations } from "@/components/ActivityRecommendations/ActivityRecommendations";
import { useCityStore } from "@/store/useCityStore";
import { GET_WEATHER_QUERY } from "@/api/queries/getWeather";
import { renderWithApollo } from "../test-utils";
import type { City } from "@/types";

const tokyo: City = {
  id: 2,
  name: "Tokyo",
  country: "Japan",
  latitude: 35.6762,
  longitude: 139.6503,
};

const snowyWeather = {
  timezone: "Asia/Tokyo",
  current: {
    temperature: -2,
    windSpeed: 8,
    weatherCode: 71,
    time: "2025-01-01T10:00",
  },
  daily: [-1, -2, -3, -1, 0].map((max, i) => ({
    date: `2025-01-0${i + 1}`,
    temperatureMax: max,
    temperatureMin: max - 7,
    precipitationSum: 0,
    snowfallSum: 4,
    windSpeedMax: 10,
    weatherCode: 71,
  })),
};

const snowyMock = {
  request: {
    query: GET_WEATHER_QUERY,
    variables: { latitude: tokyo.latitude, longitude: tokyo.longitude, days: 7 },
  },
  result: { data: { getWeather: snowyWeather } },
};

describe("<ActivityRecommendations />", () => {
  beforeEach(() => {
    useCityStore.setState({ selectedCity: null });
  });

  it("renders nothing when no city is selected", () => {
    const { container } = renderWithApollo(<ActivityRecommendations />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all four activities ranked, highest first", async () => {
    useCityStore.setState({ selectedCity: tokyo });
    renderWithApollo(<ActivityRecommendations />, [snowyMock]);
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(4),
    );
    const items = screen.getAllByRole("listitem");
    // Skiing should rank #1 for the heavy-snow forecast.
    expect(items[0]).toHaveTextContent(/skiing/i);
  });

  it("shows progress bars with valid aria-valuenow", async () => {
    useCityStore.setState({ selectedCity: tokyo });
    renderWithApollo(<ActivityRecommendations />, [snowyMock]);
    const bars = await screen.findAllByRole("progressbar");
    expect(bars).toHaveLength(4);
    for (const bar of bars) {
      const value = Number(bar.getAttribute("aria-valuenow"));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
