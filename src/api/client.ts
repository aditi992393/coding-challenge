import type { DocumentNode, OperationDefinitionNode } from "graphql";
import { searchCitiesResolver } from "@/api/resolvers/geocoding";
import { getWeatherForecastResolver } from "@/api/resolvers/weather";

/**
 * Lightweight in-process GraphQL executor.
 *
 * Rather than depending on a remote GraphQL server (no backend is required for this
 * challenge), we expose `gql` documents to the rest of the application and route
 * them to typed resolvers that ultimately call Open-Meteo's REST endpoints.
 *
 * This gives us:
 *  - A real GraphQL abstraction at the boundary (queries are declarative documents).
 *  - Strong typing through TypeScript.
 *  - A single place to swap implementations (e.g. point at a real GraphQL endpoint later).
 */

type Resolver = (args: Record<string, unknown>) => Promise<unknown>;

const resolvers: Record<string, Resolver> = {
  searchCities: (args) =>
    searchCitiesResolver(args as { query: string; count?: number }),
  getWeather: (args) =>
    getWeatherForecastResolver(
      args as { latitude: number; longitude: number; days?: number },
    ),
};

function getRootFieldName(document: DocumentNode): string {
  const operation = document.definitions.find(
    (d): d is OperationDefinitionNode => d.kind === "OperationDefinition",
  );
  if (!operation) {
    throw new Error("No operation definition in query document");
  }
  const firstField = operation.selectionSet.selections.find(
    (s) => s.kind === "Field",
  );
  if (!firstField || firstField.kind !== "Field") {
    throw new Error("Operation has no root field");
  }
  return firstField.name.value;
}

export async function executeQuery<TResult>(
  document: DocumentNode,
  variables: Record<string, unknown> = {},
): Promise<TResult> {
  const rootField = getRootFieldName(document);
  const resolver = resolvers[rootField];
  if (!resolver) {
    throw new Error(`No resolver registered for field: ${rootField}`);
  }
  const data = await resolver(variables);
  // Mirror a GraphQL response shape: `{ [rootField]: <resolverResult> }`.
  return { [rootField]: data } as TResult;
}
