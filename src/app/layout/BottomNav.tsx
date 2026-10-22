import { NavLink } from "react-router-dom"

import { BOTTOM_NAV_ITEMS } from "../navigation"
import { useTranslation } from "../../i18n/I18nProvider"
import Icon from "../../components/ui/Icon"

export type BottomNavProps = {
  onOpenMore?: () => void
}

/** Mobile navigation bar shown below the `lg` breakpoint. */
export default function BottomNav({ onOpenMore }: BottomNavProps) {
  const { t } = useTranslation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
              isActive ? "text-primary" : "text-muted"
            }`
          }
        >
          <Icon name={item.icon} size={20} />
          {t(item.labelKey)}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted transition-colors"
      >
        <Icon name="settings" size={20} />
        {t("common.more")}
      </button>
    </nav>
  )
}
