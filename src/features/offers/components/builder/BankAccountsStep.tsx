import { useMemo, useState } from "react"

import Button from "../../../../components/ui/Button"
import Icon from "../../../../components/ui/Icon"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { BankAccount } from "../../../settings/types"
import { activeBanks, bankLabels, toggleBank } from "../../bankSelection"
import BankAccountPicker from "./BankAccountPicker"

export type BankAccountsStepProps = {
  banks: BankAccount[]
  selected: string[]
  onChange: (ids: string[]) => void
}

/** Shows only the accounts printed on this offer; adding more happens in a searchable picker. */
export default function BankAccountsStep({
  banks,
  selected,
  onChange,
}: BankAccountsStepProps) {
  const { t, language } = useTranslation()
  const [picking, setPicking] = useState(false)

  const available = useMemo(() => activeBanks(banks), [banks])
  const selectedSet = new Set(selected)
  const chosen = available.filter((bank) => selectedSet.has(bank.id))
  const canAddMore = chosen.length < available.length

  return (
    <section className="rounded-md border border-line p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">
            {t("offers.builder.banks.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("offers.builder.banks.hint")}
          </p>
        </div>
        {available.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted" aria-live="polite">
              {t("offers.builder.banks.count", {
                selected: chosen.length,
                total: available.length,
              })}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canAddMore}
              onClick={() => setPicking(true)}
            >
              <Icon name="plus" size={14} />
              {t("offers.builder.banks.addAccount")}
            </Button>
          </div>
        )}
      </div>

      {available.length === 0 ? (
        <p className="text-xs text-muted">{t("offers.builder.banks.empty")}</p>
      ) : chosen.length === 0 ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
        >
          {t("offers.builder.banks.required")}
          <Button size="sm" onClick={() => setPicking(true)}>
            {t("offers.builder.banks.addAccount")}
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-line-soft rounded-md border border-line-soft">
          {chosen.map((bank) => {
            const { name, branch } = bankLabels(bank, language)
            return (
              <li key={bank.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {`${branch} · ${bank.accountNumber}`}
                  </span>
                </span>
                <span className="shrink-0 rounded bg-page px-1.5 py-0.5 text-xs text-muted">
                  {bank.currency}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${t("offers.builder.banks.remove")}: ${name} ${bank.accountNumber}`}
                  onClick={() => onChange(toggleBank(selected, bank.id))}
                >
                  <Icon name="close" size={14} />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <BankAccountPicker
        open={picking}
        banks={available}
        selected={selected}
        onChange={onChange}
        onClose={() => setPicking(false)}
      />
    </section>
  )
}
