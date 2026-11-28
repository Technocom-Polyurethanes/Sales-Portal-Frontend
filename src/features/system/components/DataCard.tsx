import { Link } from "react-router-dom"

import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber } from "../../../lib/formatters/relative"
import type { SystemData } from "../types"

import StatusCard from "./StatusCard"

export default function DataCard({
  data,
  locale,
}: {
  data?: SystemData
  locale: Locale
}) {
  const { t } = useTranslation()
  const items = [
    {
      key: "offers",
      label: t("system.labels.offers"),
      to: "/offers",
      value: data?.offers,
    },
    {
      key: "customers",
      label: t("system.labels.customers"),
      to: "/customers",
      value: data?.customers,
    },
    {
      key: "materials",
      label: t("system.labels.materials"),
      to: "/products",
      value: data?.materials,
    },
    {
      key: "users",
      label: t("system.labels.users"),
      to: "/users",
      value: data?.activeUsers,
    },
  ]

  return (
    <StatusCard
      title={t("system.cards.data")}
      headline={data?.offers == null ? "—" : formatNumber(data.offers, locale)}
    >
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="min-w-0 rounded-lg border border-line-soft bg-page p-3"
          >
            <dt className="truncate text-xs text-muted">{item.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
              <Link
                className="inline-flex min-h-6 items-center hover:text-primary hover:underline"
                to={item.to}
              >
                {item.value == null ? "—" : formatNumber(item.value, locale)}
              </Link>
            </dd>
          </div>
        ))}
      </dl>
    </StatusCard>
  )
}
