import React from "react";
import { useLocation } from "react-router-dom";

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.error("Error caught in getDerivedStateFromError:", error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  // Reset error state when location key changes (navigation)
  componentDidUpdate(prevProps) {
    if (prevProps.locationKey !== this.props.locationKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-100 text-red-700">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong!</h1>
            <p>Please try refreshing the page.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper functional component to use hooks and pass location key
function ErrorBoundary({ children }) {
  const location = useLocation();
  return (
    <ErrorBoundaryClass key={location.pathname} locationKey={location.key}>
      {children}
    </ErrorBoundaryClass>
  );
}

export default ErrorBoundary;

