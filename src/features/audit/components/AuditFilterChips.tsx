import Button from "../../../components/ui/Button"
import { useTranslation } from "../../../i18n/I18nProvider"
import { actionLabel, categoryLabel, outcomeLabel } from "../labels"
import type { AuditFilterOptions } from "../types"
import type { AuditQueryState } from "./auditQueryState"

export type AuditFilterChipsProps = {
  state: AuditQueryState
  options: AuditFilterOptions | undefined
  onChange: (patch: Partial<AuditQueryState>) => void
  onClear: () => void
}

export default function AuditFilterChips({
  state,
  options,
  onChange,
  onClear,
}: AuditFilterChipsProps) {
  const { t } = useTranslation()
  const quick = [
    {
      key: "failures",
      patch: { outcome: "failure" },
      clear: { outcome: "" },
      active: state.outcome === "failure",
    },
    {
      key: "signIns",
      patch: { category: "auth" },
      clear: { category: "" },
      active: state.category === "auth",
    },
    {
      key: "offerChanges",
      patch: { category: "offers" },
      clear: { category: "" },
      active: state.category === "offers",
    },
    {
      key: "userManagement",
      patch: { category: "users" },
      clear: { category: "" },
      active: state.category === "users",
    },
  ] as const

  const chips: {
    key: string
    label: string
    clear: Partial<AuditQueryState>
  }[] = []
  if (state.actorId) {
    const actor = options?.actors.find((item) => item.id === state.actorId)
    chips.push({
      key: "actorId",
      label: `${t("audit.chips.user")}: ${actor?.fullName ?? state.actorId}`,
      clear: { actorId: "" },
    })
  }
  if (state.category) {
    chips.push({
      key: "category",
      label: `${t("audit.chips.category")}: ${categoryLabel(state.category, t)}`,
      clear: { category: "" },
    })
  }
  if (state.action) {
    chips.push({
      key: "action",
      label: `${t("audit.chips.action")}: ${actionLabel(state.action, t)}`,
      clear: { action: "" },
    })
  }
  if (state.outcome) {
    chips.push({
      key: "outcome",
      label: `${t("audit.chips.outcome")}: ${outcomeLabel(state.outcome, t)}`,
      clear: { outcome: "" },
    })
  }
  if (state.entityType && state.entityId) {
    chips.push({
      key: "entityId",
      label: `${t("audit.chips.entity")}: ${state.entityId}`,
      clear: { entityType: "", entityId: "" },
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {quick.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={item.active}
          onClick={() => onChange(item.active ? item.clear : item.patch)}
          className={`activity-press min-h-11 rounded-full border px-3 text-xs ${
            item.active
              ? "border-primary bg-primary-soft text-primary"
              : "border-line-soft bg-surface text-muted"
          }`}
        >
          {t(`audit.quick.${item.key}`)}
        </button>
      ))}
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          title={t("audit.clear")}
          onClick={() => onChange(chip.clear)}
          className="activity-press min-h-11 rounded-full border border-line bg-page px-3 text-xs text-ink"
        >
          {chip.label} <span aria-hidden="true">×</span>
        </button>
      ))}
      {(chips.length > 0 || state.search) && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t("audit.clear")}
        </Button>
      )}
    </div>
  )
}
