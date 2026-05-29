import { ApolloClient, InMemoryCache } from "@apollo/client";
import { SchemaLink } from "@apollo/client/link/schema";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@/api/schema";
import { resolvers } from "@/api/resolvers";

/**
 * Standard Apollo Client setup.
 *
 * Because the challenge has no backend, we build an executable schema in the
 * browser (`makeExecutableSchema`) and wire it to Apollo via `SchemaLink`.
 * From the rest of the application's point of view this looks like a normal
 * Apollo Client connected to a remote GraphQL server — components use the
 * standard `useQuery` hook and `gql` template tag from `@apollo/client`.
 *
 * `InMemoryCache` provides automatic response caching (deduping repeat
 * queries, sharing data between components, etc.).
 */
const schema = makeExecutableSchema({ typeDefs, resolvers });

export const apolloClient = new ApolloClient({
  link: new SchemaLink({ schema }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "cache-first" },
  },
});
