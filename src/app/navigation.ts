import type { IconName } from "../components/ui/Icon"
import type { TranslationKey } from "../i18n/types"

export type NavItem = {
  to: string
  labelKey: TranslationKey
  icon: IconName
}

/** Primary navigation, shared by the sidebar and the mobile bottom bar. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: "home" },
  { to: "/offers", labelKey: "nav.offers", icon: "offers" },
  { to: "/customers", labelKey: "nav.customers", icon: "customers" },
  { to: "/products", labelKey: "nav.products", icon: "products" },
  { to: "/import", labelKey: "nav.import", icon: "import" },
  { to: "/settings", labelKey: "nav.settings", icon: "settings" },
]

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
  { prefix: "/import", labelKey: "import.title" },
  { prefix: "/settings", labelKey: "settings.title" },
  { prefix: "/account", labelKey: "account.title" },
]

/** Translation key of the page matching a pathname. */
export function labelForPath(pathname: string): TranslationKey | undefined {
  if (pathname === "/") return "nav.home"
  return PATH_LABELS.find((entry) => pathname.startsWith(entry.prefix))
    ?.labelKey
}
