import { useState } from 'react'
import { Button } from '@/components/ui/button'
import './App.css'

function App() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="topbar__brand">SoMe</div>
      </header>

      <main className="feed-layout">
        <section className="composer-card">
          <h1>Del et opslag</h1>
          <p>
            Her kan brugere skrive opslag, som andre senere kan kommentere pa.
          </p>

          <div className="composer-placeholder">
            Hvad har du pa hjertet i dag?
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
