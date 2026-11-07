import { useState } from "react"

import PageHeader from "../../../app/layout/PageHeader"
import PagedCards from "../../../components/PagedCards"
import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import SearchField from "../../../components/ui/SearchField"
import Select from "../../../components/ui/Select"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { useSession } from "../../account/hooks/useSession"
import { ROLES, type Role } from "../../account/permissions"
import { USERS_PAGE_SIZE, userToFormValues, usersApi } from "../api"
import ResetPasswordDialog from "../components/ResetPasswordDialog"
import UserCard from "../components/UserCard"
import UserDialog from "../components/UserDialog"
import type { UserRecord, UserStatusFilter } from "../types"

/** Admin only: every account as a card, with create, edit, reset password and deactivate. */
export default function UsersPage() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { user: me } = useSession()
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<Role | "all">("all")
  const [status, setStatus] = useState<UserStatusFilter>("all")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<UserRecord | "new" | undefined>()
  const [resetting, setResetting] = useState<UserRecord | undefined>()
  const [busyId, setBusyId] = useState<string | undefined>()
  const { data, loading, error, reload } = useAsyncData(
    () => usersApi.list({ search, role, status, page }),
    [search, role, status, page],
  )

  const hasFilters = search.trim() !== "" || role !== "all" || status !== "all"
  const clearFilters = () => {
    setSearch("")
    setRole("all")
    setStatus("all")
    setPage(1)
  }

  const toggleActive = async (user: UserRecord) => {
    setBusyId(user.id)
    try {
      await usersApi.update(user.id, {
        ...userToFormValues(user),
        isActive: !user.isActive,
      })
      notify(t("users.updated"))
      reload()
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : t("common.somethingWrong"),
        "error",
      )
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <>
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        action={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={18} />}
            onClick={() => setEditing("new")}
          >
            {t("users.newUser")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder={t("users.search")}
        />
        <div className="w-full sm:w-44">
          <Select
            aria-label={t("users.fields.role")}
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | "all")
              setPage(1)
            }}
          >
            <option value="all">{t("users.allRoles")}</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {t(`users.role.${value}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label={t("common.status")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as UserStatusFilter)
              setPage(1)
            }}
          >
            <option value="all">{t("users.allStatuses")}</option>
            <option value="active">{t("users.active")}</option>
            <option value="inactive">{t("users.inactive")}</option>
          </Select>
        </div>
      </div>

      <PagedCards
        data={data}
        loading={loading}
        error={error}
        rowKey={(user) => user.id}
        skeletonCount={USERS_PAGE_SIZE / 2}
        renderCard={(user) => (
          <UserCard
            user={user}
            isSelf={user.id === me?.id}
            busy={busyId === user.id}
            onEdit={setEditing}
            onResetPassword={setResetting}
            onToggleActive={toggleActive}
          />
        )}
        onPageChange={setPage}
        onRetry={reload}
        query={search}
        onClearSearch={() => {
          setSearch("")
          setPage(1)
        }}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
        createLabel={t("users.newUser")}
        onCreate={() => setEditing("new")}
        emptyTitle={t("users.empty")}
      />

      {editing && (
        <UserDialog
          key={editing === "new" ? "new" : editing.id}
          user={editing === "new" ? undefined : editing}
          isSelf={editing !== "new" && editing.id === me?.id}
          onClose={() => setEditing(undefined)}
          onSaved={reload}
        />
      )}

      {resetting && (
        <ResetPasswordDialog
          key={resetting.id}
          user={resetting}
          onClose={() => setResetting(undefined)}
        />
      )}
    </>
  )
}
