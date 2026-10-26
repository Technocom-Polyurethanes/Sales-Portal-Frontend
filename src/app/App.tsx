import { AppProviders } from "./providers/AppProviders"
import { AppRouter } from "./router"

async function setupTransport() {
  const mode = import.meta.env.VITE_API_MODE
  if (mode === "mock") {
    await import("@/mock")
    return
  }
  const { createHttpTransport, registerTransport } = await import(
    "@/lib/api/transport"
  )
  registerTransport(createHttpTransport())
}

if (typeof window !== "undefined") {
  setupTransport()
}

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

