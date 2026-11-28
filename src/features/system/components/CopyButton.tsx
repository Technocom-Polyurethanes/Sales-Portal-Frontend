import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function CopyButton({
  value,
  label,
}: {
  value: string
  label: string
}) {
  const { t } = useTranslation()
  const { notify } = useToast()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      notify(t("common.copy"), "success", label)
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause), "error")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={<Icon name="copy" size={16} />}
      aria-label={`${t("common.copy")} ${label}`}
      onClick={() => void copy()}
    />
  )
}
