import { Link } from "react-router-dom"

import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatNumber } from "../../../lib/formatters/relative"
import { categoryLabel } from "../labels"
import type { AuditLog } from "../types"

export type AuditLogDetailsProps = {
  row: AuditLog
  onUser: (actorId: string) => void
  onRecord: (entityType: string, entityId: string) => void
}

const CAPTION = "mb-1 text-[11px] font-semibold uppercase text-muted"

export default function AuditLogDetails({
  row,
  onUser,
  onRecord,
}: AuditLogDetailsProps) {
  const { t, language } = useTranslation()
  const { notify } = useToast()
  const details = row.details ?? {}
  const entries = Object.entries(details).filter(
    ([key]) => key !== "from" && key !== "to",
  )
  const hasArrow = details.from !== undefined || details.to !== undefined

  const copy = async (label: string, value: string) => {
    if (!navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      notify(t("audit.row.copied", { label }))
    } catch {
      // Clipboard permission can be denied; the value stays visible on screen.
    }
  }

  const copyButton = (label: string, value: string) => (
    <button
      type="button"
      className="activity-press inline-flex size-11 items-center justify-center text-muted hover:text-primary"
      aria-label={t("audit.row.copy", { label })}
      onClick={() => void copy(label, value)}
    >
      <Icon name="copy" size={15} />
    </button>
  )

  return (
    <div className="border-t border-line-soft bg-page/60 px-4 py-3 text-xs text-ink">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <section className="sm:col-span-2 lg:col-span-3">
          <p className={CAPTION}>{t("audit.row.description")}</p>
          <p className="text-sm">{row.description}</p>
        </section>

        {(entries.length > 0 || hasArrow) && (
          <section>
            <p className={CAPTION}>{t("audit.row.details")}</p>
            <div className="flex flex-wrap gap-1.5">
              {entries.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-line-soft bg-surface px-2 py-1"
                >
                  <span className="text-muted">{key}: </span>
                  <span dir="ltr">{value}</span>
                </span>
              ))}
              {hasArrow && (
                <span className="inline-flex items-center gap-1 rounded-full border border-line-soft bg-surface px-2 py-1">
                  <span className="text-muted">{t("audit.row.from")}</span>
                  <span dir="ltr">{details.from ?? "—"}</span>
                  <Icon name="arrow" size={12} />
                  <span className="text-muted">{t("audit.row.to")}</span>
                  <span dir="ltr">{details.to ?? "—"}</span>
                </span>
              )}
            </div>
          </section>
        )}

        {row.ipAddress && (
          <section>
            <p className={CAPTION}>{t("audit.row.ip")}</p>
            <span className="inline-flex items-center gap-1" dir="ltr">
              {row.ipAddress}
              {copyButton(t("audit.row.ip"), row.ipAddress)}
            </span>
          </section>
        )}

        {row.userAgentLabel && (
          <section>
            <p className={CAPTION}>{t("audit.row.device")}</p>
            <p>{row.userAgentLabel}</p>
          </section>
        )}

        {row.durationMs !== null && row.durationMs !== undefined && (
          <section>
            <p className={CAPTION}>{t("audit.row.duration")}</p>
            <p dir="ltr">
              {t("audit.ms", {
                count: formatNumber(
                  row.durationMs,
                  localeForLanguage(language),
                ),
              })}
            </p>
          </section>
        )}

        {row.path && (
          <section className="min-w-0">
            <p className={CAPTION}>{t("audit.row.request")}</p>
            <span className="inline-flex min-w-0 items-center gap-1" dir="ltr">
              <code className="truncate rounded bg-surface px-1.5 py-1">
                {row.httpMethod ? `${row.httpMethod} ` : ""}
                {row.path}
              </code>
              {copyButton(t("audit.row.request"), row.path)}
            </span>
          </section>
        )}

        {row.entityId && (
          <section>
            <p className={CAPTION}>{t("audit.row.recordId")}</p>
            <p dir="ltr">{row.entityId}</p>
          </section>
        )}

        {(row.entityRoute ||
          row.actorUserId ||
          (row.entityType && row.entityId)) && (
          <section className="flex flex-wrap items-center gap-2">
            {row.entityRoute && (
              <Link
                to={row.entityRoute}
                className="activity-press min-h-11 rounded-lg px-2 text-sm font-semibold text-primary hover:underline"
              >
                {t("audit.row.open", {
                  entity: row.entityType ?? categoryLabel(row.category, t),
                })}
              </Link>
            )}
            {row.actorUserId && (
              <Button
                variant="ghost"
                size="sm"
                className="activity-press"
                onClick={() => onUser(row.actorUserId as string)}
              >
                {t("audit.row.byUser")}
              </Button>
            )}
            {row.entityType && row.entityId && (
              <Button
                variant="ghost"
                size="sm"
                className="activity-press"
                onClick={() =>
                  onRecord(row.entityType as string, row.entityId as string)
                }
              >
                {t("audit.row.forRecord")}
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
