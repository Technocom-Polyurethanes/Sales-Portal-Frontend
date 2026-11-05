import { useEffect, useMemo, useRef, useState } from "react"

import Button from "../../../../components/ui/Button"
import Dialog from "../../../../components/ui/Dialog"
import Icon from "../../../../components/ui/Icon"
import Input from "../../../../components/ui/Input"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { BankAccount } from "../../../settings/types"
import { bankLabels, filterBanks, setBanks, toggleBank } from "../../bankSelection"

export type BankAccountPickerProps = {
  open: boolean
  banks: BankAccount[]
  selected: string[]
  onChange: (ids: string[]) => void
  onClose: () => void
}

/** Search-first picker: rows toggle on click, so many accounts stay scannable. */
export default function BankAccountPicker({
  open,
  banks,
  selected,
  onChange,
  onClose,
}: BankAccountPickerProps) {
  const { t, language } = useTranslation()
  const [query, setQuery] = useState("")
  const [currency, setCurrency] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery("")
    setCurrency(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  const currencies = useMemo(
    () => [...new Set(banks.map((bank) => bank.currency))].sort(),
    [banks],
  )
  const visible = useMemo(
    () => filterBanks(banks, query, currency),
    [banks, query, currency],
  )
  const selectedSet = new Set(selected)
  const allVisibleSelected =
    visible.length > 0 && visible.every((bank) => selectedSet.has(bank.id))

  return (
    <Dialog
      open={open}
      title={t("offers.builder.banks.pickerTitle")}
      onClose={onClose}
      footer={
        <>
          <span className="me-auto text-xs text-muted" aria-live="polite">
            {t("offers.builder.banks.count", {
              selected: selected.length,
              total: banks.length,
            })}
          </span>
          <Button onClick={onClose}>{t("offers.builder.banks.done")}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("offers.builder.banks.search")}
            aria-label={t("offers.builder.banks.search")}
            className="ps-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {currencies.length > 1 &&
            [null, ...currencies].map((code) => (
              <button
                key={code ?? "all"}
                type="button"
                aria-pressed={currency === code}
                onClick={() => setCurrency(code)}
                className={`h-7 rounded-full border px-3 text-xs font-medium ${
                  currency === code
                    ? "border-primary bg-primary text-white"
                    : "border-line text-ink hover:bg-page"
                }`}
              >
                {code ?? t("offers.builder.banks.allCurrencies")}
              </button>
            ))}
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto"
            disabled={visible.length === 0}
            onClick={() => onChange(setBanks(selected, visible, !allVisibleSelected))}
          >
            {allVisibleSelected
              ? t("offers.builder.banks.clearShown")
              : t("offers.builder.banks.selectShown", { count: visible.length })}
          </Button>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-md border border-line-soft p-3 text-xs text-muted">
            {t("offers.builder.banks.noMatch")}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-line-soft overflow-y-auto rounded-md border border-line-soft">
            {visible.map((bank) => {
              const { name, branch } = bankLabels(bank, language)
              const added = selectedSet.has(bank.id)
              return (
                <li key={bank.id}>
                  <button
                    type="button"
                    aria-pressed={added}
                    onClick={() => onChange(toggleBank(selected, bank.id))}
                    className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-page"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {`${branch} · ${bank.accountNumber} · ${bank.currency}`}
                      </span>
                    </span>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        added ? "bg-primary text-white" : "border border-line text-ink"
                      }`}
                    >
                      <Icon name={added ? "check" : "plus"} size={12} />
                      {added
                        ? t("offers.builder.banks.added")
                        : t("offers.builder.banks.add")}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
