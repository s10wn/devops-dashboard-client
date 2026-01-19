import { gql } from '@apollo/client';

export const SERVERS_QUERY = gql`
  query Servers {
    servers {
      id
      name
      host
      port
      checkType
      httpPath
      checkInterval
      status
      lastCheckAt
      lastOnlineAt
      agentConnected
      isActive
      uptimePercentage
      projectId
      provider
      monthlyPrice
      agentMetrics {
        cpuUsage
        memoryUsage
        processCount
        onlineProcessCount
      }
    }
  }
`;

export const SERVER_QUERY = gql`
  query Server($id: ID!) {
    server(id: $id) {
      id
      name
      host
      port
      checkType
      httpPath
      checkInterval
      status
      lastCheckAt
      lastOnlineAt
      agentToken
      agentConnected
      isActive
      metadata
      projectId
      uptimePercentage
      provider
      monthlyPrice
      agentMetrics {
        cpuUsage
        memoryUsage
        diskUsage
        totalMemory
        freeMemory
        processCount
        onlineProcessCount
      }
    }
  }
`;

export const SERVER_CHECKS_QUERY = gql`
  query ServerChecks($serverId: ID!, $limit: Int, $offset: Int) {
    serverChecks(serverId: $serverId, limit: $limit, offset: $offset) {
      id
      checkedAt
      status
      responseTime
      statusCode
      errorMessage
    }
  }
`;

export const SERVER_UPTIME_STATS_QUERY = gql`
  query ServerUptimeStats($serverId: ID!, $period: String) {
    serverUptimeStats(serverId: $serverId, period: $period) {
      uptimePercentage
      totalChecks
      successfulChecks
      averageResponseTime
      downtime
    }
  }
`;

export const SERVER_LOGS_QUERY = gql`
  query ServerLogs($serverId: ID!, $limit: Int, $offset: Int, $level: String) {
    serverLogs(serverId: $serverId, limit: $limit, offset: $offset, level: $level) {
      id
      timestamp
      level
      message
      source
      metadata
    }
  }
`;
