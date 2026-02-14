import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: any, info: any) { console.error(e, info); }
  render() { return this.state.hasError ? <div>Something went wrong.</div> : this.props.children; }
}