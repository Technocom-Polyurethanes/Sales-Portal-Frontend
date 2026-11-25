import Button from "./Button"
import Dialog from "./Dialog"
import { useTranslation } from "../../i18n/I18nProvider"

export type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={loading}
            autoFocus
            onClick={() => void onConfirm()}
          >
            {t("common.delete")}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Dialog>
  )
}
