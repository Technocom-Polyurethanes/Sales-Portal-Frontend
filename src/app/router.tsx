import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import AppShell from "./layout/AppShell"
import LoginScreen from "./layout/LoginScreen"
import NotFoundPage from "./pages/NotFoundPage"
import { useSession } from "../features/account/hooks/useSession"
import AccountPage from "../features/account/pages/AccountPage"
import CustomersPage from "../features/customers/pages/CustomersPage"
import ImportPage from "../features/import/pages/ImportPage"
import OfferBuilderPage from "../features/offers/pages/OfferBuilderPage"
import OfferDetailsPage from "../features/offers/pages/OfferDetailsPage"
import OffersListPage from "../features/offers/pages/OffersListPage"
import DashboardPage from "../features/offers/pages/DashboardPage"
import ProductsPage from "../features/products/pages/ProductsPage"
import SettingsPage from "../features/settings/pages/SettingsPage"

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
        <Route path="offers/new" element={<OfferBuilderPage />} />
        <Route path="offers/:id" element={<OfferDetailsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
