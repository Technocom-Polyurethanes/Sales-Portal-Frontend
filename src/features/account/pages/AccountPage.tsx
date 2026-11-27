import { useEffect, useState } from "react"
import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../i18n/types"
import { live, type LiveStatus } from "../../../lib/live"
import { usePermissions } from "../hooks/usePermissions"

const STATUS_KEYS: Record<LiveStatus, TranslationKey> = {
  idle: "account.liveStatus.unavailable",
  connecting: "account.liveStatus.reconnecting",
  live: "account.liveStatus.connected",
  offline: "account.liveStatus.reconnecting",
  unsupported: "account.liveStatus.unavailable",
}

export default function AccountPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [status, setStatus] = useState<LiveStatus>(() => live.getStatus())

  useEffect(() => {
    if (!can("users.manage")) return
    setStatus(live.getStatus())
    return live.onStatus(setStatus)
  }, [can])

  return (
    <>
      {can("users.manage") && (
        <p role="status" className="mb-4 text-xs text-muted">
          {t("account.liveUpdates", { status: t(STATUS_KEYS[status]) })}
        </p>
      )}
      <PhasePlaceholder
        title={t("account.title")}
        description={t("account.subtitle")}
        phase="Phase 3 — customers, products, import, settings and account"
        icon={<Icon name="user" size={30} />}
      />
    </>
  )
}
