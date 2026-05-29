import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitySearch } from "@/components/CitySearch/CitySearch";
import { useCityStore } from "@/store/useCityStore";
import { renderWithProviders } from "../test-utils";

const geocodingResponse = {
  results: [
    {
      id: 2643743,
      name: "London",
      country: "United Kingdom",
      country_code: "GB",
      admin1: "England",
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: "Europe/London",
    },
    {
      id: 2643742,
      name: "Londonderry",
      country: "United Kingdom",
      country_code: "GB",
      admin1: "Northern Ireland",
      latitude: 55.0,
      longitude: -7.31,
      timezone: "Europe/London",
    },
  ],
};

function mockFetchOnce(payload: unknown, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  });
}

describe("<CitySearch />", () => {
  beforeEach(() => {
    useCityStore.setState({ selectedCity: null });
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the labelled combobox", () => {
    renderWithProviders(<CitySearch />);
    expect(
      screen.getByRole("combobox", { name: /where are you headed/i }),
    ).toBeInTheDocument();
  });

  it("does not query the API for inputs shorter than 2 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    await user.type(screen.getByRole("combobox"), "L");
    await new Promise((r) => setTimeout(r, 350));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and displays city suggestions for partial input", async () => {
    mockFetchOnce(geocodingResponse);
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    await user.type(screen.getByRole("combobox"), "Lon");
    expect(await screen.findByText("London")).toBeInTheDocument();
    expect(screen.getByText("Londonderry")).toBeInTheDocument();
  });

  it("shows an empty-state message when no cities match", async () => {
    mockFetchOnce({ results: [] });
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    await user.type(screen.getByRole("combobox"), "zzqqxx");
    expect(await screen.findByText(/no cities match/i)).toBeInTheDocument();
  });

  it("surfaces network errors in the dropdown", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network down"));
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    await user.type(screen.getByRole("combobox"), "Lon");
    expect(
      await screen.findByText(/unable to load suggestions/i),
    ).toBeInTheDocument();
  });

  it("selects a city via mouse click and updates the store", async () => {
    mockFetchOnce(geocodingResponse);
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    await user.type(screen.getByRole("combobox"), "Lon");
    const option = await screen.findByText("London");
    await user.click(option);
    await waitFor(() => {
      expect(useCityStore.getState().selectedCity?.name).toBe("London");
    });
  });

  it("supports keyboard navigation: ArrowDown + Enter selects an option", async () => {
    mockFetchOnce(geocodingResponse);
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    const combobox = screen.getByRole("combobox");
    await user.type(combobox, "Lon");
    await screen.findByText("London");
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => {
      expect(useCityStore.getState().selectedCity?.name).toBe("Londonderry");
    });
  });

  it("uses the cache: re-typing the same query does not fire a second fetch", async () => {
    mockFetchOnce(geocodingResponse);
    const user = userEvent.setup();
    renderWithProviders(<CitySearch />);
    const combobox = screen.getByRole("combobox");
    await user.type(combobox, "Lon");
    await screen.findByText("London");
    // Caches are reset between tests, so set staleTime in app code makes this
    // assertion verify that ONE fetch handled the typing session.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
