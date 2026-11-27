import { Component, type ReactNode } from "react"

import Button from "../components/ui/Button"

type RouteErrorBoundaryProps = {
  children: ReactNode
  message: string
  retryLabel: string
}

type RouteErrorBoundaryState = {
  failed: boolean
}

/** Keeps a failed lazy route from blanking the whole workspace. */
export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div
        role="alert"
        className="rounded-lg border border-line-soft bg-surface px-4 py-10 text-center"
      >
        <p className="text-sm text-ink">{this.props.message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          {this.props.retryLabel}
        </Button>
      </div>
    )
  }
}
