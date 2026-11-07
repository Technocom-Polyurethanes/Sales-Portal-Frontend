import type { IconName } from "../components/ui/Icon"
import type { Permission } from "../features/account/permissions"
import type { TranslationKey } from "../i18n/types"

export type NavItem = {
  to: string
  labelKey: TranslationKey
  icon: IconName
  /** Shown only to roles holding this permission; every role sees an item without one. */
  permission?: Permission
}

/** Primary navigation, shared by the sidebar and the mobile bottom bar. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: "home" },
  { to: "/offers", labelKey: "nav.offers", icon: "offers" },
  { to: "/customers", labelKey: "nav.customers", icon: "customers" },
  { to: "/products", labelKey: "nav.products", icon: "products" },
  { to: "/banks", labelKey: "nav.banks", icon: "bank" },
  { to: "/import", labelKey: "nav.import", icon: "import", permission: "import.use" },
  { to: "/users", labelKey: "nav.users", icon: "user", permission: "users.manage" },
  { to: "/settings", labelKey: "nav.settings", icon: "settings" },
]

/** The items a role may see. */
export function visibleNavItems(
  items: NavItem[],
  can: (permission: Permission) => boolean,
): NavItem[] {
  return items.filter((item) => !item.permission || can(item.permission))
}

/** Items shown in the mobile bottom bar. */
export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.slice(0, 4)

type PathLabel = {
  prefix: string
  labelKey: TranslationKey
}

/** Breadcrumb labels, matched from the most specific path first. */
const PATH_LABELS: PathLabel[] = [
  { prefix: "/offers/new", labelKey: "offers.builder.title" },
  { prefix: "/offers", labelKey: "offers.list.title" },
  { prefix: "/customers", labelKey: "customers.title" },
  { prefix: "/products", labelKey: "products.title" },
  { prefix: "/banks", labelKey: "banks.title" },
  { prefix: "/import", labelKey: "import.title" },
  { prefix: "/users", labelKey: "users.title" },
  { prefix: "/settings", labelKey: "settings.title" },
  { prefix: "/account", labelKey: "account.title" },
]

/** Translation key of the page matching a pathname. */
export function labelForPath(pathname: string): TranslationKey | undefined {
  if (pathname === "/") return "nav.home"
  return PATH_LABELS.find((entry) => pathname.startsWith(entry.prefix))
    ?.labelKey
}
