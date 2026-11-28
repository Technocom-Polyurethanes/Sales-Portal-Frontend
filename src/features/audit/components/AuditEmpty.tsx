import Button from "../../../components/ui/Button"
import { useTranslation } from "../../../i18n/I18nProvider"

export type AuditEmptyProps = {
  firstTime: boolean
  filtered: boolean
  onClear: () => void
  onTryRange: () => void
}

export default function AuditEmpty({
  firstTime,
  filtered,
  onClear,
  onTryRange,
}: AuditEmptyProps) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-line-soft bg-surface px-5 py-12 text-center">
      <p className="font-semibold text-ink">
        {t(
          firstTime
            ? "audit.empty"
            : filtered
              ? "audit.emptyFiltered"
              : "audit.emptyRange",
        )}
      </p>
      {firstTime ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {t("audit.firstTimeHint")}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {filtered && (
            <Button variant="secondary" size="sm" onClick={onClear}>
              {t("audit.clear")}
            </Button>
          )}
          {!filtered && (
            <Button variant="secondary" size="sm" onClick={onTryRange}>
              {t("audit.tryRange", { range: t("audit.presets.seven") })}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
