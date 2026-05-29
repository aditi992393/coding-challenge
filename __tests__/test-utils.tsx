import { MockedProvider } from "@apollo/client/testing/react";
import type { MockedResponse } from "@apollo/client/testing";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Test render helper that wraps the UI under test with Apollo's MockedProvider.
 * Pass an array of `MockedResponse` to simulate GraphQL query results without a real network.
 */
export function renderWithApollo(
  ui: ReactElement,
  mocks: ReadonlyArray<MockedResponse> = [],
  options?: RenderOptions,
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
