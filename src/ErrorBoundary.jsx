import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#fff', background: '#0b1020', minHeight: '100vh' }}>
          <h2 style={{ color: '#ff6b6b' }}>Uygulama bir hata ile karşılaştı.</h2>
          <p style={{ color: '#ddd' }}>{this.state.error?.message || 'Bilinmeyen hata'}</p>
          <p style={{ color: '#bbb' }}>Lütfen sayfayı yenileyin veya geliştirici konsolunu kontrol edin.</p>
        </div>
      )
    }
    return this.props.children;
  }
}
