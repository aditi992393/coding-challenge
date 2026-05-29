import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { CitySearch } from "@/components/CitySearch/CitySearch";
import { useCityStore } from "@/store/useCityStore";
import { SEARCH_CITIES_QUERY } from "@/api/queries/searchCities";
import { renderWithApollo } from "../test-utils";

const londonResults = [
  {
    id: 2643743,
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    admin1: "England",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
  },
  {
    id: 2643742,
    name: "Londonderry",
    country: "United Kingdom",
    countryCode: "GB",
    admin1: "Northern Ireland",
    latitude: 55,
    longitude: -7.31,
    timezone: "Europe/London",
  },
];

function citiesMock(query: string, results: typeof londonResults) {
  return {
    request: {
      query: SEARCH_CITIES_QUERY,
      variables: { query, count: 8 },
    },
    result: { data: { searchCities: results } },
  };
}

describe("<CitySearch />", () => {
  beforeEach(() => {
    useCityStore.setState({ selectedCity: null });
  });

  it("renders the labelled combobox", () => {
    renderWithApollo(<CitySearch />);
    expect(
      screen.getByRole("combobox", { name: /where are you headed/i }),
    ).toBeInTheDocument();
  });

  it("fetches and displays city suggestions for partial input", async () => {
    const user = userEvent.setup();
    renderWithApollo(<CitySearch />, [citiesMock("Lon", londonResults)]);
    await user.type(screen.getByRole("combobox"), "Lon");
    expect(await screen.findByText("London")).toBeInTheDocument();
    expect(screen.getByText("Londonderry")).toBeInTheDocument();
  });

  it("shows an empty-state message when no cities match", async () => {
    const user = userEvent.setup();
    renderWithApollo(<CitySearch />, [citiesMock("zzqq", [])]);
    await user.type(screen.getByRole("combobox"), "zzqq");
    expect(await screen.findByText(/no cities match/i)).toBeInTheDocument();
  });

  it("surfaces network errors in the dropdown", async () => {
    const errorMock = {
      request: {
        query: SEARCH_CITIES_QUERY,
        variables: { query: "Lon", count: 8 },
      },
      result: {
        errors: [new GraphQLError("Network down")],
      },
    };
    const user = userEvent.setup();
    renderWithApollo(<CitySearch />, [errorMock]);
    await user.type(screen.getByRole("combobox"), "Lon");
    expect(
      await screen.findByText(/unable to load suggestions/i),
    ).toBeInTheDocument();
  });

  it("selects a city via mouse click and updates the store", async () => {
    const user = userEvent.setup();
    renderWithApollo(<CitySearch />, [citiesMock("Lon", londonResults)]);
    await user.type(screen.getByRole("combobox"), "Lon");
    const option = await screen.findByText("London");
    await user.click(option);
    await waitFor(() => {
      expect(useCityStore.getState().selectedCity?.name).toBe("London");
    });
  });

  it("supports keyboard navigation: ArrowDown + Enter selects an option", async () => {
    const user = userEvent.setup();
    renderWithApollo(<CitySearch />, [citiesMock("Lon", londonResults)]);
    await user.type(screen.getByRole("combobox"), "Lon");
    await screen.findByText("London");
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => {
      expect(useCityStore.getState().selectedCity?.name).toBe("Londonderry");
    });
  });
});
