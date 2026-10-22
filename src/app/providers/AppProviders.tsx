import type { ReactNode } from "react"
import { BrowserRouter } from "react-router-dom"

import { ToastProvider } from "../../components/ui/ToastProvider"
import { I18nProvider } from "../../i18n/I18nProvider"
import { PdfLanguageProvider } from "../../pdf/PdfLanguageProvider"
import { SessionProvider } from "../../features/account/SessionProvider"

export type AppProvidersProps = {
  children: ReactNode
}

/** Every application wide provider, composed in one place. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <PdfLanguageProvider>
        <ToastProvider>
          <SessionProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </SessionProvider>
        </ToastProvider>
      </PdfLanguageProvider>
    </I18nProvider>
  )
}
