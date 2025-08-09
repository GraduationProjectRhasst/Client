import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
    return (
        <div style={{fontFamily:'system-ui', padding:24}}>
        <h1>Electron + React</h1>
        <p>Xin chào từ Desktop App!</p>
        <p>window.api.ping(): {window.api?.ping?.()}</p>
        </div>
    )
}

createRoot(document.getElementById('root')).render(<App />)