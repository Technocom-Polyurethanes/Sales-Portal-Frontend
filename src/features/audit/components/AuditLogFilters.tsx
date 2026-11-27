import Button from "../../../components/ui/Button"
import Input from "../../../components/ui/Input"
import SearchField from "../../../components/ui/SearchField"
import Select from "../../../components/ui/Select"
import { useTranslation } from "../../../i18n/I18nProvider"
import { actionLabel, categoryLabel, outcomeLabel } from "../labels"
import type { AuditFilterOptions } from "../types"

export type AuditFiltersState = {
  search: string
  from: string
  to: string
  actorId: string
  category: string
  action: string
  outcome: string
}

export type AuditLogFiltersProps = {
  filters: AuditFilterOptions | undefined
  values: AuditFiltersState
  onChange: (key: keyof AuditFiltersState, value: string) => void
  onClear: () => void
  hasFilters: boolean
}

const OUTCOMES = ["success", "failure"]

export default function AuditLogFilters({
  filters,
  values,
  onChange,
  onClear,
  hasFilters,
}: AuditLogFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <SearchField
          value={values.search}
          onChange={(value) => onChange("search", value)}
          placeholder={t("audit.search")}
        />
      </div>
      <Input
        type="date"
        value={values.from}
        aria-label={t("audit.from")}
        onChange={(event) => onChange("from", event.target.value)}
      />
      <Input
        type="date"
        value={values.to}
        aria-label={t("audit.to")}
        onChange={(event) => onChange("to", event.target.value)}
      />
      <Select
        aria-label={t("audit.fields.actor")}
        value={values.actorId}
        onChange={(event) => onChange("actorId", event.target.value)}
      >
        <option value="">{t("audit.allActors")}</option>
        {filters?.actors.map((actor) => (
          <option key={actor.id} value={actor.id}>
            {actor.fullName} (@{actor.username})
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("audit.allCategories")}
        value={values.category}
        onChange={(event) => onChange("category", event.target.value)}
      >
        <option value="">{t("audit.allCategories")}</option>
        {filters?.categories.map((category) => (
          <option key={category} value={category}>
            {categoryLabel(category, t)}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("audit.fields.action")}
        value={values.action}
        onChange={(event) => onChange("action", event.target.value)}
      >
        <option value="">{t("audit.allActions")}</option>
        {filters?.actions.map((action) => (
          <option key={action} value={action}>
            {actionLabel(action, t)}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("audit.fields.outcome")}
        value={values.outcome}
        onChange={(event) => onChange("outcome", event.target.value)}
      >
        <option value="">{t("audit.allOutcomes")}</option>
        {OUTCOMES.map((outcome) => (
          <option key={outcome} value={outcome}>
            {outcomeLabel(outcome, t)}
          </option>
        ))}
      </Select>
      <Button
        variant="ghost"
        onClick={onClear}
        disabled={!hasFilters}
        className="justify-self-start"
      >
        {t("audit.clear")}
      </Button>
    </div>
  )
}
