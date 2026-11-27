import { lazy } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import SystemStatusPage from "../features/system/pages/SystemStatusPage"

import AppShell from "./layout/AppShell"
import LoginScreen from "./layout/LoginScreen"
import NotFoundPage from "./pages/NotFoundPage"
import RequirePermission from "./RequirePermission"
import { useSession } from "../features/account/hooks/useSession"

const AccountPage = lazy(() => import("../features/account/pages/AccountPage"))
const BanksPage = lazy(() => import("../features/banks/pages/BanksPage"))
const CustomersPage = lazy(() => import("../features/customers/pages/CustomersPage"))
const CustomerHistoryPage = lazy(
  () => import("../features/customers/pages/CustomerHistoryPage"),
)
const ImportPage = lazy(() => import("../features/import/pages/ImportPage"))
const OfferBuilderPage = lazy(
  () => import("../features/offers/pages/OfferBuilderPage"),
)
const OfferDetailsPage = lazy(
  () => import("../features/offers/pages/OfferDetailsPage"),
)
const OffersListPage = lazy(
  () => import("../features/offers/pages/OffersListPage"),
)
const DashboardPage = lazy(() => import("../features/offers/pages/DashboardPage"))
const ProductsPage = lazy(() => import("../features/products/pages/ProductsPage"))
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage"))
const UsersPage = lazy(() => import("../features/users/pages/UsersPage"))

export function AppRouter() {
  const { authenticated, signIn } = useSession()
  const navigate = useNavigate()

  if (!authenticated) {
    // The sign in screen answers every address, so a session that expires on /offers/12 (or the
    // /login redirect after a 401) asks for credentials instead of showing "page not found".
    const handleLogin = async (username: string, password: string) => {
      const signedIn = await signIn(username, password)
      // Always land on the home page, not on the address the user was signed out from.
      if (signedIn) navigate("/", { replace: true })
      return signedIn
    }

    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="offers" element={<OffersListPage />} />
        <Route
          path="offers/new"
          element={
            <RequirePermission permission="offers.write">
              <OfferBuilderPage />
            </RequirePermission>
          }
        />
        <Route path="offers/:id" element={<OfferDetailsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerHistoryPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="banks" element={<BanksPage />} />
        <Route
          path="import"
          element={
            <RequirePermission permission="import.use">
              <ImportPage />
            </RequirePermission>
          }
        />
        <Route
          path="users"
          element={
            <RequirePermission permission="users.manage">
              <UsersPage />
            </RequirePermission>
          }
        />
        <Route
          path="system-status"
          element={
            <RequirePermission permission="system.view">
              <SystemStatusPage />
            </RequirePermission>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
