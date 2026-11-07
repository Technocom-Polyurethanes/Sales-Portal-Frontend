import { describe, expect, it } from "vitest"

import { ApiError } from "../../lib/api/types"
import { fieldErrorsOf, suggestInitials } from "./fieldErrors"

describe("fieldErrorsOf", () => {
  it("keys the first message of each field by its form name", () => {
    const error = new ApiError("Bad", 400, {
      errors: {
        username: ["Taken.", "Other."],
        FullName: ["Required."],
        "$.password": ["Too short."],
      },
    })

    expect(fieldErrorsOf(error)).toEqual({
      username: "Taken.",
      fullName: "Required.",
      password: "Too short.",
    })
  })

  it("is empty for an error without field messages", () => {
    expect(fieldErrorsOf(new ApiError("Bad", 409))).toEqual({})
    expect(fieldErrorsOf(new Error("x"))).toEqual({})
  })
})

describe("suggestInitials", () => {
  it("takes the first letter of each name, upper case, at most three", () => {
    expect(suggestInitials("Jane doe")).toBe("JD")
    expect(suggestInitials("  amgad  mohamed  anwar  ali ")).toBe("AMA")
    expect(suggestInitials("")).toBe("")
  })
})
