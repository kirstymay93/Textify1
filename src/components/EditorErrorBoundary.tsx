import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class EditorErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Editor crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-red-500">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground">
              The editor encountered an error.
            </p>

            <button
              className="mt-3 px-4 py-2 rounded-md bg-black text-white"
              onClick={() => this.setState({ hasError: false })}
            >
              Reload editor
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EditorErrorBoundary;