import Button from "../../../components/ui/Button"
import Dialog from "../../../components/ui/Dialog"
import { useTranslation } from "../../../i18n/I18nProvider"
import { OFFER_STATUSES, type OfferStatus } from "../types"

export type StatusDialogProps = {
  open: boolean
  status: OfferStatus
  saving: boolean
  onSelect: (status: OfferStatus) => void
  onClose: () => void
}

/** Changes the status of an offer. */
export default function StatusDialog({
  open,
  status,
  saving,
  onSelect,
  onClose,
}: StatusDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={open}
      title={t("offers.details.changeStatus")}
      onClose={onClose}
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {t("common.cancel")}
        </Button>
      }
    >
      <ul className="space-y-2">
        {OFFER_STATUSES.map((option) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => onSelect(option)}
              disabled={saving}
              className={`w-full rounded-md border px-3 py-2 text-start text-sm font-medium transition-colors ${
                option === status
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-surface text-ink hover:bg-page"
              }`}
            >
              {t(`offers.status.${option}`)}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
