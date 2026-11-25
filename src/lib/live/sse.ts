/**
 * A parser for the Server-Sent Events wire format. The browser's EventSource does this itself,
 * but it cannot send an Authorization header, so the stream is read with fetch and parsed here.
 */

export type SseMessage = {
  /** The `event:` name, or "message" when the server did not name it. */
  event: string
  data: string
}

export type SseParser = {
  /** Feeds the next piece of text. Pieces may end anywhere, even in the middle of a line. */
  push: (chunk: string) => SseMessage[]
}

export function createSseParser(): SseParser {
  let buffer = ""
  let started = false
  let skipLeadingLineFeed = false
  let event = ""
  let data: string[] = []

  const dispatch = (messages: SseMessage[]) => {
    // A block with no data line is not an event (comment-only blocks, or a lone "retry:").
    if (data.length > 0) {
      messages.push({ event: event || "message", data: data.join("\n") })
    }
    event = ""
    data = []
  }

  const handleLine = (line: string, messages: SseMessage[]) => {
    if (line === "") {
      dispatch(messages)
      return
    }
    if (line.startsWith(":")) return

    const colon = line.indexOf(":")
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? "" : line.slice(colon + 1)
    if (value.startsWith(" ")) value = value.slice(1)

    if (field === "event") event = value
    else if (field === "data") data.push(value)
    // "id" and "retry" are not used: reconnecting is handled by the live client.
  }

  return {
    push(chunk) {
      let text = chunk
      if (!started) {
        started = true
        if (text.startsWith("﻿")) text = text.slice(1)
      }
      // A "\r\n" can be split between two chunks; the "\n" that starts the next one is the same break.
      if (skipLeadingLineFeed && text.startsWith("\n")) text = text.slice(1)
      skipLeadingLineFeed = false

      buffer += text
      const messages: SseMessage[] = []

      let start = 0
      for (let index = 0; index < buffer.length; index += 1) {
        const char = buffer[index]
        if (char !== "\n" && char !== "\r") continue

        handleLine(buffer.slice(start, index), messages)
        if (char === "\r") {
          if (buffer[index + 1] === "\n") index += 1
          else if (index + 1 === buffer.length) skipLeadingLineFeed = true
        }
        start = index + 1
      }

      buffer = buffer.slice(start)
      return messages
    },
  }
}
