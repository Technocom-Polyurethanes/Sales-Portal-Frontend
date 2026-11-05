import { useEffect, useState } from "react"

/**
 * How many rows fit in the container. Returns 0 until the container has been measured, so a
 * caller can wait for the real size instead of fetching a page it would immediately replace.
 */
export function useFitRowsPageSize(
  containerRef: React.RefObject<HTMLElement | null>,
  headerHeight = 44,
  rowHeight = 48,
  padding = 0,
  enabled = true,
): number {
  const [pageSize, setPageSize] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const element = containerRef.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      const available = rect.height - headerHeight - padding
      if (available <= 0) {
        setPageSize(10)
        return
      }
      const size = Math.max(1, Math.floor(available / rowHeight))
      setPageSize(size)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [containerRef, headerHeight, rowHeight, padding, enabled])

  return pageSize
}
