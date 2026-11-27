export type SystemDatabaseStatus = {
  status: string
  latencyMs: number
}

export type SystemLiveStatus = {
  state: string
  disabled: boolean
  pollingFallback: boolean
  changes: string
  notifications: string
}

export type SystemStatus = {
  status: string
  checkedAt: string
  version: string
  environment: string
  uptimeSeconds: number
  database: SystemDatabaseStatus
  live: SystemLiveStatus
}
