import Icon from "./Icon"

export type ToastItem = {
  id: number
  message: string
  tone: "success" | "info" | "warning"
}

export type ToastProps = {
  toast: ToastItem
  onDismiss: (id: number) => void
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink shadow-lg"
    >
      <span className="text-success">
        <Icon name="check" size={18} />
      </span>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-muted transition-colors hover:text-ink"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
