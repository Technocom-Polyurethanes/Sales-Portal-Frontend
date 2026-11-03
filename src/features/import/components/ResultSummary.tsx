import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../i18n/types"
import type { ImportResult } from "../types"

const COUNTS: {
  key: TranslationKey
  field: "created" | "updated" | "skipped" | "failed"
}[] = [
  { key: "import.result.created", field: "created" },
  { key: "import.result.updated", field: "updated" },
  { key: "import.result.skipped", field: "skipped" },
  { key: "import.result.failed", field: "failed" },
]

export type ResultSummaryProps = {
  result: ImportResult
  onRestart: () => void
}

/** Step 3: what the commit wrote, announced to screen readers. */
export default function ResultSummary({
  result,
  onRestart,
}: ResultSummaryProps) {
  const { t } = useTranslation()

  return (
    <Card title={t("import.result.title")}>
      <div
        role="status"
        aria-live="polite"
        className="grid gap-3 sm:grid-cols-4"
      >
        {COUNTS.map(({ key, field }) => (
          <div
            key={field}
            className="rounded-md border border-line bg-page px-4 py-3 text-center"
          >
            <p className="text-2xl font-semibold text-ink">{result[field]}</p>
            <p className="text-xs text-muted">{t(key)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button
          variant="primary"
          onClick={onRestart}
          icon={<Icon name="import" size={15} />}
        >
          {t("import.result.restart")}
        </Button>
      </div>
    </Card>
  )
}
