import type { TextareaHTMLAttributes } from "react"

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({ className = "", ...rest }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-md border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink transition-colors placeholder:text-muted/70 focus:border-primary ${className}`}
      {...rest}
    />
  )
}
