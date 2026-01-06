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

interface GraphQLErrorWithExtensions {
  extensions?: { code?: string };
}

interface ErrorWithErrors {
  errors?: GraphQLErrorWithExtensions[];
}

const errorLink = onError(({ error }) => {
  const typedError = error as ErrorWithErrors;

  if (typedError.errors) {
    for (const err of typedError.errors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          window.dispatchEvent(new CustomEvent('auth:refresh-needed'));
        } else {
          clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
    }
  } else {
    console.error('[Network error]:', error);
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: config.wsUrl,
    connectionParams: () => ({
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : '',
    }),
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
