import { execute, type DocumentNode } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@/api/schema";
import { resolvers } from "@/api/resolvers";

/**
 * Lightweight GraphQL client.
 *
 * Because the challenge has no backend, we build an executable schema in the
 * browser and run queries against it locally (using the reference `execute`
 * function from the `graphql` package).
 *
 * Components never call `request` directly — they go through feature hooks
 * that wrap this in React Query, which gives us caching, request deduping,
 * background refetching, and loading/error states for free.
 *
 * If a real GraphQL endpoint becomes available, only this file changes:
 * swap the local `execute` for a `fetch` against the endpoint.
 */
const schema = makeExecutableSchema({ typeDefs, resolvers });

export async function request<TData>(
  document: DocumentNode,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const result = await execute({
    schema,
    document,
    variableValues: variables,
  });

  if (result.errors && result.errors.length > 0) {
    // Surface the first error message so React Query treats it as a query failure.
    throw new Error(result.errors[0].message);
  }
  return result.data as TData;
}
