import { describe, expect, it } from "vitest"

import { createSseParser } from "./sse"

describe("createSseParser", () => {
  it("parses a named event with data", () => {
    const parser = createSseParser()
    expect(parser.push('event: change\ndata: {"topics":["offers"]}\n\n')).toEqual([
      { event: "change", data: '{"topics":["offers"]}' },
    ])
  })

  it("defaults the event name to message", () => {
    expect(createSseParser().push("data: hi\n\n")).toEqual([{ event: "message", data: "hi" }])
  })

  it("handles chunks that end in the middle of a line", () => {
    const parser = createSseParser()
    expect(parser.push("event: cha")).toEqual([])
    expect(parser.push("nge\ndata: {\"a\"")).toEqual([])
    expect(parser.push(":1}\n")).toEqual([])
    expect(parser.push("\n")).toEqual([{ event: "change", data: '{"a":1}' }])
  })

  it("handles CRLF, including a CRLF split between two chunks", () => {
    const parser = createSseParser()
    expect(parser.push("event: ready\r\ndata: {}\r")).toEqual([])
    expect(parser.push("\n\r\n")).toEqual([{ event: "ready", data: "{}" }])
  })

  it("handles lone CR line endings", () => {
    expect(createSseParser().push("data: x\r\r")).toEqual([{ event: "message", data: "x" }])
  })

  it("ignores comments (keep-alives) and blocks without data", () => {
    const parser = createSseParser()
    expect(parser.push(": ping\n\n")).toEqual([])
    expect(parser.push("retry: 1000\n\n")).toEqual([])
    expect(parser.push("event: lonely\n\n")).toEqual([])
    // The ignored block must not leak its event name into the next one.
    expect(parser.push("data: next\n\n")).toEqual([{ event: "message", data: "next" }])
  })

  it("joins multi-line data with newlines", () => {
    expect(createSseParser().push("data: a\ndata: b\n\n")).toEqual([
      { event: "message", data: "a\nb" },
    ])
  })

  it("strips only one leading space and a leading BOM", () => {
    expect(createSseParser().push("﻿data:  two\n\n")).toEqual([
      { event: "message", data: " two" },
    ])
  })

  it("returns several events from one chunk", () => {
    const messages = createSseParser().push("data: 1\n\ndata: 2\n\n")
    expect(messages.map((m) => m.data)).toEqual(["1", "2"])
  })
})
