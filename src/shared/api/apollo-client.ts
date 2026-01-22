import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
  Observable,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { config } from '@shared/config';

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Refresh tokens function
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

const refreshTokens = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(config.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($input: RefreshTokenInput!) {
          refreshToken(input: $input) { accessToken refreshToken }
        }`,
        variables: { input: { refreshToken } },
      }),
    });

    const { data, errors } = await response.json();
    if (errors || !data?.refreshToken) {
      return false;
    }

    setTokens(data.refreshToken.accessToken, data.refreshToken.refreshToken);
    return true;
  } catch {
    return false;
  }
};

const httpLink = createHttpLink({
  uri: config.graphqlUrl,
});

const authLink = setContext((_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

type GraphQLErrorWithCode = {
  message: string;
  extensions?: { code?: string };
};

type ErrorHandlerParams = {
  operation: ReturnType<typeof from> extends { subscribe: unknown } ? never : Parameters<typeof onError>[0] extends (params: infer P) => unknown ? P : never;
  forward: (op: unknown) => Observable<unknown>;
  error?: Error & {
    graphQLErrors?: GraphQLErrorWithCode[];
    networkError?: Error & { statusCode?: number };
  };
};

const errorLink = onError((params) => {
  const { operation, forward } = params;
  const errorHandler = params as unknown as ErrorHandlerParams;
  const graphQLErrors = errorHandler.error?.graphQLErrors || (params as unknown as { graphQLErrors?: GraphQLErrorWithCode[] }).graphQLErrors;
  const networkError = errorHandler.error?.networkError || (params as unknown as { networkError?: Error & { statusCode?: number } }).networkError;

  // Handle GraphQL errors
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const code = err.extensions?.code;

      if (code === 'UNAUTHENTICATED') {
        // Check if we have a refresh token
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return;
        }

        // If already refreshing, queue the request
        if (isRefreshing) {
          return new Observable((observer) => {
            pendingRequests.push(() => {
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${getAccessToken()}`,
                },
              });
              forward(operation).subscribe(observer);
            });
          });
        }

        isRefreshing = true;

        return new Observable((observer) => {
          refreshTokens()
            .then((success) => {
              if (success) {
                // Update the operation with new token
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `Bearer ${getAccessToken()}`,
                  },
                });

                // Resolve pending requests
                resolvePendingRequests();

                // Retry the original request
                forward(operation).subscribe(observer);
              } else {
                // Refresh failed - logout
                clearTokens();
                window.dispatchEvent(new CustomEvent('auth:logout'));
                observer.error(err);
              }
            })
            .catch(() => {
              clearTokens();
              window.dispatchEvent(new CustomEvent('auth:logout'));
              observer.error(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }

      if (code === 'FORBIDDEN') {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return;
      }

      if (err.message) {
        console.error(`[GraphQL error]: ${err.message}`);
      }
    }
  }

  // Handle network errors (401)
  if (networkError && 'statusCode' in networkError && networkError.statusCode === 401) {
    clearTokens();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: config.wsUrl,
    lazy: true,
    connectionParams: async () => {
      const token = getAccessToken();
      return {
        Authorization: token ? `Bearer ${token}` : '',
        authorization: token ? `Bearer ${token}` : '',
      };
    },
    shouldRetry: () => true,
    retryAttempts: 5,
    retryWait: (retries) => new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** retries, 30000))),
    on: {
      error: (error) => {
        console.error('[WebSocket error]:', error);
      },
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([errorLink, authLink, httpLink])
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export { setTokens, clearTokens, getAccessToken, getRefreshToken };
