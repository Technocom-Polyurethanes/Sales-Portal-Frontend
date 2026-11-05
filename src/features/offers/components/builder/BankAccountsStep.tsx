import Button from "../../../../components/ui/Button"
import { useTranslation } from "../../../../i18n/I18nProvider"
import { setAllBanks, toggleBank } from "../../bankSelection"
import type { BankAccount } from "../../../settings/types"

export type BankAccountsStepProps = {
  banks: BankAccount[]
  selected: string[]
  onChange: (ids: string[]) => void
}

/** The accounts printed under the totals, chosen per offer. */
export default function BankAccountsStep({
  banks,
  selected,
  onChange,
}: BankAccountsStepProps) {
  const { t, language } = useTranslation()
  const allSelected = banks.length > 0 && selected.length === banks.length

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

        {banks.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={allSelected}
              onClick={() => onChange(setAllBanks(true, banks))}
            >
              {t("offers.builder.banks.selectAll")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={selected.length === 0}
              onClick={() => onChange(setAllBanks(false, banks))}
            >
              {t("offers.builder.banks.selectNone")}
            </Button>
          </div>
        )}
      </div>

      {banks.length === 0 ? (
        <p className="text-xs text-muted">{t("offers.builder.banks.empty")}</p>
      ) : (
        <div className="grid gap-2">
          {banks.map((bank) => {
            const name =
              language === "ar" ? bank.bankAr || bank.bank : bank.bank
            const branch =
              language === "ar" ? bank.branchAr || bank.branch : bank.branch

            return (
              <label
                key={bank.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-line-soft p-3 hover:bg-page"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(bank.id)}
                  onChange={() => onChange(toggleBank(selected, bank.id))}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {name}
                  </span>
                  <span className="block text-xs text-muted">
                    {`${branch} · ${bank.accountNumber} · ${bank.currency}`}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      {banks.length > 0 && selected.length === 0 && (
        <p
          role="alert"
          className="mt-3 rounded border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-danger"
        >
          {t("offers.builder.banks.required")}
        </p>
      )}
    </section>
  )
}
