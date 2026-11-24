import { useState } from "react"

import { useToast } from "../../components/ui/ToastProvider"
import { useTranslation } from "../../i18n/I18nProvider"

type DeleteOptions<T> = {
  remove: (item: T) => Promise<void>
  name: (item: T) => string
  onDeleted: () => void
}

/** Confirmation state and feedback shared by every delete button. */
export function useDelete<T extends { id: string }>({
  remove,
  name,
  onDeleted,
}: DeleteOptions<T>) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [target, setTarget] = useState<T | undefined>()
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    if (!target) return
    setBusy(true)
    try {
      await remove(target)
      notify(t("common.deleted", { name: name(target) }))
      setTarget(undefined)
      onDeleted()
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : t("common.somethingWrong"),
        "error",
      )
    } finally {
      setBusy(false)
    }
  }

  return {
    target,
    setTarget,
    busy,
    confirm,
    title: target ? t("common.deleteTitle", { name: name(target) }) : "",
    message: target ? t("common.deleteMessage", { name: name(target) }) : "",
  }
}
