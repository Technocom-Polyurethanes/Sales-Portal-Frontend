import { useState } from "react"

import Button from "../../../../components/ui/Button"
import { useTranslation } from "../../../../i18n/I18nProvider"
import { formatDateTime } from "../../../../lib/formatters/date"
import { localeForLanguage } from "../../../../lib/formatters/locale"

export type RestoredNoticeProps = {
  /** Epoch milliseconds of the moment the restored copy was last written. */
  savedAt: number
  onStartOver: () => void
  onDismiss: () => void
}

/** Tells the user the form was brought back after a refresh, and lets them start over. */
export default function RestoredNotice({
  savedAt,
  onStartOver,
  onDismiss,
}: RestoredNoticeProps) {
  const { t, language } = useTranslation()
  // Starting over throws the work away, so it asks once more instead of acting on a misclick.
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm text-ink"
    >
      <div className="min-w-0">
        <p className="font-medium">{t("offers.builder.restored.title")}</p>
        <p className="text-xs text-muted">
          {t("offers.builder.restored.message", {
            time: formatDateTime(
              new Date(savedAt).toISOString(),
              localeForLanguage(language),
            ),
          })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant={confirming ? "danger" : "secondary"}
          onClick={() => {
            if (confirming) onStartOver()
            else setConfirming(true)
          }}
        >
          {confirming
            ? t("offers.builder.restored.startOverConfirm")
            : t("offers.builder.restored.startOver")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("offers.builder.restored.dismiss")}
        </Button>
      </div>
    </div>
  )
}
