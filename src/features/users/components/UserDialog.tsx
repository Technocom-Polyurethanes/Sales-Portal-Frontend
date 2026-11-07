import { useState } from "react"

import Button from "../../../components/ui/Button"
import Dialog from "../../../components/ui/Dialog"
import Field from "../../../components/ui/Field"
import Input from "../../../components/ui/Input"
import Select from "../../../components/ui/Select"
import Toggle from "../../../components/ui/Toggle"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { ROLES } from "../../account/permissions"
import { userToFormValues, usersApi } from "../api"
import { fieldErrorsOf, suggestInitials } from "../fieldErrors"
import type { UserFormValues, UserRecord } from "../types"
import PasswordField from "./PasswordField"

export type UserDialogProps = {
  /** The user to edit; leave empty to create one. */
  user?: UserRecord
  /** The signed in admin editing their own record: role and status stay as they are. */
  isSelf?: boolean
  onClose: () => void
  onSaved: () => void
}

const EMPTY: UserFormValues = {
  fullName: "",
  initials: "",
  email: "",
  role: "",
  roleTitle: "",
  roleTitleAr: "",
  team: "",
  teamAr: "",
  isActive: true,
}

/** Create or edit one user. Mount with a key so the form resets per record. */
export default function UserDialog({
  user,
  isSelf = false,
  onClose,
  onSaved,
}: UserDialogProps) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [form, setForm] = useState<UserFormValues>(
    user ? userToFormValues(user) : EMPTY,
  )
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [initialsEdited, setInitialsEdited] = useState(Boolean(user))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof UserFormValues,>(
    field: K,
    value: UserFormValues[K],
  ) => setForm((current) => ({ ...current, [field]: value }))

  const changeName = (value: string) =>
    setForm((current) => ({
      ...current,
      fullName: value,
      // Suggest the initials until the admin types their own.
      initials: initialsEdited ? current.initials : suggestInitials(value),
    }))

  const validate = () => {
    const found: Record<string, string> = {}
    const required = t("common.required")
    if (!form.fullName.trim()) found.fullName = required
    if (!form.initials.trim()) found.initials = required
    if (!form.role) found.role = required
    if (!user) {
      if (!username.trim()) found.username = required
      if (password.length < 8) found.password = t("users.hints.password")
    }
    return found
  }

  const save = async () => {
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify(t("users.requiredFields"), "error")
      return
    }

    setSaving(true)
    try {
      if (user) await usersApi.update(user.id, form)
      else await usersApi.create({ ...form, username, password })
      notify(t(user ? "users.updated" : "users.created"))
      onSaved()
      onClose()
    } catch (cause) {
      setErrors(fieldErrorsOf(cause))
      notify(
        cause instanceof Error ? cause.message : t("common.somethingWrong"),
        "error",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      size="lg"
      title={t(user ? "users.editUser" : "users.newUser")}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={save} loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("users.fields.fullName")}
          required
          htmlFor="user-full-name"
          error={errors.fullName}
        >
          <Input
            id="user-full-name"
            value={form.fullName}
            onChange={(event) => changeName(event.target.value)}
          />
        </Field>
        <Field
          label={t("users.fields.username")}
          required={!user}
          htmlFor="user-username"
          hint={t("users.hints.username")}
          error={errors.username}
        >
          <Input
            id="user-username"
            dir="ltr"
            autoComplete="off"
            value={user ? user.username : username}
            disabled={Boolean(user)}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>
        <Field
          label={t("users.fields.initials")}
          required
          htmlFor="user-initials"
          hint={t("users.hints.initials")}
          error={errors.initials}
        >
          <Input
            id="user-initials"
            dir="ltr"
            maxLength={6}
            value={form.initials}
            onChange={(event) => {
              setInitialsEdited(true)
              set("initials", event.target.value.toUpperCase())
            }}
          />
        </Field>
        <Field
          label={t("users.fields.email")}
          htmlFor="user-email"
          error={errors.email}
        >
          <Input
            id="user-email"
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </Field>

        <Field
          label={t("users.fields.role")}
          required
          htmlFor="user-role"
          hint={
            isSelf
              ? t("users.hints.self")
              : form.role
                ? t(`users.roleHint.${form.role}`)
                : undefined
          }
          error={errors.role}
        >
          <Select
            id="user-role"
            value={form.role}
            disabled={isSelf}
            onChange={(event) =>
              set("role", event.target.value as UserFormValues["role"])
            }
          >
            <option value="" disabled>
              {t("common.select")}
            </option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`users.role.${role}`)}
              </option>
            ))}
          </Select>
        </Field>
        {user ? (
          <div className="pt-6">
            <Toggle
              checked={form.isActive}
              disabled={isSelf}
              onChange={(checked) => set("isActive", checked)}
              label={t("users.fields.active")}
              hint={t("users.hints.active")}
            />
          </div>
        ) : (
          <PasswordField
            id="user-password"
            label={t("users.fields.password")}
            value={password}
            onChange={setPassword}
            hint={t("users.hints.password")}
            error={errors.password}
          />
        )}

        <Field label={t("users.fields.roleTitle")} htmlFor="user-role-title">
          <Input
            id="user-role-title"
            value={form.roleTitle}
            onChange={(event) => set("roleTitle", event.target.value)}
          />
        </Field>
        <Field
          label={t("users.fields.roleTitleAr")}
          htmlFor="user-role-title-ar"
        >
          <Input
            id="user-role-title-ar"
            dir="rtl"
            value={form.roleTitleAr}
            onChange={(event) => set("roleTitleAr", event.target.value)}
          />
        </Field>
        <Field label={t("users.fields.team")} htmlFor="user-team">
          <Input
            id="user-team"
            value={form.team}
            onChange={(event) => set("team", event.target.value)}
          />
        </Field>
        <Field label={t("users.fields.teamAr")} htmlFor="user-team-ar">
          <Input
            id="user-team-ar"
            dir="rtl"
            value={form.teamAr}
            onChange={(event) => set("teamAr", event.target.value)}
          />
        </Field>

        {!user && (
          <div className="sm:col-span-2">
            <Toggle
              checked={form.isActive}
              onChange={(checked) => set("isActive", checked)}
              label={t("users.fields.active")}
              hint={t("users.hints.active")}
            />
          </div>
        )}
      </div>
    </Dialog>
  )
}
