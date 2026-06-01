import type { DocumentNode, OperationDefinitionNode, FieldNode } from 'graphql';
import { fetchCities } from '@/api/rest/geocoding';
import { fetchWeather } from '@/api/rest/weather';

/**
 * Lightweight GraphQL client. Reads the root field from a gql query,
 * calls the matching resolver, and returns the result as a GraphQL
 * envelope (`{ [rootField]: data }`). Resolvers delegate to REST adapters
 * in `src/api/rest/` — the only files aware of Open-Meteo's endpoints.
 * Swapping to a real GraphQL backend would only change this file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolvers: Record<string, (variables: any) => Promise<unknown>> = {
  searchCities: fetchCities,
  getWeather: fetchWeather,
};

export async function request<TData>(
  document: DocumentNode,
  variables: Record<string, unknown> = {},
): Promise<TData> {
  const operation = document.definitions[0] as OperationDefinitionNode;
  const field = (operation.selectionSet.selections[0] as FieldNode).name.value;

  const resolver = resolvers[field];
  if (!resolver) throw new Error(`Unknown GraphQL field: ${field}`);

  const data = await resolver(variables);
  return { [field]: data } as TData;
}
