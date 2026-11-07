import { useState } from "react"

import Field from "../../../components/ui/Field"
import Input from "../../../components/ui/Input"
import { useTranslation } from "../../../i18n/I18nProvider"

export type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
}

/** A new password the admin types and then shares, so it can be shown while typing. */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
}: PasswordFieldProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <Field label={label} required htmlFor={id} hint={hint} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pe-16"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 end-3 text-xs font-medium text-primary hover:text-primary-hover"
        >
          {t(visible ? "auth.hidePassword" : "auth.showPassword")}
        </button>
      </div>
    </Field>
  )
}
