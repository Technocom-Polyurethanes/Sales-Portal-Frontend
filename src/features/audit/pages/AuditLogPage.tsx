import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import Button from "../../../components/ui/Button"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { useNow } from "../../../lib/hooks/useNow"
import { auditApi } from "../api"
import AuditEmpty from "../components/AuditEmpty"
import AuditLivePill from "../components/AuditLivePill"
import AuditLogCards from "../components/AuditLogCards"
import AuditLogFilters from "../components/AuditLogFilters"
import AuditLogTable from "../components/AuditLogTable"
import AuditSkeleton from "../components/AuditSkeleton"
import AuditSummaryStrip from "../components/AuditSummaryStrip"
import AuditTableFooter from "../components/AuditTableFooter"
import {
  auditFilterRequest,
  auditQueryParams,
  auditRequest,
  isLongRange,
  isRangeOnly,
  newAuditRows,
  parseAuditState,
  presetRange,
  type AuditQueryState,
} from "../components/auditQueryState"

/** Admin only: the append-only record of who changed what, newest first. */
export default function AuditLogPage() {
  const { t, language } = useTranslation()
  const { notify } = useToast()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const search = params.toString()
  const state = useMemo(
    () => parseAuditState(new URLSearchParams(search)),
    [search],
  )
  const [openId, setOpenId] = useState<string | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(0)
  const knownIds = useRef<Set<string> | null>(null)
  const lastPage = useRef(state.page)
  const scrolled = useRef(false)

  const setQuery = useCallback(
    (patch: Partial<AuditQueryState>) => {
      setParams(auditQueryParams({ ...state, ...patch, page: 1 }), {
        replace: true,
      })
    },
    [setParams, state],
  )

  const goToPage = (page: number) =>
    setParams(auditQueryParams({ ...state, page }), { replace: true })

  const filters = useAsyncData(() => auditApi.filters(), [])
  const logs = useAsyncData(
    () => auditApi.list(auditRequest(state)),
    [search],
    {
      live: ["audit"],
    },
  )
  const summary = useAsyncData(
    () => auditApi.summary(auditFilterRequest(state)),
    [search],
    { live: ["audit"] },
  )
  const allSummary = useAsyncData(() => auditApi.summary(), [])

  const filterKey = JSON.stringify(auditFilterRequest(state))
  useEffect(() => {
    knownIds.current = null
    setPending(0)
    setNewIds(new Set())
  }, [filterKey])

  useEffect(() => {
    if (lastPage.current !== state.page) {
      lastPage.current = state.page
      knownIds.current = null
      setPending(0)
      setNewIds(new Set())
    }
  }, [state.page])

  useEffect(() => {
    const onScroll = () => {
      scrolled.current = window.scrollY > 24
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const items = logs.data?.items
    if (!items) return
    const result = newAuditRows(
      knownIds.current,
      items,
      !scrolled.current,
      state.page,
    )
    if (result.fresh.length > 0) {
      if (result.pending > 0) {
        setPending((current) => current + result.pending)
      }
      setNewIds((current) => new Set([...current, ...result.fresh]))
    }
    knownIds.current = result.ids
  }, [logs.data, state.page])

  const showNewEvents = () => {
    setParams(auditQueryParams({ ...state, page: 1 }), { replace: true })
    setPending(0)
    scrolled.current = false
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const exportCsv = async () => {
    if ((logs.data?.totalCount ?? 0) === 0) {
      notify(t("audit.exportEmpty"), "warning")
      return
    }
    try {
      const { blob, filename } = await auditApi.exportCsv(
        auditFilterRequest(state),
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL?.(url)
      notify(t("audit.exportDone"))
    } catch {
      notify(t("audit.exportEmpty"), "error")
    }
  }

  const refresh = () => {
    logs.reload()
    summary.reload()
  }

  const clearFilters = (resetRange: boolean) =>
    setQuery({
      search: "",
      actorId: "",
      category: "",
      action: "",
      outcome: "",
      entityType: "",
      entityId: "",
      ...(resetRange
        ? {
            preset: "today" as const,
            from: presetRange("today")[0],
            to: presetRange("today")[1],
          }
        : {}),
    })

  const rows = logs.data?.items ?? []
  const totalCount = logs.data?.totalCount ?? 0
  const totalPages = logs.data?.totalPages ?? 1
  const loading = logs.loading && !logs.data
  const empty = !loading && !logs.error && rows.length === 0
  const locale = localeForLanguage(language)

  const rowProps = {
    rows,
    openId,
    newIds,
    now,
    locale,
    onToggle: (id: string) =>
      setOpenId((current) => (current === id ? null : id)),
    onUser: (actorId: string) => setQuery({ actorId }),
    onRecord: (entityType: string, entityId: string) => {
      const row = rows.find(
        (item) => item.entityType === entityType && item.entityId === entityId,
      )
      // The backend filters on entity label text, not on the internal entity id.
      setQuery({ entityType, entityId: "", search: row?.entityLabel ?? "" })
    },
  }

  return (
    <>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />
      <AuditSummaryStrip
        summary={summary.data}
        longRange={isLongRange(state)}
        onFilter={(key, value) =>
          key === "outcome"
            ? setQuery({ outcome: value })
            : setQuery({ category: value })
        }
      />
      <AuditLogFilters
        state={state}
        options={filters.data}
        totalCount={totalCount}
        onChange={setQuery}
        onClear={() => clearFilters(true)}
        onRefresh={refresh}
        onExport={() => void exportCsv()}
      />
      <AuditLivePill count={pending} onShow={showNewEvents} />

      {loading ? (
        <AuditSkeleton />
      ) : logs.error ? (
        <div className="rounded-xl border border-line-soft bg-surface px-5 py-10 text-center">
          <p className="text-sm text-danger">{logs.error.message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={logs.reload}
          >
            {t("audit.refresh")}
          </Button>
        </div>
      ) : empty ? (
        <AuditEmpty
          firstTime={allSummary.data?.actions === 0}
          filtered={!isRangeOnly(state)}
          onClear={() => clearFilters(false)}
          onTryRange={() => {
            const [from, to] = presetRange("seven")
            setQuery({ preset: "seven", from, to })
          }}
        />
      ) : (
        <div className="rounded-xl border border-line-soft bg-surface">
          <div className="hidden md:block">
            <AuditLogTable {...rowProps} />
          </div>
          <div className="md:hidden">
            <AuditLogCards {...rowProps} />
          </div>
          <div className="border-t border-line-soft px-3 pb-3">
            <AuditTableFooter
              page={state.page}
              pageSize={state.pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPageSizeChange={(pageSize) => setQuery({ pageSize })}
            />
          </div>
        </div>
      )}
    </>
  )
}
