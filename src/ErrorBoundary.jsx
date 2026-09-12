import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const tr = document.documentElement.lang === 'tr';
      return <main style={{ padding: 32, background: '#0b1020', color: '#f4f4fa', minHeight: '100vh' }}>
        <h1>{tr ? 'Uygulama görüntülenemedi.' : 'The application could not be displayed.'}</h1>
        <p role="alert">{tr ? 'Sayfayı yenileyebilirsin. Önceden gönderilmiş bir işlem varsa tekrar imzalamadan önce cüzdanından veya gezginden durumunu kontrol et.' : 'You can reload the page. If you already submitted a transaction, check its status in your wallet or explorer before signing again.'}</p>
        <button type="button" onClick={() => window.location.reload()}>{tr ? 'Sayfayı yenile' : 'Reload page'}</button>
      </main>;
    }
    return this.props.children;
  }
}
