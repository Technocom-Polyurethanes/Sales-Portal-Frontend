import { useCallback, useEffect, useRef, useState } from "react"

import PageHeader from "../../../app/layout/PageHeader"
import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import Icon from "../../../components/ui/Icon"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { useNow } from "../../../lib/hooks/useNow"

import { systemApi } from "../api"
import ApplicationCard from "../components/ApplicationCard"
import AuditCard from "../components/AuditCard"
import DatabaseCard from "../components/DatabaseCard"
import { diagnosticsText, statusInsight } from "../components/insight"
import DataCard from "../components/DataCard"
import JobsCard from "../components/JobsCard"
import LiveCard from "../components/LiveCard"
import RealtimeCard from "../components/RealtimeCard"
import SecurityCard from "../components/SecurityCard"
import SkeletonCards from "../components/SkeletonCards"
import StatusBanner from "../components/StatusBanner"

const BENTO_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12"
const CELL = "min-w-0 [&>section]:h-full"
const TILE = `${CELL} [&>section]:shadow-bento`
const FEATURE = `${CELL} sm:col-span-2 lg:col-span-6 lg:row-span-2 [&>section]:!border-primary/25 [&>section]:!bg-primary-soft/25 [&>section]:shadow-bento-feature`

/** Admin only: a live, plain-language view of the deployment's health. */
export default function SystemStatusPage() {
  const { t, language } = useTranslation()
  const { notify } = useToast()
  const now = useNow()
  const status = useAsyncData(() => systemApi.status())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [hidden, setHidden] = useState(() => document.hidden)
  const [samples, setSamples] = useState<number[]>([])
  const [staleSince, setStaleSince] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setRefreshing(true)
    try {
      const next = await systemApi.status()
      status.mutate(() => next)
      setSamples((current) => [...current, next.database.latencyMs].slice(-20))
      setStaleSince(null)
      setProgressKey((value) => value + 1)
    } catch {
      setStaleSince((current) => current ?? new Date().toISOString())
    } finally {
      busy.current = false
      setRefreshing(false)
    }
  }, [status.mutate])

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [autoRefresh, refresh])

  const copyDiagnostics = async () => {
    if (!status.data) return
    try {
      await navigator.clipboard.writeText(diagnosticsText(status.data))
      notify(t("system.diagnosticsCopied"), "success")
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause), "error")
    }
  }

  const header = (
    <PageHeader
      title={t("system.title")}
      subtitle={t("system.subtitle")}
      action={
        <>
          <Button
            variant="secondary"
            onClick={() => void refresh()}
            disabled={refreshing || !status.data}
          >
            {t("system.refresh")}
          </Button>
          <Button
            variant="secondary"
            icon={<Icon name="copy" size={16} />}
            onClick={() => void copyDiagnostics()}
            disabled={!status.data}
          >
            {t("system.copyDiagnostics")}
          </Button>
        </>
      }
    />
  )

  if (status.error) {
    return (
      <>
        {header}
        <Card>
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink">{status.error.message}</p>
            <Button variant="secondary" size="sm" onClick={status.reload}>
              {t("common.retry")}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  if (!status.data) {
    return (
      <>
        {header}
        <p role="status" className="sr-only">
          {t("common.loading")}
        </p>
        <SkeletonCards />
      </>
    )
  }

  const { data } = status
  const locale = localeForLanguage(language)

  return (
    <>
      {header}
      <StatusBanner
        status={data}
        insight={statusInsight(data)}
        locale={locale}
        autoRefresh={autoRefresh}
        onAutoRefresh={setAutoRefresh}
        hidden={hidden}
        staleSince={staleSince}
        progressKey={progressKey}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />
      <div className={BENTO_GRID}>
        <div className={FEATURE}>
          <DatabaseCard
            database={data.database}
            samples={samples}
            locale={locale}
          />
        </div>
        <div className={FEATURE}>
          <ApplicationCard status={data} locale={locale} />
        </div>
        <div className={`${TILE} sm:col-span-2 lg:col-span-7`}>
          <JobsCard jobs={data.jobs} now={now} locale={locale} />
        </div>
        <div className={`${TILE} lg:col-span-5`}>
          <AuditCard audit={data.audit} now={now} locale={locale} />
        </div>
        <div className={`${TILE} lg:col-span-7`}>
          <LiveCard live={data.live} now={now} locale={locale} />
        </div>
        <div className={`${TILE} lg:col-span-5`}>
          <SecurityCard security={data.security} now={now} locale={locale} />
        </div>
        <div className={`${TILE} lg:col-span-5`}>
          <RealtimeCard realtime={data.realtime} locale={locale} />
        </div>
        <div className={`${TILE} lg:col-span-7`}>
          <DataCard data={data.data} locale={locale} />
        </div>
      </div>
    </>
  )
}
