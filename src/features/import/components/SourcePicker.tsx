import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import { SOURCE_KEYS } from "../labels"
import type { ImportSource } from "../types"

const SOURCES: {
  source: ImportSource
  icon: "customers" | "products" | "offers"
}[] = [
  { source: "customers", icon: "customers" },
  { source: "materials", icon: "products" },
  { source: "prices", icon: "offers" },
]

export type SourcePickerProps = {
  value: ImportSource | null
  onChange: (source: ImportSource) => void
  onDownload: () => void
  downloading?: boolean
}

/** Step 1: pick the import type and download its template. */
export default function SourcePicker({
  value,
  onChange,
  onDownload,
  downloading = false,
}: SourcePickerProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label={t("import.chooseSource")}
        className="grid gap-3 sm:grid-cols-3"
      >
        {SOURCES.map(({ source, icon }) => {
          const selected = value === source
          return (
            <button
              key={source}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(source)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-4 text-start text-sm font-medium transition-colors ${
                selected
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-surface text-ink hover:bg-page"
              }`}
            >
              <Icon name={icon} size={20} />
              {t(SOURCE_KEYS[source])}
            </button>
          )
        })}
      </div>

      {value && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownload}
            loading={downloading}
            icon={<Icon name="download" size={15} />}
          >
            {t("import.downloadTemplate")}
          </Button>
          <p className="text-xs text-muted">{t("import.templateHint")}</p>
        </div>
      )}
    </div>
  )
}
