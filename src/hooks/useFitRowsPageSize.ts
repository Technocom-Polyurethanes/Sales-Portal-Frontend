import { useEffect, useState } from "react"

export function useFitRowsPageSize(
  containerRef: React.RefObject<HTMLElement | null>,
  headerHeight = 44,
  rowHeight = 48,
  padding = 0,
): number {
  const [pageSize, setPageSize] = useState(8)

  useEffect(() => {
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
  }, [containerRef, headerHeight, rowHeight, padding])

  return pageSize
}
