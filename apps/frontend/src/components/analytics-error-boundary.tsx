'use client'

import React, { Component } from 'react'

interface Props {
  children: React.ReactNode
  trackError?: (error: { type: string; message: string; messageFull?: string; stack?: string; pagePath?: string }) => void
}

interface State {
  hasError: boolean
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.trackError?.({
      type: 'js_error',
      message: error.message?.slice(0, 255) || 'React render error',
      messageFull: error.message,
      stack: error.stack,
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Une erreur est survenue.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
