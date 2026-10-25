import { useState } from "react"

import Button from "../../components/ui/Button"
import Dialog from "../../components/ui/Dialog"
import Field from "../../components/ui/Field"
import Icon from "../../components/ui/Icon"
import Input from "../../components/ui/Input"
import Wordmark from "../../components/ui/Wordmark"
import { useTranslation } from "../../i18n/I18nProvider"

export type LoginScreenProps = {
  onLogin: (username: string, password: string) => Promise<boolean>
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t, language, toggleLanguage } = useTranslation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(undefined)

    const success = await onLogin(username, password)
    if (!success) setError(t("auth.invalidCredentials"))
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-7 shadow-sm">
        <Wordmark size="lg" />
        <h1 className="mt-6 text-xl font-semibold text-ink">
          {t("auth.welcomeBack")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("auth.subtitle")}</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field label={t("auth.username")} htmlFor="username">
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </Field>

          <Field label={t("auth.password")} htmlFor="password">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="pe-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 end-2 px-2 text-xs font-medium text-primary"
              >
                {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              </button>
            </div>
          </Field>

          {error && (
            <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading}>
            {t("auth.logIn")}
          </Button>

          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="self-center text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {t("auth.forgotPassword")}
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            className="self-center text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            {language === "ar" ? "English" : "العربية"}
          </button>
        </form>
      </div>

      <Dialog
        open={resetOpen}
        title={t("auth.resetTitle")}
        onClose={() => setResetOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setResetOpen(false)}>
            {t("common.close")}
          </Button>
        }
      >
        <p className="text-sm text-muted">{t("auth.resetText")}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-ink">
          <Icon name="user" size={16} />
          {t("auth.username")}
        </p>
      </Dialog>
    </main>
  )
}
