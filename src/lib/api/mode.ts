/** True when the app runs against the in-browser mock instead of the real API. */
export function isMockApi(): boolean {
  return (
    import.meta.env.VITE_USE_MOCK === "true" ||
    import.meta.env.VITE_API_MODE === "mock"
  )
}
