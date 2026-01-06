import { gql } from '@apollo/client';

export const MY_TEAMS_QUERY = gql`
  query MyTeams {
    myTeams {
      id
      name
      slug
      createdAt
    }
  }
`;

export const TEAM_QUERY = gql`
  query Team($id: ID!) {
    team(id: $id) {
      id
      name
      slug
      members {
        id
        userId
        role
        user {
          id
          name
          email
          avatarUrl
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const TEAM_BY_SLUG_QUERY = gql`
  query TeamBySlug($slug: String!) {
    teamBySlug(slug: $slug) {
      id
      name
      slug
      members {
        id
        userId
        role
        user {
          id
          name
          email
          avatarUrl
        }
      }
      createdAt
      updatedAt
    }
  }
`;
