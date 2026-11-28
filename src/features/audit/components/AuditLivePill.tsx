import { useTranslation } from "../../../i18n/I18nProvider"

export type AuditLivePillProps = {
  count: number
  onShow: () => void
}

export default function AuditLivePill({ count, onShow }: AuditLivePillProps) {
  const { t } = useTranslation()
  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-4">
      <button
        type="button"
        onClick={onShow}
        aria-live="polite"
        className="activity-press pointer-events-auto min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary shadow-lg"
      >
        {t("audit.live.newEvents", { count })} — {t("audit.live.show")}
      </button>
    </div>
  )
}
