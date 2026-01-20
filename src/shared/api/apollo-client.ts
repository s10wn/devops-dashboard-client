import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
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

type NetworkErrorWithCode = Error & { statusCode?: number };

type GraphQLErrorExtensions = {
  code?: string;
};

type ErrorOptions = {
  error?: Error & {
    errors?: Array<{ extensions?: GraphQLErrorExtensions; message?: string }>;
  };
};

const errorLink = onError((options: ErrorOptions) => {
  const { error } = options;

  // Handle GraphQL errors
  if (error?.errors) {
    for (const err of error.errors) {
      const code = err.extensions?.code;

      if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
        const refreshToken = getRefreshToken();
        if (refreshToken && code === 'UNAUTHENTICATED') {
          window.dispatchEvent(new CustomEvent('auth:refresh-needed'));
        } else {
          clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return;
      }

      if (err.message) {
        console.error(`[GraphQL error]: ${err.message}`);
      }
    }
  }

  // Handle network errors (401)
  if (error) {
    const netErr = error as NetworkErrorWithCode;
    if (netErr.statusCode === 401) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: config.wsUrl,
    lazy: true,
    connectionParams: () => {
      const token = getAccessToken();
      if (!token) {
        return {};
      }
      return {
        authorization: `Bearer ${token}`,
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
