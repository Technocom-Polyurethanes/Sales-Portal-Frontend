import type { Transport } from "./types"

let transport: Transport | null = null

/**
 * Registers the transport used by the whole application. The mock transport is
 * registered by `src/mock`; a backend implementation replaces it without any
 * change in the feature layers.
 */
export function registerTransport(next: Transport): void {
  transport = next
}

export function getTransport(): Transport {
  if (!transport) {
    throw new Error(
      'No API transport registered. Import "@/mock" before using the API layer.',
    )
  }
  return transport
}
