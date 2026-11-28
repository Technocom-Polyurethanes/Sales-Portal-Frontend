import { useState } from "react"

import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import Input from "../../../components/ui/Input"
import SearchField from "../../../components/ui/SearchField"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import type { AuditFilterOptions } from "../types"
import AuditFilterChips from "./AuditFilterChips"
import AuditFilterPanel from "./AuditFilterPanel"
import {
  PRESETS,
  activeFilterCount,
  presetRange,
  type AuditPreset,
  type AuditQueryState,
} from "./auditQueryState"

export type AuditLogFiltersProps = {
  state: AuditQueryState
  options: AuditFilterOptions | undefined
  totalCount: number
  onChange: (patch: Partial<AuditQueryState>) => void
  onClear: () => void
  onRefresh: () => void
  onExport: () => void
}

export default function AuditLogFilters({
  state,
  options,
  totalCount,
  onChange,
  onClear,
  onRefresh,
  onExport,
}: AuditLogFiltersProps) {
  const { t, language } = useTranslation()
  const [showFilters, setShowFilters] = useState(false)
  const locale = localeForLanguage(language)
  const count = activeFilterCount(state)

  const choosePreset = (preset: AuditPreset) => {
    const [from, to] = presetRange(preset)
    onChange({ preset, from, to })
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => choosePreset(preset)}
            aria-pressed={state.preset === preset}
            className={`activity-press min-h-11 rounded-lg border px-3 text-sm font-medium ${
              state.preset === preset
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {t(`audit.presets.${preset}`)}
          </button>
        ))}
        <span className="ms-auto text-xs text-muted">
          {t("audit.rangeLabel", {
            from: state.from ? formatIsoDay(state.from, locale) : "…",
            to: state.to ? formatIsoDay(state.to, locale) : "…",
          })}
        </span>
      </div>

      {state.preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={state.from}
            aria-label={t("audit.from")}
            onChange={(event) => onChange({ from: event.target.value })}
            className="w-auto"
          />
          <Input
            type="date"
            value={state.to}
            aria-label={t("audit.to")}
            onChange={(event) => onChange({ to: event.target.value })}
            className="w-auto"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={state.search}
          onChange={(search) => onChange({ search })}
          placeholder={t("audit.search")}
        />
        <Button
          variant="secondary"
          onClick={() => setShowFilters((current) => !current)}
          aria-expanded={showFilters}
          aria-controls="audit-filter-panel"
          icon={<Icon name="settings" size={16} />}
        >
          {t("audit.filtersLabel")}
          {count > 0 && (
            <span className="rounded-full bg-primary px-2 text-xs text-on-primary">
              {count}
            </span>
          )}
        </Button>
        <Button
          variant="secondary"
          className="ms-auto"
          onClick={onExport}
          disabled={totalCount === 0}
          title={totalCount === 0 ? t("audit.exportEmpty") : undefined}
          icon={<Icon name="download" size={16} />}
        >
          {t("audit.exportCsv")}
        </Button>
        <Button
          variant="ghost"
          onClick={onRefresh}
          aria-label={t("audit.refresh")}
          title={t("audit.refresh")}
          icon={<Icon name="pulse" size={16} />}
        />
      </div>

      <div id="audit-filter-panel" hidden={!showFilters}>
        <AuditFilterPanel state={state} options={options} onChange={onChange} />
      </div>

      <AuditFilterChips
        state={state}
        options={options}
        onChange={onChange}
        onClear={onClear}
      />
    </div>
  )
}
