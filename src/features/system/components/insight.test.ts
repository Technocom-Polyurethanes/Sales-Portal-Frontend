import { describe, expect, it } from "vitest"

import type { TranslateFunction } from "../../../i18n/I18nProvider"
import en from "../../../i18n/en.json"
import { translate } from "../../../i18n/translate"
import type { SystemStatus } from "../types"

import {
  diagnosticsText,
  msText,
  stateTone,
  statusInsight,
  uptimeText,
} from "./insight"

const t: TranslateFunction = (key, params) => translate(en, en, key, params)

const base: SystemStatus = {
  status: "Healthy",
  checkedAt: "2026-11-28T10:00:00.000Z",
  version: "1.11.0",
  environment: "Production",
  uptimeSeconds: 1_416_240,
  database: { status: "Up", latencyMs: 24 },
  live: {
    state: "connected",
    disabled: false,
    pollingFallback: false,
    changes: "connected",
    notifications: "connected",
  },
}

describe("system status insight", () => {
  it("explains a healthy deployment with the checked time", () => {
    expect(statusInsight(base)).toMatchObject({
      reasonKey: "system.reasons.healthy",
      tone: "accepted",
    })
  })

  it("explains a disconnected listener", () => {
    const status = {
      ...base,
      live: { ...base.live, notifications: "disconnected" },
    }
    expect(statusInsight(status).reasonKey).toBe("system.reasons.listener")
    expect(
      statusInsight({ ...base, live: { ...base.live, pollingFallback: true } })
        .reasonKey,
    ).toBe("system.reasons.listener")
  })

  it("explains a down database, taking priority over other signals", () => {
    const status = {
      ...base,
      status: "Unhealthy",
      database: {
        ...base.database,
        status: "Down",
        latencyMs: 0,
        pendingMigrations: 2,
      },
      realtime: { dropped: 3 },
    }
    expect(statusInsight(status)).toMatchObject({
      reasonKey: "system.reasons.database",
      tone: "rejected",
    })
  })

  it("explains pending migrations with a count", () => {
    const status = {
      ...base,
      database: { ...base.database, pendingMigrations: 2 },
    }
    expect(statusInsight(status)).toMatchObject({
      reasonKey: "system.reasons.migrations",
      count: 2,
    })
  })

  it("explains dropped notifications on their own", () => {
    const status = { ...base, realtime: { dropped: 3 } }
    expect(statusInsight(status).reasonKey).toBe("system.reasons.dropped")
  })

  it("does not colour an inactive state amber", () => {
    expect(stateTone("disabled")).toBe("neutral")
    expect(stateTone(undefined)).toBe("neutral")
    expect(stateTone("connected")).toBe("accepted")
    expect(stateTone("disconnected")).toBe("rejected")
  })

  it("formats uptime, missing latency and a full diagnostics snapshot", () => {
    expect(uptimeText(base.uptimeSeconds, t)).toBe("16d 9h 24m")
    expect(msText(null, "en-US", t)).toBe("—")
    expect(msText(24, "en-US", t)).toBe("24 ms")
    expect(diagnosticsText(base)).toContain('"environment": "Production"')
  })
})
