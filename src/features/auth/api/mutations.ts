import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      tokens {
        accessToken
        refreshToken
      }
      userId
      email
      name
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      tokens {
        accessToken
        refreshToken
      }
      userId
      email
      name
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($input: LogoutInput) {
    logout(input: $input) {
      success
      message
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
    }
  }
`;
