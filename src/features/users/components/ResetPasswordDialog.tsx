import { useState } from "react"

import Button from "../../../components/ui/Button"
import Dialog from "../../../components/ui/Dialog"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { usersApi } from "../api"
import { fieldErrorsOf } from "../fieldErrors"
import type { UserRecord } from "../types"
import PasswordField from "./PasswordField"

export type ResetPasswordDialogProps = {
  user: UserRecord
  onClose: () => void
}

/** Sets a new password for a user. Mount with a key so the field resets per user. */
export default function ResetPasswordDialog({
  user,
  onClose,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (password.length < 8) {
      setError(t("users.hints.password"))
      return
    }

    setSaving(true)
    setError("")
    try {
      await usersApi.resetPassword(user.id, password)
      notify(t("users.passwordReset"))
      onClose()
    } catch (cause) {
      const message =
        fieldErrorsOf(cause).newPassword ??
        (cause instanceof Error ? cause.message : t("common.somethingWrong"))
      setError(message)
      notify(message, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      size="sm"
      title={t("users.resetTitle", { name: user.fullName })}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={save} loading={saving}>
            {t("users.resetPassword")}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">{t("users.resetHint")}</p>
      <PasswordField
        id="reset-password"
        label={t("users.fields.newPassword")}
        value={password}
        onChange={setPassword}
        error={error}
      />
    </Dialog>
  )
}
