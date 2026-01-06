import { gql } from '@apollo/client';

export const SERVER_PROCESSES_SUBSCRIPTION = gql`
  subscription ServerProcesses($serverId: ID!) {
    serverProcesses(serverId: $serverId) {
      serverId
      processes {
        pm_id
        name
        pid
        pm2_env {
          status
          pm_uptime
          restart_time
        }
        monit {
          cpu
          memory
        }
      }
    }
  }
`;

export const SERVER_LOGS_HISTORY_SUBSCRIPTION = gql`
  subscription ServerLogsHistory($serverId: ID!) {
    serverLogsHistory(serverId: $serverId) {
      serverId
      logs
    }
  }
`;

export const NEW_SERVER_LOG_SUBSCRIPTION = gql`
  subscription NewServerLog($serverId: ID!) {
    newServerLog(serverId: $serverId) {
      id
      timestamp
      level
      message
      source
      serverId
    }
  }
`;

export const COMMAND_RESULT_SUBSCRIPTION = gql`
  subscription CommandResult($serverId: ID!) {
    commandResult(serverId: $serverId) {
      serverId
      success
      command
      processId
      output
      error
    }
  }
`;
