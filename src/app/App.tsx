import { ApolloProvider } from '@apollo/client/react';
import { RouterProvider } from 'react-router-dom';
import { apolloClient } from '@shared/api';
import { router } from './router';

export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
}
