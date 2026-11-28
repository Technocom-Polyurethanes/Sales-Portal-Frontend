/**
 * Fields added by the audit-actor-and-insights backend are optional: an older
 * API may omit any of them and the screen simply renders less detail.
 */
export type SystemDatabaseStatus = {
  status: string
  latencyMs: number
  latencyHistory?: number[]
  serverVersion?: string | null
  sizeBytes?: number | null
  connectionsUsed?: number | null
  connectionsMax?: number | null
  pendingMigrations?: number | null
  lastMigration?: string | null
}

export type SystemLiveStatus = {
  state: string
  disabled: boolean
  pollingFallback: boolean
  changes: string
  notifications: string
  changesLastEventAt?: string | null
  notificationsLastEventAt?: string | null
  reconnectCount?: number | null
  lastError?: string | null
}

export type SystemRealtime = {
  connectedClients?: number
  notificationQueueDepth?: number
  dropped?: number
}

export type SystemAudit = {
  rowsTotal?: number
  queueDepth?: number
  dropped?: number
  lastWriteAt?: string | null
  retentionDays?: number
}

export type SystemJob = {
  name: string
  lastRunAt?: string | null
  durationMs?: number | null
  result?: string | null
  nextRunAt?: string | null
}

export type SystemSecurity = {
  failedSignIns24h?: number
  lastFailedSignInAt?: string | null
  activeUsers?: number
  inactiveUsers?: number
}

export type SystemData = {
  offers?: number
  customers?: number
  materials?: number
  activeUsers?: number
}

export type SystemStatus = {
  status: string
  checkedAt: string
  version: string
  environment: string
  uptimeSeconds: number
  startedAt?: string | null
  commit?: string | null
  apiVersion?: string | null
  database: SystemDatabaseStatus
  live: SystemLiveStatus
  realtime?: SystemRealtime
  audit?: SystemAudit
  jobs?: SystemJob[]
  security?: SystemSecurity
  data?: SystemData
}
