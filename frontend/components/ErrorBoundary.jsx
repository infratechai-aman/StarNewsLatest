'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * Error Boundary component to catch and handle React rendering errors gracefully.
 * Prevents a single component crash from taking down the entire application.
 *
 * Usage:
 *   <ErrorBoundary fallbackMessage="Failed to load news">
 *     <NewsPage />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-red-50 rounded-2xl border border-red-100 m-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="rounded-full border-red-200 text-red-600 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
