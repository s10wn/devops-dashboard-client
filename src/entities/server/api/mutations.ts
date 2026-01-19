import { gql } from '@apollo/client';

export const CREATE_SERVER_MUTATION = gql`
  mutation CreateServer($input: CreateServerInput!) {
    createServer(input: $input) {
      id
      name
      host
      port
      checkType
      httpPath
      checkInterval
      status
      isActive
      projectId
      provider
      monthlyPrice
    }
  }
`;

export const UPDATE_SERVER_MUTATION = gql`
  mutation UpdateServer($input: UpdateServerInput!) {
    updateServer(input: $input) {
      id
      name
      host
      port
      checkType
      httpPath
      checkInterval
      isActive
      projectId
      provider
      monthlyPrice
    }
  }
`;

export const DELETE_SERVER_MUTATION = gql`
  mutation DeleteServer($serverId: ID!) {
    deleteServer(serverId: $serverId)
  }
`;

export const TOGGLE_SERVER_MUTATION = gql`
  mutation ToggleServer($serverId: ID!, $isActive: Boolean!) {
    toggleServer(serverId: $serverId, isActive: $isActive) {
      id
      isActive
    }
  }
`;

export const REGENERATE_AGENT_TOKEN_MUTATION = gql`
  mutation RegenerateAgentToken($serverId: ID!) {
    regenerateAgentToken(serverId: $serverId) {
      id
      agentToken
    }
  }
`;

// PM2 Process Management
export const REQUEST_SERVER_PROCESSES_MUTATION = gql`
  mutation RequestServerProcesses($serverId: ID!) {
    requestServerProcesses(serverId: $serverId)
  }
`;

export const REQUEST_SERVER_LOGS_MUTATION = gql`
  mutation RequestServerLogs($serverId: ID!, $lines: Int) {
    requestServerLogs(serverId: $serverId, lines: $lines)
  }
`;

export const RESTART_PROCESS_MUTATION = gql`
  mutation RestartProcess($serverId: ID!, $processId: Int!) {
    restartProcess(serverId: $serverId, processId: $processId)
  }
`;

export const STOP_PROCESS_MUTATION = gql`
  mutation StopProcess($serverId: ID!, $processId: Int!) {
    stopProcess(serverId: $serverId, processId: $processId)
  }
`;

export const START_PROCESS_MUTATION = gql`
  mutation StartProcess($serverId: ID!, $processId: Int!) {
    startProcess(serverId: $serverId, processId: $processId)
  }
`;
