import { gql } from '@apollo/client';

export const CREATE_TEAM_MUTATION = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_TEAM_MUTATION = gql`
  mutation UpdateTeam($input: UpdateTeamInput!) {
    updateTeam(input: $input) {
      id
      name
      slug
    }
  }
`;

export const DELETE_TEAM_MUTATION = gql`
  mutation DeleteTeam($teamId: ID!) {
    deleteTeam(teamId: $teamId)
  }
`;

export const INVITE_TEAM_MEMBER_MUTATION = gql`
  mutation InviteTeamMember($input: InviteTeamMemberInput!) {
    inviteTeamMember(input: $input) {
      id
      status
    }
  }
`;

export const ACCEPT_TEAM_INVITE_MUTATION = gql`
  mutation AcceptTeamInvite($input: AcceptTeamInviteInput!) {
    acceptTeamInvite(input: $input) {
      id
      role
    }
  }
`;

export const UPDATE_TEAM_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateTeamMemberRole($input: UpdateTeamMemberRoleInput!) {
    updateTeamMemberRole(input: $input) {
      id
      role
    }
  }
`;

export const REMOVE_TEAM_MEMBER_MUTATION = gql`
  mutation RemoveTeamMember($input: RemoveTeamMemberInput!) {
    removeTeamMember(input: $input)
  }
`;

export const LEAVE_TEAM_MUTATION = gql`
  mutation LeaveTeam($teamId: ID!) {
    leaveTeam(teamId: $teamId)
  }
`;

export const TRANSFER_TEAM_OWNERSHIP_MUTATION = gql`
  mutation TransferTeamOwnership($teamId: ID!, $newOwnerId: ID!) {
    transferTeamOwnership(teamId: $teamId, newOwnerId: $newOwnerId) {
      id
    }
  }
`;
