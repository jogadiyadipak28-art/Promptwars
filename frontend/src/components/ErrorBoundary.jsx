import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary — catches render errors in the component tree and shows a
 * graceful fallback instead of a blank page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[200px] rounded-2xl
            bg-red-900/10 border border-red-800/40 p-8 text-center"
          role="alert"
        >
          <div className="text-4xl mb-4">⚽</div>
          <h2 className="text-white font-bold text-lg mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm">
            This section hit an unexpected error. The rest of the app is still running.
          </p>
          <button
            onClick={this.handleReset}
            className="btn-primary text-sm px-5 py-2"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};
