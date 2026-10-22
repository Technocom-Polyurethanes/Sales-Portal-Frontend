import { registerTransport } from "../lib/api/transport"
import { createMockTransport } from "./transport"

/**
 * Registers the mock transport as the active API implementation.
 *
 * The backend replaces this single registration with an HTTP transport; the
 * feature layers keep talking to the same API modules.
 */
registerTransport(createMockTransport())

export { db } from "./db"
