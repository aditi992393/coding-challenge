import { screen } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { WeatherForecast } from "@/components/WeatherForecast/WeatherForecast";
import { useCityStore } from "@/store/useCityStore";
import { GET_WEATHER_QUERY } from "@/api/queries/getWeather";
import { renderWithApollo } from "../test-utils";
import type { City } from "@/types";

const london: City = {
  id: 1,
  name: "London",
  country: "United Kingdom",
  admin1: "England",
  latitude: 51.5074,
  longitude: -0.1278,
};

const weatherData = {
  timezone: "Europe/London",
  current: {
    temperature: 18,
    windSpeed: 12,
    weatherCode: 1,
    time: "2025-01-01T10:00",
  },
  daily: [
    {
      date: "2025-01-01",
      temperatureMax: 20,
      temperatureMin: 12,
      precipitationSum: 0,
      snowfallSum: 0,
      windSpeedMax: 12,
      weatherCode: 1,
    },
    {
      date: "2025-01-02",
      temperatureMax: 22,
      temperatureMin: 14,
      precipitationSum: 1.2,
      snowfallSum: 0,
      windSpeedMax: 10,
      weatherCode: 2,
    },
    {
      date: "2025-01-03",
      temperatureMax: 19,
      temperatureMin: 11,
      precipitationSum: 0,
      snowfallSum: 0,
      windSpeedMax: 15,
      weatherCode: 61,
    },
  ],
};

const successMock = {
  request: {
    query: GET_WEATHER_QUERY,
    variables: { latitude: london.latitude, longitude: london.longitude, days: 7 },
  },
  result: { data: { getWeather: weatherData } },
};

describe("<WeatherForecast />", () => {
  beforeEach(() => {
    useCityStore.setState({ selectedCity: null });
  });

  it("renders the empty state when no city is selected", () => {
    renderWithApollo(<WeatherForecast />);
    expect(screen.getByText(/no city selected yet/i)).toBeInTheDocument();
  });

  it("renders skeleton placeholders while loading", () => {
    useCityStore.setState({ selectedCity: london });
    const { container } = renderWithApollo(<WeatherForecast />, [successMock]);
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("renders the current temperature and daily forecast when data loads", async () => {
    useCityStore.setState({ selectedCity: london });
    renderWithApollo(<WeatherForecast />, [successMock]);
    expect(
      await screen.findByRole("heading", { name: /london/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText("18°C")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows an error state and a retry button when the API fails", async () => {
    const errorMock = {
      request: {
        query: GET_WEATHER_QUERY,
        variables: {
          latitude: london.latitude,
          longitude: london.longitude,
          days: 7,
        },
      },
      result: { errors: [new GraphQLError("503 Service Unavailable")] },
    };
    useCityStore.setState({ selectedCity: london });
    renderWithApollo(<WeatherForecast />, [errorMock]);
    expect(
      await screen.findByText(/couldn't load the forecast/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
