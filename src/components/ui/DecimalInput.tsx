import { useEffect, useState } from "react"

import Input, { type InputProps } from "./Input"

export type DecimalInputProps = Omit<InputProps, "value" | "onChange" | "type"> & {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
}

const toText = (value: number) => (value === 0 ? "" : String(value))

/** Number input that lets the user type "0.", "10.5" and an empty field. */
export default function DecimalInput({
  value,
  onValueChange,
  min = 0,
  max,
  ...rest
}: DecimalInputProps) {
  const [text, setText] = useState(toText(value))

  useEffect(() => {
    const current = text === "" || text === "." ? 0 : Number(text)
    if (current !== value) {
      setText(toText(value))
    }
  }, [value])

  return (
    <Input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(event) => {
        const raw = event.target.value.replace(",", ".").replace(/[^0-9.]/g, "")
        if ((raw.match(/\./g) ?? []).length > 1) return
        setText(raw)
        const parsed = raw === "" || raw === "." ? 0 : Number(raw)
        if (Number.isNaN(parsed)) return
        const upper = max ?? Number.POSITIVE_INFINITY
        onValueChange(Math.min(upper, Math.max(min, parsed)))
      }}
    />
  )
}
