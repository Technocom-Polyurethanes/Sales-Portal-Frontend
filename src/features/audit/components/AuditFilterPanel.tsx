import Select from "../../../components/ui/Select"
import { useTranslation } from "../../../i18n/I18nProvider"
import { actionLabel, categoryLabel, outcomeLabel } from "../labels"
import type { AuditFilterOptions } from "../types"
import type { AuditQueryState } from "./auditQueryState"

export type AuditFilterPanelProps = {
  state: AuditQueryState
  options: AuditFilterOptions | undefined
  onChange: (patch: Partial<AuditQueryState>) => void
}

const OUTCOMES = ["success", "failure"]

export default function AuditFilterPanel({
  state,
  options,
  onChange,
}: AuditFilterPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-2 rounded-xl border border-line-soft bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        aria-label={t("audit.fields.actor")}
        value={state.actorId}
        onChange={(event) => onChange({ actorId: event.target.value })}
      >
        <option value="">{t("audit.allActors")}</option>
        {options?.actors.map((actor) => (
          <option key={actor.id} value={actor.id}>
            {actor.fullName} (@{actor.username})
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("audit.allCategories")}
        value={state.category}
        onChange={(event) => onChange({ category: event.target.value })}
      >
        <option value="">{t("audit.allCategories")}</option>
        {options?.categories.map((category) => (
          <option key={category} value={category}>
            {categoryLabel(category, t)}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("audit.fields.action")}
        value={state.action}
        onChange={(event) => onChange({ action: event.target.value })}
      >
        <option value="">{t("audit.allActions")}</option>
        {options?.actions.map((action) => (
          <option key={action} value={action}>
            {actionLabel(action, t)}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("audit.fields.outcome")}
        value={state.outcome}
        onChange={(event) => onChange({ outcome: event.target.value })}
      >
        <option value="">{t("audit.allOutcomes")}</option>
        {OUTCOMES.map((outcome) => (
          <option key={outcome} value={outcome}>
            {outcomeLabel(outcome, t)}
          </option>
        ))}
      </Select>
    </div>
  )
}
