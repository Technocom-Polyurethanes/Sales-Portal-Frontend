import { useMemo, useState } from "react"

import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { BankAccount } from "../../../settings/types"
import {
  activeBanks,
  bankLabels,
  filterBanks,
  setBanks,
  toggleBank,
} from "../../bankSelection"

export type BankAccountsStepProps = {
  banks: BankAccount[]
  selected: string[]
  onChange: (ids: string[]) => void
}

/** The accounts printed under the totals, chosen per offer. Built for long lists. */
export default function BankAccountsStep({
  banks,
  selected,
  onChange,
}: BankAccountsStepProps) {
  const { t, language } = useTranslation()
  const [query, setQuery] = useState("")
  const [currency, setCurrency] = useState<string | null>(null)

  const available = useMemo(() => activeBanks(banks), [banks])
  const currencies = useMemo(
    () => [...new Set(available.map((bank) => bank.currency))].sort(),
    [available],
  )
  const visible = useMemo(
    () => filterBanks(available, query, currency),
    [available, query, currency],
  )
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const selectedBanks = available.filter((bank) => selectedSet.has(bank.id))
  const filtered = query.trim() !== "" || currency !== null
  const allVisibleSelected =
    visible.length > 0 && visible.every((bank) => selectedSet.has(bank.id))
  const anyVisibleSelected = visible.some((bank) => selectedSet.has(bank.id))

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
          <span
            className="rounded-full bg-page px-2.5 py-1 text-xs font-medium text-ink"
            aria-live="polite"
          >
            {t("offers.builder.banks.count", {
              selected: selected.length,
              total: available.length,
            })}
          </span>
        )}
      </div>

      {available.length === 0 ? (
        <p className="text-xs text-muted">{t("offers.builder.banks.empty")}</p>
      ) : (
        <>
          {selectedBanks.length > 0 && (
            <ul
              className="mb-3 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto"
              aria-label={t("offers.builder.banks.selected")}
            >
              {selectedBanks.map((bank) => {
                const { name } = bankLabels(bank, language)
                return (
                  <li key={bank.id}>
                    <button
                      type="button"
                      onClick={() => onChange(toggleBank(selected, bank.id))}
                      title={bank.accountNumber}
                      className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink hover:bg-page"
                    >
                      <span>{`${name} · ${bank.currency}`}</span>
                      <span aria-hidden="true">×</span>
                      <span className="sr-only">
                        {t("offers.builder.banks.remove")}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("offers.builder.banks.search")}
              aria-label={t("offers.builder.banks.search")}
              className="min-w-0 flex-1 sm:max-w-xs"
            />
            {currencies.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {[null, ...currencies].map((code) => (
                  <button
                    key={code ?? "all"}
                    type="button"
                    aria-pressed={currency === code}
                    onClick={() => setCurrency(code)}
                    className={`h-8 rounded-full border px-3 text-xs font-medium ${
                      currency === code
                        ? "border-primary bg-primary text-white"
                        : "border-line text-ink hover:bg-page"
                    }`}
                  >
                    {code ?? t("offers.builder.banks.allCurrencies")}
                  </button>
                ))}
              </div>
            )}
            <div className="ms-auto flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={visible.length === 0 || allVisibleSelected}
                onClick={() => onChange(setBanks(selected, visible, true))}
              >
                {filtered
                  ? t("offers.builder.banks.selectShown", { count: visible.length })
                  : t("offers.builder.banks.selectAll")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!anyVisibleSelected}
                onClick={() => onChange(setBanks(selected, visible, false))}
              >
                {filtered
                  ? t("offers.builder.banks.clearShown")
                  : t("offers.builder.banks.selectNone")}
              </Button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-md border border-line-soft p-3 text-xs text-muted">
              {t("offers.builder.banks.noMatch")}
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-line-soft overflow-y-auto rounded-md border border-line-soft">
              {visible.map((bank) => {
                const { name, branch } = bankLabels(bank, language)
                return (
                  <li key={bank.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-page">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(bank.id)}
                        onChange={() => onChange(toggleBank(selected, bank.id))}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
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
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          {selected.length === 0 && (
            <p
              role="alert"
              className="mt-3 rounded border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-danger"
            >
              {t("offers.builder.banks.required")}
            </p>
          )}
        </>
      )}
    </section>
  )
}
