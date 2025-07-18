import { Component } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // You can also log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-xl w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 sm:p-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-b border-red-100 dark:border-red-900/20">
              <div className="flex items-center justify-center space-x-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 dark:text-red-400 animate-bounce" />
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Oops! Something went wrong
                </h2>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  We're sorry for the inconvenience. Our team has been notified of this issue.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Please try refreshing the page or contact support if the problem persists.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Refresh Page
                  </button>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl overflow-auto">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Error Details:</h3>
                    <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono">
                      {this.state.error && this.state.error.toString()}
                    </pre>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-auto">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">Component Stack:</h3>
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;