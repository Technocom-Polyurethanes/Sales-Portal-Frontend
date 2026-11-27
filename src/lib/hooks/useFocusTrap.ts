import { useEffect, type RefObject } from "react"

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")

/** Keeps Tab inside an open dialog and restores focus to its trigger on close. */
export function useFocusTrap(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    const previousFocus = document.activeElement as HTMLElement | null
    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))

    ;(focusable()[0] ?? container).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return
      const items = focusable()
      if (items.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === container)
      ) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      previousFocus?.focus()
    }
  }, [active, ref])
}
